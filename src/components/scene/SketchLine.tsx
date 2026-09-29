import { useEffect, useMemo } from "react";

import { Line2 } from "three/addons/lines/Line2.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";

import type { Point3D } from "../../features/modeling/sketchTypes";

type SketchLineProps = {
  points: Point3D[];
};

export default function SketchLine({ points }: SketchLineProps) {
  const line = useMemo(() => {
    const positions = points.flatMap((point) => [point.x, point.y, 0.01]);

    const geometry = new LineGeometry();

    geometry.setPositions(positions);

    const material = new LineMaterial({
      color: "#22c55e",

      // Lijndikte in pixels
      linewidth: 4,

      // Zorgt dat de lijn ongeveer 4 pixels
      // dik blijft ongeacht afstand tot camera
      worldUnits: false,
    });

    const line = new Line2(geometry, material);

    line.computeLineDistances();

    return line;
  }, [points]);

  useEffect(() => {
    return () => {
      line.geometry.dispose();
      line.material.dispose();
    };
  }, [line]);

  return <primitive object={line} />;
}
