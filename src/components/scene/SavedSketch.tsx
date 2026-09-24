import { useEffect, useMemo } from "react";
import * as THREE from "three";

import type { Point3D, Sketch } from "../../features/modeling/sketchTypes";

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

type SketchLineProps = {
  points: Point3D[];
};

function SketchLine({ points }: SketchLineProps) {
  const line = useMemo(() => {
    const threePoints = points.map(
      (point) => new THREE.Vector3(point.x, point.y, point.z),
    );

    const geometry = new THREE.BufferGeometry().setFromPoints(threePoints);

    const material = new THREE.LineBasicMaterial({
      color: "#22c55e",
    });

    return new THREE.Line(geometry, material);
  }, [points]);

  useEffect(() => {
    return () => {
      line.geometry.dispose();

      if (line.material instanceof THREE.Material) {
        line.material.dispose();
      }
    };
  }, [line]);

  return <primitive object={line} />;
}
