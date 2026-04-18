import type {
  DrawItem,
  Point,
  Stroke,
  CircleShape,
  RectangleShape,
  LineShape,
} from "../handTracking/types";

function distance(a: Point, b: Point) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function getBoundingBox(points: Point[]) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);

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

function getCentroid(points: Point[]): Point {
  const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), {
    x: 0,
    y: 0,
  });

  return {
    x: sum.x / points.length,
    y: sum.y / points.length,
  };
}

function pointToLineDistance(point: Point, start: Point, end: Point) {
  const A = point.x - start.x;
  const B = point.y - start.y;
  const C = end.x - start.x;
  const D = end.y - start.y;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  const param = lenSq !== 0 ? dot / lenSq : -1;

  let xx: number;
  let yy: number;

  if (param < 0) {
    xx = start.x;
    yy = start.y;
  } else if (param > 1) {
    xx = end.x;
    yy = end.y;
  } else {
    xx = start.x + param * C;
    yy = start.y + param * D;
  }

  return distance(point, { x: xx, y: yy });
}

function isClosedStroke(points: Point[]) {
  if (points.length < 6) return false;
  return distance(points[0], points[points.length - 1]) < 30;
}

function tryBuildLine(stroke: Stroke): LineShape | null {
  const points = stroke.points;
  if (points.length < 2) return null;

  const start = points[0];
  const end = points[points.length - 1];
  const lineLength = distance(start, end);

  if (lineLength < 30) return null;

  const avgDeviation =
    points.reduce((sum, p) => sum + pointToLineDistance(p, start, end), 0) /
    points.length;

  if (avgDeviation < 12) {
    return {
      type: "line",
      start,
      end,
    };
  }

  return null;
}

function tryBuildCircle(stroke: Stroke): CircleShape | null {
  const points = stroke.points;
  if (!isClosedStroke(points)) return null;

  const center = getCentroid(points);
  const radii = points.map((p) => distance(p, center));
  const avgRadius = radii.reduce((a, b) => a + b, 0) / radii.length;

  if (avgRadius < 20) return null;

  const variance =
    radii.reduce((sum, r) => sum + (r - avgRadius) ** 2, 0) / radii.length;

  const stdDev = Math.sqrt(variance);

  if (stdDev < avgRadius * 0.18) {
    return {
      type: "circle",
      cx: center.x,
      cy: center.y,
      radius: avgRadius,
    };
  }

  return null;
}

function tryBuildRectangle(stroke: Stroke): RectangleShape | null {
  const points = stroke.points;
  if (!isClosedStroke(points)) return null;

  const box = getBoundingBox(points);

  if (box.width < 30 || box.height < 30) return null;

  const perimeter = 2 * (box.width + box.height);
  const pathLength = points.slice(1).reduce((sum, p, i) => {
    return sum + distance(points[i], p);
  }, 0);

  const ratio = pathLength / perimeter;

  if (ratio > 0.75 && ratio < 1.6) {
    return {
      type: "rectangle",
      x: box.minX,
      y: box.minY,
      width: box.width,
      height: box.height,
    };
  }

  return null;
}

export function detectShapeFromStroke(stroke: Stroke): DrawItem {
  const circle = tryBuildCircle(stroke);
  if (circle) return circle;

  const rectangle = tryBuildRectangle(stroke);
  if (rectangle) return rectangle;

  const line = tryBuildLine(stroke);
  if (line) return line;

  return stroke;
}
