export type Point = {
  x: number;
  y: number;
};

export type DrawingMode = "free" | "shape-detect";

export type GestureMode = "idle" | "draw" | "rotate";

export type Stroke = {
  type: "stroke";
  points: Point[];
};

export type LineShape = {
  type: "line";
  start: Point;
  end: Point;
};

export type RectangleShape = {
  type: "rectangle";
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CircleShape = {
  type: "circle";
  cx: number;
  cy: number;
  radius: number;
};

export type DrawItem = Stroke | LineShape | RectangleShape | CircleShape;
