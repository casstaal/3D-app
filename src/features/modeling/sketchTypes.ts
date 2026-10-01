export type Point3D = {
  x: number;
  y: number;
  z: number;
};

export type FreeStroke = {
  id: string;
  type: "free";
  points: Point3D[];
};

export type LineStroke = {
  id: string;
  type: "line";
  start: Point3D;
  end: Point3D;
};

export type CircleStroke = {
  id: string;
  type: "circle";
  center: Point3D;
  radius: number;
};

export type RectangleStroke = {
  id: string;
  type: "rectangle";

  x: number;
  y: number;

  width: number;
  height: number;
};

export type SketchStroke =
  | FreeStroke
  | LineStroke
  | CircleStroke
  | RectangleStroke;

export type Sketch = {
  id: string;

  position: Point3D;

  quaternion: {
    x: number;
    y: number;
    z: number;
    w: number;
  };

  strokes: SketchStroke[];
};
