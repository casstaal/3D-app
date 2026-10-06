export type Point = {
  x: number;
  y: number;
};

export type DrawingMode = "free" | "shape-detect";

export type GestureMode = "idle" | "draw" | "rotate" | "select" | "resize";

export type GestureAction = "copy" | null;

export type GestureResult = {
  mode: GestureMode;
  action: GestureAction;
  pointer: Point | null;
  secondPointer?: Point | null;
};
