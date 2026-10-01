import { Canvas, useFrame, useThree } from "@react-three/fiber";

import { OrbitControls } from "@react-three/drei";

import { useEffect, useMemo, useRef, useState } from "react";

import * as THREE from "three";

import type {
  DrawingMode,
  GestureMode,
  Point,
} from "../features/handTracking/types";

import type { Sketch, SketchStroke } from "../features/modeling/sketchTypes";

import ActiveSketch from "./scene/ActiveSketch";
import SavedSketch from "./scene/SavedSketch";
import HandSelection from "./scene/HandSelection";
import HandResize from "./scene/HandResize";

type SceneViewportProps = {
  mode: GestureMode;

  drawingMode: DrawingMode;

  pointer: Point | null;

  secondPointer: Point | null;

  viewportWidth: number;

  viewportHeight: number;

  sketches: Sketch[];

  finishSignal: number;

  deselectSignal: number;

  onFinishSketch: (sketch: Sketch) => void;

  onUpdateStroke: (
    strokeId: string,

    updater: (stroke: SketchStroke) => SketchStroke,
  ) => void;

  onSelectionProgressChange: (progress: number) => void;

  onSelectionStateChange: (isSelected: boolean) => void;

  onSelectedStrokeChange: (strokeId: string | null) => void;
};

export default function SceneViewport({
  mode,

  drawingMode,

  pointer,
  secondPointer,

  viewportWidth,
  viewportHeight,

  sketches,

  finishSignal,
  deselectSignal,

  onFinishSketch,
  onUpdateStroke,

  onSelectionProgressChange,
  onSelectionStateChange,
  onSelectedStrokeChange,
}: SceneViewportProps) {
  const selectableRoot = useRef<THREE.Group>(null);

  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    onSelectionStateChange(selectedId !== null);

    onSelectedStrokeChange(selectedId);
  }, [selectedId, onSelectionStateChange, onSelectedStrokeChange]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      setSelectedId(null);

      setHoveredId(null);

      onSelectionProgressChange(0);
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onSelectionProgressChange]);

  useEffect(() => {
    if (deselectSignal === 0) {
      return;
    }

    setSelectedId(null);
    setHoveredId(null);

    onSelectionProgressChange(0);
  }, [deselectSignal, onSelectionProgressChange]);

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

      <group ref={selectableRoot}>
        {sketches.map((sketch) => (
          <SavedSketch
            key={sketch.id}
            sketch={sketch}
            hoveredId={hoveredId}
            selectedId={selectedId}
          />
        ))}
      </group>

      <ActiveSketch
        mode={mode}
        drawingMode={drawingMode}
        pointer={pointer}
        viewportWidth={viewportWidth}
        viewportHeight={viewportHeight}
        finishSignal={finishSignal}
        onFinish={onFinishSketch}
      />

      <HandSelection
        mode={mode}
        pointer={pointer}
        viewportWidth={viewportWidth}
        viewportHeight={viewportHeight}
        selectableRoot={selectableRoot}
        selectedId={selectedId}
        onHoverChange={setHoveredId}
        onSelectionChange={setSelectedId}
        onProgressChange={onSelectionProgressChange}
      />

      <HandResize
        mode={mode}
        pointer={pointer}
        secondPointer={secondPointer}
        selectedId={selectedId}
        sketches={sketches}
        onUpdateStroke={onUpdateStroke}
      />

      <HandOrbit mode={mode} pointer={pointer} />

      <OrbitControls
        enabled={mode !== "rotate" && mode !== "resize"}
        target={[0, 0, 0]}
        enablePan={false}
        enableZoom
        enableRotate
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

  const target = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  const lastPointer = useRef<Point | null>(null);

  const currentTheta = useRef(0);

  const currentPhi = useRef(Math.PI / 2);

  const radius = useRef(5);

  const targetTheta = useRef(0);

  const targetPhi = useRef(Math.PI / 2);

  const wasRotating = useRef(false);

  useEffect(() => {
    const rotating = mode === "rotate" && pointer !== null;

    if (!rotating) {
      lastPointer.current = null;

      wasRotating.current = false;

      return;
    }

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

    if (!lastPointer.current) {
      lastPointer.current = pointer;

      return;
    }

    const dx = pointer.x - lastPointer.current.x;

    const dy = pointer.y - lastPointer.current.y;

    const sensitivity = 0.005;

    targetTheta.current -= dx * sensitivity;

    targetPhi.current += dy * sensitivity;

    targetPhi.current = THREE.MathUtils.clamp(
      targetPhi.current,
      0.15,
      Math.PI - 0.15,
    );

    lastPointer.current = pointer;
  }, [mode, pointer, camera, target]);

  useFrame(() => {
    if (!wasRotating.current) {
      return;
    }

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

    camera.position.copy(target.clone().add(offset));

    camera.lookAt(target);

    camera.updateMatrixWorld();
  });

  return null;
}
