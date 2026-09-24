import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import type { GestureMode, Point } from "../features/handTracking/types";

import type { Sketch } from "../features/modeling/sketchTypes";

import ActiveSketch from "./scene/ActiveSketch";
import SavedSketch from "./scene/SavedSketch";

type SceneViewportProps = {
  mode: GestureMode;
  pointer: Point | null;

  viewportWidth: number;
  viewportHeight: number;

  sketches: Sketch[];

  finishSignal: number;

  onFinishSketch: (sketch: Sketch) => void;
};

export default function SceneViewport({
  mode,
  pointer,
  viewportWidth,
  viewportHeight,
  sketches,
  finishSignal,
  onFinishSketch,
}: SceneViewportProps) {
  return (
    <Canvas
      gl={{
        alpha: true,
        antialias: true,
      }}
      camera={{
        position: [0, 0, 5],
        fov: 45,
        near: 0.1,
        far: 100,
      }}
      style={{
        width: "100%",
        height: "100%",
        background: "transparent",
      }}
    >
      <ambientLight intensity={1.5} />

      <directionalLight position={[5, 5, 5]} intensity={2} />

      {/* Reeds afgeronde sketches */}
      {sketches.map((sketch) => (
        <SavedSketch key={sketch.id} sketch={sketch} />
      ))}

      {/*
        De actieve sketch.

        Door key te koppelen aan sketches.length
        wordt na Finish Sketch een volledig nieuwe
        ActiveSketch aangemaakt.

        Die nieuwe sketch neemt daardoor de huidige
        camera-oriëntatie over.
      */}
      <ActiveSketch
        key={sketches.length}
        mode={mode}
        pointer={pointer}
        viewportWidth={viewportWidth}
        viewportHeight={viewportHeight}
        finishSignal={finishSignal}
        onFinish={onFinishSketch}
      />

      {/*
        Hand gesture waarmee we rond de world origin draaien.
      */}
      <HandOrbit mode={mode} pointer={pointer} />

      {/*
        Muisbesturing.

        Heel belangrijk:
        target is exact hetzelfde middelpunt als HandOrbit.
      */}
      <OrbitControls
        enabled={mode !== "rotate"}
        target={[0, 0, 0]}
        enablePan={false}
        enableZoom={true}
        enableRotate={true}
        minDistance={2}
        maxDistance={12}
      />
    </Canvas>
  );
}

type HandOrbitProps = {
  mode: GestureMode;
  pointer: Point | null;
};

function HandOrbit({ mode, pointer }: HandOrbitProps) {
  const { camera } = useThree();

  /*
    Het middelpunt waar we ALTIJD omheen draaien.
  */
  const target = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  /*
    Vorige handpositie.

    Hiermee bepalen we hoeveel de hand sinds
    het vorige frame verplaatst is.
  */
  const lastPointer = useRef<Point | null>(null);

  /*
    Huidige spherical coordinaten van de camera.
  */
  const currentTheta = useRef(0);
  const currentPhi = useRef(Math.PI / 2);
  const radius = useRef(5);

  /*
    Waar we naartoe willen bewegen.

    Door current langzaam richting target te bewegen
    krijgen we de vloeiende beweging.
  */
  const targetTheta = useRef(0);
  const targetPhi = useRef(Math.PI / 2);

  /*
    Houd bij of we het vorige frame al in rotate mode waren.
  */
  const wasRotating = useRef(false);

  /*
    Zodra rotate begint synchroniseren we onze spherical
    coordinaten met de WERKELIJKE camerapositie.

    Dit is belangrijk omdat OrbitControls de camera met
    de muis ook kan hebben verplaatst.
  */
  useEffect(() => {
    const isRotating = mode === "rotate" && pointer !== null;

    if (!isRotating) {
      lastPointer.current = null;
      wasRotating.current = false;
      return;
    }

    /*
      We zijn zojuist begonnen met draaien.
    */
    if (!wasRotating.current) {
      const offset = camera.position.clone().sub(target);

      const spherical = new THREE.Spherical().setFromVector3(offset);

      currentTheta.current = spherical.theta;
      currentPhi.current = spherical.phi;

      targetTheta.current = spherical.theta;
      targetPhi.current = spherical.phi;

      radius.current = spherical.radius;

      lastPointer.current = pointer;
      wasRotating.current = true;

      return;
    }

    /*
      Er is nog geen vorige pointer.
    */
    if (!lastPointer.current) {
      lastPointer.current = pointer;
      return;
    }

    const dx = pointer.x - lastPointer.current.x;

    const dy = pointer.y - lastPointer.current.y;

    /*
      Pas dit eventueel later aan.

      Lager = langzamer
      Hoger = sneller
    */
    const sensitivity = 0.005;

    /*
      Horizontale handbeweging
      -> rond Y-as draaien
    */
    targetTheta.current -= dx * sensitivity;

    /*
      Verticale handbeweging
      -> boven/onder het object bewegen
    */
    targetPhi.current += dy * sensitivity;

    /*
      Voorkom dat de camera exact over de
      bovenste/onderste pool gaat.

      Anders kan de camera plotseling flippen.
    */
    const minPhi = 0.15;
    const maxPhi = Math.PI - 0.15;

    targetPhi.current = THREE.MathUtils.clamp(
      targetPhi.current,
      minPhi,
      maxPhi,
    );

    lastPointer.current = pointer;
  }, [mode, pointer, camera, target]);

  /*
    Wordt ieder Three.js-frame uitgevoerd.

    Hier maken we de beweging vloeiend.
  */
  useFrame(() => {
    if (!wasRotating.current) {
      return;
    }

    /*
      Hoe hoger dit getal,
      hoe directer de beweging reageert.

      0.10 - 0.15 voelt meestal prettig.
    */
    const smoothing = 0.12;

    currentTheta.current = THREE.MathUtils.lerp(
      currentTheta.current,
      targetTheta.current,
      smoothing,
    );

    currentPhi.current = THREE.MathUtils.lerp(
      currentPhi.current,
      targetPhi.current,
      smoothing,
    );

    const spherical = new THREE.Spherical(
      radius.current,
      currentPhi.current,
      currentTheta.current,
    );

    const offset = new THREE.Vector3().setFromSpherical(spherical);

    /*
      Camera blijft altijd op dezelfde afstand
      rondom target bewegen.
    */
    camera.position.copy(target.clone().add(offset));

    /*
      Camera blijft altijd naar het midden kijken.
    */
    camera.lookAt(target);

    camera.updateMatrixWorld();
  });

  return null;
}
