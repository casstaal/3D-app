export type Point = {
  x: number;
  y: number;
};

export type GestureMode = "idle" | "draw";

export type GestureResult = {
  mode: GestureMode;
  pointer: Point | null;
};

type Landmark = {
  x: number;
  y: number;
  z?: number;
};

function isFingerExtended(
  landmarks: Landmark[],
  mcp: number,
  pip: number,
  dip: number,
  tip: number,
) {
  return (
    landmarks[tip].y < landmarks[dip].y &&
    landmarks[dip].y < landmarks[pip].y &&
    landmarks[pip].y < landmarks[mcp].y
  );
}

export function mapHandToGesture(
  landmarks: Landmark[],
  canvasWidth: number,
  canvasHeight: number,
): GestureResult {
  const indexUp = isFingerExtended(landmarks, 5, 6, 7, 8);
  const middleUp = isFingerExtended(landmarks, 9, 10, 11, 12);
  const ringUp = isFingerExtended(landmarks, 13, 14, 15, 16);
  const pinkUp = isFingerExtended(landmarks, 17, 18, 19, 20);

  const drawMode = indexUp && !middleUp && !ringUp && !pinkUp;

  if (drawMode) {
    return {
      mode: "draw",
      pointer: {
        x: landmarks[8].x * canvasWidth,
        y: landmarks[8].y * canvasHeight,
      },
    };
  }

  return {
    mode: "idle",
    pointer: null,
  };
}
