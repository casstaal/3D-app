import { useMemo } from "react";

import * as THREE from "three";

import type { Sketch } from "../../features/modeling/sketchTypes";

import ShapeRenderer from "./ShapeRenderer";

type SavedSketchProps = {
  sketch: Sketch;

  hoveredId: string | null;

  selectedId: string | null;
};

export default function SavedSketch({
  sketch,
  hoveredId,
  selectedId,
}: SavedSketchProps) {
  const position = useMemo(
    () =>
      new THREE.Vector3(
        sketch.position.x,
        sketch.position.y,
        sketch.position.z,
      ),
    [sketch.position.x, sketch.position.y, sketch.position.z],
  );

  const quaternion = useMemo(
    () =>
      new THREE.Quaternion(
        sketch.quaternion.x,
        sketch.quaternion.y,
        sketch.quaternion.z,
        sketch.quaternion.w,
      ),
    [
      sketch.quaternion.x,
      sketch.quaternion.y,
      sketch.quaternion.z,
      sketch.quaternion.w,
    ],
  );

  return (
    <group position={position} quaternion={quaternion}>
      {sketch.strokes.map((shape) => (
        <ShapeRenderer
          key={shape.id}
          shape={shape}
          hovered={hoveredId === shape.id}
          selected={selectedId === shape.id}
        />
      ))}
    </group>
  );
}
