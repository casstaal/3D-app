import type { GestureMode, Point } from "./types";

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

  // Alleen wijsvinger omhoog
  const drawMode = indexUp && !middleUp && !ringUp && !pinkUp;

  // Alleen middelvinger omhoog
  const selectMode = !indexUp && middleUp && !ringUp && !pinkUp;

  // Alle vier vingers dicht
  const rotateMode = !indexUp && !middleUp && !ringUp && !pinkUp;

  if (drawMode) {
    return {
      mode: "draw",

      // Wijsvingertop
      pointer: {
        x: landmarks[8].x * canvasWidth,
        y: landmarks[8].y * canvasHeight,
      },
    };
  }

  if (selectMode) {
    return {
      mode: "select",

      pointer: {
        x: landmarks[12].x * canvasWidth,
        y: landmarks[12].y * canvasHeight,
      },
    };
  }

  if (rotateMode) {
    return {
      mode: "rotate",

      // Basis van middelvinger is stabieler voor rotatie
      pointer: {
        x: landmarks[9].x * canvasWidth,
        y: landmarks[9].y * canvasHeight,
      },
    };
  }

  return {
    mode: "idle",
    pointer: null,
  };
}
