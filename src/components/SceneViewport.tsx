import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useEffect, useRef } from "react";
import * as THREE from "three";

import type { GestureMode, Point } from "../features/handTracking/types";

type SceneViewportProps = {
  mode: GestureMode;
  pointer: Point | null;
};

export default function SceneViewport({ mode, pointer }: SceneViewportProps) {
  return (
    <Canvas
      gl={{
        alpha: true,
        antialias: true,
      }}
      camera={{
        position: [0, 2, 5],
        fov: 45,
      }}
      style={{
        width: "100%",
        height: "100%",
        background: "transparent",
      }}
    >
      <ambientLight intensity={1.5} />

      <directionalLight position={[5, 5, 5]} intensity={2} />

      <mesh>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="#22c55e" transparent opacity={0.75} />
      </mesh>

      <HandOrbit mode={mode} pointer={pointer} />

      <OrbitControls enabled={mode !== "rotate"} />
    </Canvas>
  );
}

type HandOrbitProps = {
  mode: GestureMode;
  pointer: Point | null;
};

function HandOrbit({ mode, pointer }: HandOrbitProps) {
  const { camera } = useThree();

  const lastPointer = useRef<Point | null>(null);

  const spherical = useRef(
    new THREE.Spherical().setFromVector3(camera.position.clone()),
  );

  const targetTheta = useRef(spherical.current.theta);
  const targetPhi = useRef(spherical.current.phi);

  const currentTheta = useRef(spherical.current.theta);
  const currentPhi = useRef(spherical.current.phi);

  const radius = useRef(spherical.current.radius);

  useEffect(() => {
    if (mode !== "rotate" || !pointer) {
      lastPointer.current = null;
      return;
    }

    if (!lastPointer.current) {
      lastPointer.current = pointer;
      return;
    }

    const dx = pointer.x - lastPointer.current.x;
    const dy = pointer.y - lastPointer.current.y;

    const sensitivity = 0.006;

    targetTheta.current -= dx * sensitivity;
    targetPhi.current += dy * sensitivity;

    // Voorkomt dat we exact over de boven- of onderpool gaan
    targetPhi.current = THREE.MathUtils.clamp(
      targetPhi.current,
      0.15,
      Math.PI - 0.15,
    );

    lastPointer.current = pointer;
  }, [mode, pointer]);

  useFrame(() => {
    // Smoothing
    currentTheta.current = THREE.MathUtils.lerp(
      currentTheta.current,
      targetTheta.current,
      0.12,
    );

    currentPhi.current = THREE.MathUtils.lerp(
      currentPhi.current,
      targetPhi.current,
      0.12,
    );

    const theta = currentTheta.current;
    const phi = currentPhi.current;
    const r = radius.current;

    camera.position.x = r * Math.sin(phi) * Math.sin(theta);

    camera.position.y = r * Math.cos(phi);

    camera.position.z = r * Math.sin(phi) * Math.cos(theta);

    camera.lookAt(0, 0, 0);
  });

  return null;
}
