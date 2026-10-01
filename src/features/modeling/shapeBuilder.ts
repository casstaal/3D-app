import type {
  Point3D,
  SketchStroke,
  FreeStroke,
  LineStroke,
  CircleStroke,
  RectangleStroke,
} from "./sketchTypes";

const CLOSED_DISTANCE = 0.15;

const MIN_LINE_LENGTH = 0.15;

const MAX_LINE_DEVIATION = 0.06;

const MIN_CIRCLE_RADIUS = 0.1;

const MIN_RECTANGLE_WIDTH = 0.15;
const MIN_RECTANGLE_HEIGHT = 0.15;

function distance(a: Point3D, b: Point3D) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;

  return Math.sqrt(dx * dx + dy * dy);
}

function getBoundingBox(points: Point3D[]) {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);

  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    minX,
    minY,
    maxX,
    maxY,

    width: maxX - minX,
    height: maxY - minY,
  };
}

function getCentroid(points: Point3D[]): Point3D {
  const sum = points.reduce(
    (accumulator, point) => ({
      x: accumulator.x + point.x,
      y: accumulator.y + point.y,
      z: 0,
    }),
    {
      x: 0,
      y: 0,
      z: 0,
    },
  );

  return {
    x: sum.x / points.length,
    y: sum.y / points.length,
    z: 0,
  };
}

function pointToLineDistance(point: Point3D, start: Point3D, end: Point3D) {
  const A = point.x - start.x;
  const B = point.y - start.y;

  const C = end.x - start.x;
  const D = end.y - start.y;

  const dot = A * C + B * D;

  const lengthSquared = C * C + D * D;

  const parameter = lengthSquared !== 0 ? dot / lengthSquared : -1;

  let x: number;
  let y: number;

  if (parameter < 0) {
    x = start.x;
    y = start.y;
  } else if (parameter > 1) {
    x = end.x;
    y = end.y;
  } else {
    x = start.x + parameter * C;
    y = start.y + parameter * D;
  }

  return distance(point, {
    x,
    y,
    z: 0,
  });
}

function isClosedStroke(points: Point3D[]) {
  if (points.length < 6) {
    return false;
  }

  return distance(points[0], points[points.length - 1]) < CLOSED_DISTANCE;
}

function tryBuildLine(stroke: FreeStroke): LineStroke | null {
  const points = stroke.points;

  if (points.length < 2) {
    return null;
  }

  const start = points[0];
  const end = points[points.length - 1];

  const lineLength = distance(start, end);

  if (lineLength < MIN_LINE_LENGTH) {
    return null;
  }

  const averageDeviation =
    points.reduce(
      (sum, point) => sum + pointToLineDistance(point, start, end),
      0,
    ) / points.length;

  if (averageDeviation < MAX_LINE_DEVIATION) {
    return {
      id: stroke.id,
      type: "line",
      start,
      end,
    };
  }

  return null;
}

function tryBuildCircle(stroke: FreeStroke): CircleStroke | null {
  const points = stroke.points;

  if (!isClosedStroke(points)) {
    return null;
  }

  const center = getCentroid(points);

  const radii = points.map((point) => distance(point, center));

  const averageRadius =
    radii.reduce((sum, radius) => sum + radius, 0) / radii.length;

  if (averageRadius < MIN_CIRCLE_RADIUS) {
    return null;
  }

  const variance =
    radii.reduce((sum, radius) => sum + (radius - averageRadius) ** 2, 0) /
    radii.length;

  const standardDeviation = Math.sqrt(variance);

  if (standardDeviation < averageRadius * 0.18) {
    return {
      id: stroke.id,

      type: "circle",

      center,

      radius: averageRadius,

      depth: 0,
    };
  }

  return null;
}

function tryBuildRectangle(stroke: FreeStroke): RectangleStroke | null {
  const points = stroke.points;

  if (!isClosedStroke(points)) {
    return null;
  }

  const box = getBoundingBox(points);

  if (box.width < MIN_RECTANGLE_WIDTH || box.height < MIN_RECTANGLE_HEIGHT) {
    return null;
  }

  const perimeter = 2 * (box.width + box.height);

  const pathLength = points
    .slice(1)
    .reduce((sum, point, index) => sum + distance(points[index], point), 0);

  const ratio = pathLength / perimeter;

  if (ratio > 0.75 && ratio < 1.6) {
    return {
      id: stroke.id,

      type: "rectangle",

      x: box.minX,
      y: box.minY,

      width: box.width,
      height: box.height,

      depth: 0,
    };
  }

  return null;
}

export function detectShapeFromStroke(stroke: FreeStroke): SketchStroke {
  const circle = tryBuildCircle(stroke);

  if (circle) {
    console.log("Circle detected");
    return circle;
  }

  const rectangle = tryBuildRectangle(stroke);

  if (rectangle) {
    console.log("rectangle detected");
    return rectangle;
  }

  const line = tryBuildLine(stroke);

  if (line) {
    console.log("line detected");
    return line;
  }

  console.log("stroke detected");

  return stroke;
}
