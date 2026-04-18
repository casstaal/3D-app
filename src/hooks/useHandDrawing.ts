import { useEffect, useRef } from "react";

type Point = {
  x: number;
  y: number;
};

type Stroke = {
  points: Point[];
};

type UseHandDrawingOptions = {
  drawingCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  enabled: boolean;
  mode: "idle" | "draw";
  pointer: Point | null;
};

export function useHandDrawing({
  drawingCanvasRef,
  videoRef,
  enabled,
  mode,
  pointer,
}: UseHandDrawingOptions) {
  const strokesRef = useRef<Stroke[]>([]);
  const currentStrokeRef = useRef<Stroke | null>(null);
  const wasDrawingRef = useRef(false);

  useEffect(() => {
    const canvas = drawingCanvasRef.current;
    const video = videoRef.current;

    if (!canvas || !video) return;

    if (
      video.videoWidth > 0 &&
      video.videoHeight > 0 &&
      (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight)
    ) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      redraw(canvas, strokesRef.current, currentStrokeRef.current);
    }
  }, [drawingCanvasRef, videoRef, enabled]);

  useEffect(() => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;

    if (!enabled) {
      currentStrokeRef.current = null;
      wasDrawingRef.current = false;
      redraw(canvas, strokesRef.current, null);
      return;
    }

    const isDrawing = mode === "draw" && pointer !== null;

    if (isDrawing && !wasDrawingRef.current) {
      currentStrokeRef.current = {
        points: [pointer],
      };
    } else if (isDrawing && wasDrawingRef.current && currentStrokeRef.current) {
      const lastPoint =
        currentStrokeRef.current.points[
          currentStrokeRef.current.points.length - 1
        ];

      const dx = pointer.x - lastPoint.x;
      const dy = pointer.y - lastPoint.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 2) {
        currentStrokeRef.current.points.push(pointer);
      }
    } else if (!isDrawing && wasDrawingRef.current) {
      if (
        currentStrokeRef.current &&
        currentStrokeRef.current.points.length > 1
      ) {
        strokesRef.current.push(currentStrokeRef.current);
      }

      currentStrokeRef.current = null;
    }

    wasDrawingRef.current = isDrawing;
    redraw(canvas, strokesRef.current, currentStrokeRef.current);
  }, [drawingCanvasRef, enabled, mode, pointer]);

  const clear = () => {
    strokesRef.current = [];
    currentStrokeRef.current = null;

    const canvas = drawingCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const undo = () => {
    strokesRef.current.pop();

    const canvas = drawingCanvasRef.current;
    if (!canvas) return;

    redraw(canvas, strokesRef.current, currentStrokeRef.current);
  };

  return { clear, undo };
}

function redraw(
  canvas: HTMLCanvasElement,
  strokes: Stroke[],
  currentStroke: Stroke | null,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const stroke of strokes) {
    drawStroke(ctx, stroke, "#22c55e");
  }

  if (currentStroke) {
    drawStroke(ctx, currentStroke, "#86efac");
  }
}

function drawStroke(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke,
  color: string,
) {
  if (stroke.points.length < 2) return;

  ctx.beginPath();
  ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

  for (let i = 1; i < stroke.points.length; i++) {
    ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
  }

  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();
}
