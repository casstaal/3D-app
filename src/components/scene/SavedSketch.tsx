import * as THREE from "three";

import type { Sketch } from "../../features/modeling/sketchTypes";
import SketchLine from "./SketchLine";

type SavedSketchProps = {
  sketch: Sketch;
};

export default function SavedSketch({ sketch }: SavedSketchProps) {
  const position = new THREE.Vector3(
    sketch.position.x,
    sketch.position.y,
    sketch.position.z,
  );

  const quaternion = new THREE.Quaternion(
    sketch.quaternion.x,
    sketch.quaternion.y,
    sketch.quaternion.z,
    sketch.quaternion.w,
  );

  return (
    <group position={position} quaternion={quaternion}>
      {sketch.strokes.map((stroke) => (
        <SketchLine key={stroke.id} points={stroke.points} />
      ))}
    </group>
  );
}
