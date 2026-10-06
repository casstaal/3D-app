import { useEffect, useRef, useState } from "react";

import {
  FilesetResolver,
  HandLandmarker,
  type HandLandmarkerResult,
} from "@mediapipe/tasks-vision";

import { mapHandToGesture } from "../features/handTracking/gestureMapper";

import type {
  GestureAction,
  GestureMode,
  Point,
} from "../features/handTracking/types";

type UseHandTrackingOptions = {
  videoRef: React.RefObject<HTMLVideoElement | null>;

  overlayCanvasRef: React.RefObject<HTMLCanvasElement | null>;

  enabled: boolean;

  selectionProgress: number;
};

type UseHandTrackingResult = {
  mode: GestureMode;
  pointer: Point | null;
  secondPointer: Point | null;
  copySignal: number;
};

export function useHandTracking({
  videoRef,
  overlayCanvasRef,
  enabled,
  selectionProgress,
}: UseHandTrackingOptions): UseHandTrackingResult {
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);

  const animationFrameRef = useRef<number | null>(null);

  const lastVideoTimeRef = useRef<number>(-1);

  const selectionProgressRef = useRef(selectionProgress);

  const previousActionRef = useRef<GestureAction>(null);

  const [mode, setMode] = useState<GestureMode>("idle");

  const [pointer, setPointer] = useState<Point | null>(null);
  const [secondPointer, setSecondPointer] = useState<Point | null>(null);

  const [copySignal, setCopySignal] = useState(0);

  useEffect(() => {
    selectionProgressRef.current = selectionProgress;
  }, [selectionProgress]);

  useEffect(() => {
    let cancelled = false;

    const createLandmarker = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
      );

      const handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
        },

        runningMode: "VIDEO",

        numHands: 2,
      });

      if (cancelled) {
        handLandmarker.close();
        return;
      }

      handLandmarkerRef.current = handLandmarker;
    };

    void createLandmarker();

    return () => {
      cancelled = true;

      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      if (handLandmarkerRef.current) {
        handLandmarkerRef.current.close();

        handLandmarkerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);

        animationFrameRef.current = null;
      }

      const canvas = overlayCanvasRef.current;

      const ctx = canvas?.getContext("2d");

      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      setMode("idle");
      setPointer(null);
      setSecondPointer(null);

      previousActionRef.current = null;

      lastVideoTimeRef.current = -1;

      return;
    }

    const render = () => {
      const video = videoRef.current;

      const canvas = overlayCanvasRef.current;

      const handLandmarker = handLandmarkerRef.current;

      if (!video || !canvas || !handLandmarker) {
        animationFrameRef.current = requestAnimationFrame(render);

        return;
      }

      if (video.readyState < 2) {
        animationFrameRef.current = requestAnimationFrame(render);

        return;
      }

      if (
        canvas.width !== video.videoWidth ||
        canvas.height !== video.videoHeight
      ) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      if (video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime;

        const results = handLandmarker.detectForVideo(video, performance.now());

        drawResults(canvas, results);

        if (results.landmarks.length > 0) {
          const gesture = mapHandToGesture(
            results.landmarks,
            canvas.width,
            canvas.height,
          );

          setMode(gesture.mode);
          setPointer(gesture.pointer);
          setSecondPointer(gesture.secondPointer ?? null);

          if (
            gesture.action === "copy" &&
            previousActionRef.current !== "copy"
          ) {
            setCopySignal((current) => current + 1);
          }

          previousActionRef.current = gesture.action;

          drawPointer(canvas, gesture.pointer, gesture.mode);

          if (gesture.secondPointer) {
            drawPointer(canvas, gesture.secondPointer, gesture.mode);
          }

          if (
            gesture.mode === "select" &&
            gesture.pointer &&
            selectionProgressRef.current > 0
          ) {
            drawSelectionProgress(
              canvas,
              gesture.pointer,
              selectionProgressRef.current,
            );
          }
        } else {
          setMode("idle");
          setPointer(null);
          setSecondPointer(null);
          previousActionRef.current = null;
        }
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);

        animationFrameRef.current = null;
      }
    };
  }, [enabled, videoRef, overlayCanvasRef]);

  return {
    mode,
    pointer,
    secondPointer,
    copySignal,
  };
}

function drawResults(canvas: HTMLCanvasElement, results: HandLandmarkerResult) {
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const landmarks of results.landmarks) {
    for (const landmark of landmarks) {
      const x = landmark.x * canvas.width;

      const y = landmark.y * canvas.height;

      ctx.beginPath();

      ctx.arc(x, y, 6, 0, Math.PI * 2);

      ctx.fillStyle = "#00e5ff";

      ctx.fill();
    }
  }
}

function drawPointer(
  canvas: HTMLCanvasElement,
  pointer: Point | null,
  mode: GestureMode,
) {
  if (!pointer) {
    return;
  }

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return;
  }

  ctx.beginPath();

  ctx.arc(pointer.x, pointer.y, 10, 0, Math.PI * 2);

  if (mode === "draw") {
    ctx.strokeStyle = "#22c55e";
  } else if (mode === "rotate") {
    ctx.strokeStyle = "#f59e0b";
  } else if (mode === "select") {
    ctx.strokeStyle = "#a855f7";
  } else if (mode === "resize") {
    ctx.strokeStyle = "#ef4444";
  } else {
    ctx.strokeStyle = "#ffffff";
  }

  ctx.lineWidth = 3;

  ctx.stroke();
}

function drawSelectionProgress(
  canvas: HTMLCanvasElement,
  pointer: Point,
  progress: number,
) {
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return;
  }

  const clampedProgress = Math.max(0, Math.min(progress, 1));

  const radius = 22;

  ctx.beginPath();

  ctx.arc(pointer.x, pointer.y, radius, 0, Math.PI * 2);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";

  ctx.lineWidth = 5;

  ctx.stroke();

  const startAngle = -Math.PI / 2;

  const endAngle = startAngle + Math.PI * 2 * clampedProgress;

  ctx.beginPath();

  ctx.arc(pointer.x, pointer.y, radius, startAngle, endAngle);

  ctx.strokeStyle = "#3b82f6";

  ctx.lineWidth = 5;

  ctx.lineCap = "round";

  ctx.stroke();

  ctx.lineCap = "butt";
}
