import { useEffect, useMemo } from "react";

import { useThree } from "@react-three/fiber";

import { Line2 } from "three/addons/lines/Line2.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";

import type {
  Point3D,
  SketchStroke,
} from "../../features/modeling/sketchTypes";

type SketchLineProps = {
  stroke: SketchStroke;

  strokeId?: string;

  selected?: boolean;

  hovered?: boolean;
};

export default function SketchLine({
  stroke,
  strokeId,
  selected = false,
  hovered = false,
}: SketchLineProps) {
  const { size } = useThree();

  const points = useMemo(() => getPointsFromStroke(stroke), [stroke]);

  const lineColor = selected ? "#3b82f6" : hovered ? "#ca0bf5" : "#22c55e";

  const geometryKey = useMemo(
    () =>
      points
        .map(
          (point) =>
            `${point.x.toFixed(4)},${point.y.toFixed(4)},${point.z.toFixed(4)}`,
        )
        .join("|"),
    [points],
  );

  const visibleLine = useMemo(() => {
    const positions = points.flatMap((point) => [point.x, point.y, 0.01]);

    const geometry = new LineGeometry();

    geometry.setPositions(positions);

    const material = new LineMaterial({
      color: lineColor,

      linewidth: 4,

      worldUnits: false,
    });

    const line = new Line2(geometry, material);

    line.userData.selectable = false;

    line.computeLineDistances();

    return line;
  }, [geometryKey, lineColor]);

  const hitLine = useMemo(() => {
    const positions = points.flatMap((point) => [point.x, point.y, 0.01]);

    const geometry = new LineGeometry();

    geometry.setPositions(positions);

    const material = new LineMaterial({
      color: "#ffffff",

      linewidth: 30,

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
  }, [geometryKey, strokeId]);

  useEffect(() => {
    visibleLine.material.resolution.set(size.width, size.height);

    hitLine.material.resolution.set(size.width, size.height);
  }, [visibleLine, hitLine, size.width, size.height]);

  useEffect(() => {
    return () => {
      visibleLine.geometry.dispose();
      visibleLine.material.dispose();
    };
  }, [visibleLine]);

  useEffect(() => {
    return () => {
      hitLine.geometry.dispose();
      hitLine.material.dispose();
    };
  }, [hitLine]);

  return (
    <>
      <primitive
        key={`visible-${geometryKey}-${lineColor}`}
        object={visibleLine}
      />

      <primitive key={`hit-${geometryKey}`} object={hitLine} />
    </>
  );
}

function getPointsFromStroke(stroke: SketchStroke): Point3D[] {
  if (stroke.type === "free") {
    return stroke.points;
  }

  if (stroke.type === "line") {
    return [stroke.start, stroke.end];
  }

  if (stroke.type === "circle") {
    const points: Point3D[] = [];

    const segments = 64;

    for (let index = 0; index <= segments; index++) {
      const angle = (index / segments) * Math.PI * 2;

      points.push({
        x: stroke.center.x + Math.cos(angle) * stroke.radius,

        y: stroke.center.y + Math.sin(angle) * stroke.radius,

        z: 0,
      });
    }

    return points;
  }

  if (stroke.type === "rectangle") {
    const left = stroke.x;

    const bottom = stroke.y;

    const right = stroke.x + stroke.width;

    const top = stroke.y + stroke.height;

    return [
      {
        x: left,
        y: bottom,
        z: 0,
      },

      {
        x: right,
        y: bottom,
        z: 0,
      },

      {
        x: right,
        y: top,
        z: 0,
      },

      {
        x: left,
        y: top,
        z: 0,
      },

      {
        x: left,
        y: bottom,
        z: 0,
      },
    ];
  }

  return [];
}
