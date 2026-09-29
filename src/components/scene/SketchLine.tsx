import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";

import { Line2 } from "three/addons/lines/Line2.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";

import type { Point3D } from "../../features/modeling/sketchTypes";

type SketchLineProps = {
  points: Point3D[];

  strokeId?: string;

  selected?: boolean;
  hovered?: boolean;
};

export default function SketchLine({
  points,
  strokeId,
  selected = false,
  hovered = false,
}: SketchLineProps) {
  const { size } = useThree();

  const visibleLine = useMemo(() => {
    const positions = points.flatMap((point) => [point.x, point.y, 0.01]);

    const geometry = new LineGeometry();

    geometry.setPositions(positions);

    const material = new LineMaterial({
      color: "#22c55e",
      linewidth: 4,
      worldUnits: false,
    });

    const line = new Line2(geometry, material);

    line.userData.selectable = false;

    line.computeLineDistances();

    return line;
  }, [points]);

  /*
   * Onzichtbare, brede lijn voor selectie.
   */
  const hitLine = useMemo(() => {
    const positions = points.flatMap((point) => [point.x, point.y, 0.01]);

    const geometry = new LineGeometry();

    geometry.setPositions(positions);

    const material = new LineMaterial({
      color: "#ffffff",

      linewidth: 15,

      worldUnits: false,

      transparent: true,
      opacity: 0,
      depthWrite: false,
    });

    const line = new Line2(geometry, material);

    if (strokeId) {
      line.userData.strokeId = strokeId;

      line.userData.selectable = true;
    }

    line.computeLineDistances();

    return line;
  }, [points, strokeId]);

  useEffect(() => {
    visibleLine.material.resolution.set(size.width, size.height);

    hitLine.material.resolution.set(size.width, size.height);
  }, [visibleLine, hitLine, size.width, size.height]);

  useEffect(() => {
    if (selected) {
      visibleLine.material.color.set("#3b82f6");
    } else if (hovered) {
      visibleLine.material.color.set("#ca0bf5");
    } else {
      visibleLine.material.color.set("#22c55e");
    }
  }, [visibleLine, selected, hovered]);

  useEffect(() => {
    return () => {
      visibleLine.geometry.dispose();
      visibleLine.material.dispose();

      hitLine.geometry.dispose();
      hitLine.material.dispose();
    };
  }, [visibleLine, hitLine]);

  return (
    <>
      <primitive object={visibleLine} />

      <primitive object={hitLine} />
    </>
  );
}
