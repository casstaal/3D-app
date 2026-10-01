import { useEffect, useMemo, useRef, useState } from "react";

import { useThree } from "@react-three/fiber";

import * as THREE from "three";

import SketchLine from "./SketchLine";

import type {
  DrawingMode,
  GestureMode,
  Point,
} from "../../features/handTracking/types";

import type {
  Point3D,
  Sketch,
  SketchStroke,
  FreeStroke,
} from "../../features/modeling/sketchTypes";

import { detectShapeFromStroke } from "../../features/modeling/shapeBuilder";

type ActiveSketchProps = {
  mode: GestureMode;

  drawingMode: DrawingMode;

  pointer: Point | null;

  viewportWidth: number;
  viewportHeight: number;

  finishSignal: number;

  onFinish: (sketch: Sketch) => void;
};

export default function ActiveSketch({
  mode,
  drawingMode,
  pointer,
  viewportWidth,
  viewportHeight,
  finishSignal,
  onFinish,
}: ActiveSketchProps) {
  const { camera } = useThree();

  const planeRef = useRef<THREE.Mesh>(null);

  const groupRef = useRef<THREE.Group>(null);

  const raycaster = useMemo(() => new THREE.Raycaster(), []);

  const ndcPointer = useMemo(() => new THREE.Vector2(), []);

  const [strokes, setStrokes] = useState<SketchStroke[]>([]);

  const [currentPoints, setCurrentPoints] = useState<Point3D[]>([]);

  const wasDrawingRef = useRef(false);

  const initialTransform = useRef<{
    position: THREE.Vector3;
    quaternion: THREE.Quaternion;
  } | null>(null);

  if (!initialTransform.current) {
    const position = new THREE.Vector3(0, 0, 0);

    const quaternion = camera.quaternion.clone();

    initialTransform.current = {
      position,
      quaternion,
    };
  }

  const transform = initialTransform.current;

  useEffect(() => {
    const isDrawing =
      mode === "draw" && pointer !== null && planeRef.current !== null;

    if (!isDrawing) {
      if (wasDrawingRef.current) {
        finishCurrentStroke();
      }

      wasDrawingRef.current = false;

      return;
    }

    if (!pointer || !planeRef.current || !groupRef.current) {
      return;
    }

    if (viewportWidth <= 0 || viewportHeight <= 0) {
      return;
    }

    ndcPointer.set(
      (pointer.x / viewportWidth) * 2 - 1,

      -(pointer.y / viewportHeight) * 2 + 1,
    );

    raycaster.setFromCamera(ndcPointer, camera);

    const intersections = raycaster.intersectObject(planeRef.current, false);

    if (intersections.length === 0) {
      return;
    }

    const worldPoint = intersections[0].point.clone();

    const localPoint = groupRef.current.worldToLocal(worldPoint);

    const point: Point3D = {
      x: localPoint.x,
      y: localPoint.y,
      z: 0,
    };

    if (!wasDrawingRef.current) {
      setCurrentPoints([point]);

      wasDrawingRef.current = true;

      return;
    }

    setCurrentPoints((current) => {
      const last = current[current.length - 1];

      if (!last) {
        return [point];
      }

      const dx = point.x - last.x;

      const dy = point.y - last.y;

      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 0.02) {
        return current;
      }

      return [...current, point];
    });
  }, [
    mode,
    pointer,
    viewportWidth,
    viewportHeight,
    camera,
    raycaster,
    ndcPointer,
  ]);

  function buildStroke(points: Point3D[]): SketchStroke | null {
    if (points.length <= 1) {
      return null;
    }

    const freeStroke: FreeStroke = {
      id: crypto.randomUUID(),

      type: "free",

      points,
    };

    if (drawingMode === "free") {
      return freeStroke;
    }

    return detectShapeFromStroke(freeStroke);
  }

  function finishCurrentStroke() {
    setCurrentPoints((current) => {
      const stroke = buildStroke(current);

      if (stroke) {
        setStrokes((previous) => [...previous, stroke]);
      }

      return [];
    });
  }

  useEffect(() => {
    if (finishSignal === 0) {
      return;
    }

    let finalStrokes = [...strokes];

    if (currentPoints.length > 1) {
      const finalCurrentStroke = buildStroke(currentPoints);

      if (finalCurrentStroke) {
        finalStrokes = [...finalStrokes, finalCurrentStroke];
      }
    }

    if (finalStrokes.length === 0) {
      return;
    }

    const sketch: Sketch = {
      id: crypto.randomUUID(),

      position: {
        x: transform.position.x,
        y: transform.position.y,
        z: transform.position.z,
      },

      quaternion: {
        x: transform.quaternion.x,
        y: transform.quaternion.y,
        z: transform.quaternion.z,
        w: transform.quaternion.w,
      },

      strokes: finalStrokes,
    };

    onFinish(sketch);

    setStrokes([]);
    setCurrentPoints([]);

    wasDrawingRef.current = false;
  }, [finishSignal]);

  return (
    <group
      ref={groupRef}
      position={transform.position}
      quaternion={transform.quaternion}
    >
      <mesh ref={planeRef}>
        <planeGeometry args={[6, 4]} />

        <meshBasicMaterial
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {strokes.map((stroke) => (
        <SketchLine key={stroke.id} stroke={stroke} />
      ))}

      {currentPoints.length > 1 && (
        <SketchLine
          stroke={{
            id: "current-stroke",

            type: "free",

            points: currentPoints,
          }}
        />
      )}
    </group>
  );
}
