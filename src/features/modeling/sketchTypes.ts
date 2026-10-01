export type Point3D = {
  x: number;
  y: number;
  z: number;
};

export type QuaternionData = {
  x: number;
  y: number;
  z: number;
  w: number;
};

export type FreeShape = {
  id: string;
  type: "free";

  points: Point3D[];
};

export type LineShape = {
  id: string;
  type: "line";

  start: Point3D;
  end: Point3D;
};

export type CircleShape = {
  id: string;
  type: "circle";

  center: Point3D;

  radius: number;

  depth: number;
};

export type RectangleShape = {
  id: string;
  type: "rectangle";

  x: number;
  y: number;

  width: number;
  height: number;

  depth: number;
};

export type ShapeObject = FreeShape | LineShape | CircleShape | RectangleShape;

export type Sketch = {
  id: string;

  position: Point3D;

  quaternion: QuaternionData;

  strokes: ShapeObject[];
};

export type SketchStroke = ShapeObject;

export type FreeStroke = FreeShape;

export type LineStroke = LineShape;

export type CircleStroke = CircleShape;

export type RectangleStroke = RectangleShape;
