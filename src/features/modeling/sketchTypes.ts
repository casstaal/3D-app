export type Point3D = {
  x: number;
  y: number;
  z: number;
};

export type SketchStroke = {
  id: string;
  points: Point3D[];
};

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
