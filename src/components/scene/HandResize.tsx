import { useEffect, useRef } from "react";

import type { GestureMode, Point } from "../../features/handTracking/types";

import type {
  Point3D,
  SketchStroke,
} from "../../features/modeling/sketchTypes";

type HandResizeProps = {
  mode: GestureMode;

  pointer: Point | null;
  secondPointer: Point | null;

  selectedId: string | null;

  strokes: SketchStroke[];

  onUpdateStroke: (
    strokeId: string,
    updater: (stroke: SketchStroke) => SketchStroke,
  ) => void;
};

export default function HandResize({
  mode,
  pointer,
  secondPointer,
  selectedId,
  strokes,
  onUpdateStroke,
}: HandResizeProps) {
  const startDistanceRef = useRef<number | null>(null);

  const originalStrokeRef = useRef<SketchStroke | null>(null);

  const resizingStrokeIdRef = useRef<string | null>(null);

  useEffect(() => {
    const isResizing =
      mode === "resize" &&
      pointer !== null &&
      secondPointer !== null &&
      selectedId !== null;

    if (!isResizing) {
      startDistanceRef.current = null;
      originalStrokeRef.current = null;
      resizingStrokeIdRef.current = null;

      return;
    }

    const currentDistance = Math.hypot(
      secondPointer.x - pointer.x,
      secondPointer.y - pointer.y,
    );

    if (
      startDistanceRef.current === null ||
      resizingStrokeIdRef.current !== selectedId
    ) {
      const selectedStroke = strokes.find((stroke) => stroke.id === selectedId);

      if (!selectedStroke) {
        return;
      }

      if (currentDistance < 10) {
        return;
      }

      startDistanceRef.current = currentDistance;

      originalStrokeRef.current = structuredClone(selectedStroke);

      resizingStrokeIdRef.current = selectedId;

      return;
    }

    const startDistance = startDistanceRef.current;

    const originalStroke = originalStrokeRef.current;

    if (!startDistance || !originalStroke) {
      return;
    }

    const rawScale = currentDistance / startDistance;

    const scale = Math.max(0.2, Math.min(rawScale, 5));

    const resizedStroke = resizeStroke(originalStroke, scale);

    onUpdateStroke(selectedId, () => resizedStroke);
  }, [mode, pointer, secondPointer, selectedId, strokes, onUpdateStroke]);

  return null;
}

function resizeStroke(stroke: SketchStroke, scale: number): SketchStroke {
  switch (stroke.type) {
    case "circle":
      return resizeCircle(stroke, scale);

    case "rectangle":
      return resizeRectangle(stroke, scale);

    case "line":
      return resizeLine(stroke, scale);

    case "free":
      return resizeFreeStroke(stroke, scale);
  }
}

function resizeCircle(
  stroke: Extract<SketchStroke, { type: "circle" }>,
  scale: number,
): SketchStroke {
  return {
    ...stroke,

    radius: stroke.radius * scale,
  };
}

function resizeRectangle(
  stroke: Extract<SketchStroke, { type: "rectangle" }>,
  scale: number,
): SketchStroke {
  const centerX = stroke.x + stroke.width / 2;

  const centerY = stroke.y + stroke.height / 2;

  const newWidth = stroke.width * scale;

  const newHeight = stroke.height * scale;

  return {
    ...stroke,

    x: centerX - newWidth / 2,

    y: centerY - newHeight / 2,

    width: newWidth,
    height: newHeight,
  };
}

function resizeLine(
  stroke: Extract<SketchStroke, { type: "line" }>,
  scale: number,
): SketchStroke {
  const center: Point3D = {
    x: (stroke.start.x + stroke.end.x) / 2,

    y: (stroke.start.y + stroke.end.y) / 2,

    z: (stroke.start.z + stroke.end.z) / 2,
  };

  return {
    ...stroke,

    start: scalePointAroundCenter(stroke.start, center, scale),

    end: scalePointAroundCenter(stroke.end, center, scale),
  };
}

function resizeFreeStroke(
  stroke: Extract<SketchStroke, { type: "free" }>,
  scale: number,
): SketchStroke {
  if (stroke.points.length === 0) {
    return stroke;
  }

  const xs = stroke.points.map((point) => point.x);

  const ys = stroke.points.map((point) => point.y);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);

  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const center: Point3D = {
    x: (minX + maxX) / 2,
    y: (minY + maxY) / 2,
    z: 0,
  };

  return {
    ...stroke,

    points: stroke.points.map((point) =>
      scalePointAroundCenter(point, center, scale),
    ),
  };
}

function scalePointAroundCenter(
  point: Point3D,
  center: Point3D,
  scale: number,
): Point3D {
  return {
    x: center.x + (point.x - center.x) * scale,

    y: center.y + (point.y - center.y) * scale,

    z: point.z,
  };
}
