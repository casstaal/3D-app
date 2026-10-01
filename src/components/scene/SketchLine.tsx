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

  /*
   * Zet iedere soort shape om naar punten
   * die Line2 kan tekenen.
   */
  const points = useMemo(() => getPointsFromStroke(stroke), [stroke]);

  /*
   * selected heeft prioriteit
   * boven hovered.
   */
  const lineColor = selected ? "#3b82f6" : hovered ? "#ca0bf5" : "#22c55e";

  /*
   * Zichtbare lijn.
   */
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
  }, [points, lineColor]);

  /*
   * Brede onzichtbare lijn voor
   * makkelijkere selectie.
   */
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
  }, [points, strokeId]);

  /*
   * LineMaterial heeft de schermresolutie
   * nodig voor linewidth in pixels.
   */
  useEffect(() => {
    visibleLine.material.resolution.set(size.width, size.height);

    hitLine.material.resolution.set(size.width, size.height);
  }, [visibleLine, hitLine, size.width, size.height]);

  /*
   * Three.js resources opruimen.
   */
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

/*
 * Zet een SketchStroke om naar
 * punten voor rendering.
 */
function getPointsFromStroke(stroke: SketchStroke): Point3D[] {
  /*
   * FREE DRAW
   */
  if (stroke.type === "free") {
    return stroke.points;
  }

  /*
   * PERFECTE LIJN
   */
  if (stroke.type === "line") {
    return [stroke.start, stroke.end];
  }

  /*
   * PERFECTE CIRKEL
   */
  if (stroke.type === "circle") {
    const points: Point3D[] = [];

    /*
     * 64 segmenten geeft een
     * mooi gladde cirkel.
     */
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

  /*
   * PERFECTE RECHTHOEK
   */
  if (stroke.type === "rectangle") {
    const x = stroke.x;
    const y = stroke.y;

    const right = x + stroke.width;

    const top = y + stroke.height;

    return [
      {
        x,
        y,
        z: 0,
      },

      {
        x: right,
        y,
        z: 0,
      },

      {
        x: right,
        y: top,
        z: 0,
      },

      {
        x,
        y: top,
        z: 0,
      },

      /*
       * Terug naar beginpunt zodat
       * de rechthoek gesloten wordt.
       */
      {
        x,
        y,
        z: 0,
      },
    ];
  }

  return [];
}
