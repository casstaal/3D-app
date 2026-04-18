import { useEffect, useRef, useState } from "react";
import {
  FilesetResolver,
  HandLandmarker,
  type HandLandmarkerResult,
} from "@mediapipe/tasks-vision";
import {
  mapHandToGesture,
  type GestureMode,
  type Point,
} from "../features/handTracking/gestureMapper";

type UseHandTrackingOptions = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  overlayCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  enabled: boolean;
};

type UseHandTrackingResult = {
  mode: GestureMode;
  pointer: Point | null;
};

export function useHandTracking({
  videoRef,
  overlayCanvasRef,
  enabled,
}: UseHandTrackingOptions): UseHandTrackingResult {
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);

  const [mode, setMode] = useState<GestureMode>("idle");
  const [pointer, setPointer] = useState<Point | null>(null);

  // media pipe setup
  useEffect(() => {
    let cancelled = false;

    const createLandmarker = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
      );

      // create handdetector
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

  // analyse frames
  useEffect(() => {
    // tracking is off
    if (!enabled) {
      // stop animation
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      // clear canvas
      const canvas = overlayCanvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      setMode("idle");
      setPointer(null);
      lastVideoTimeRef.current = -1;

      return;
    }

    // gets called frame for frame via requestAnimationFrame
    const render = () => {
      const video = videoRef.current;
      const canvas = overlayCanvasRef.current;
      const handLandmarker = handLandmarkerRef.current;

      // something isn't ready yet, so tracking can't run yet, so wait a frame and try again
      if (!video || !canvas || !handLandmarker) {
        animationFrameRef.current = requestAnimationFrame(render);
        return;
      }

      // video doesn't have enough data to be trustable
      if (video.readyState < 2) {
        animationFrameRef.current = requestAnimationFrame(render);
        return;
      }

      // make canvas size the same as video size
      if (
        canvas.width !== video.videoWidth ||
        canvas.height !== video.videoHeight
      ) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      // Check if the video actually shows a new frame.
      if (video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime;

        // The actual handtracking
        const results = handLandmarker.detectForVideo(video, performance.now());
        drawResults(canvas, results);

        const firstHand = results.landmarks[0];

        if (firstHand) {
          const gesture = mapHandToGesture(
            firstHand,
            canvas.width,
            canvas.height,
          );

          setMode(gesture.mode);
          setPointer(gesture.pointer);

          drawPointer(canvas, gesture.pointer, gesture.mode);
        } else {
          setMode("idle");
          setPointer(null);
        }
      }

      // Planning next frame. This makes the frame loop loop
      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    // cleanup for this effect if enabled changes or the component unmounts.
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
  };
}

// draw the hands
function drawResults(canvas: HTMLCanvasElement, results: HandLandmarkerResult) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // every frame clears the old canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // loop through every hand
  for (const landmarks of results.landmarks) {
    // loop through every landmark from one hand
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
  if (!pointer) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.beginPath();
  ctx.arc(pointer.x, pointer.y, 10, 0, Math.PI * 2);
  ctx.strokeStyle = mode === "draw" ? "#22c55e" : "#ffffff";
  ctx.lineWidth = 3;
  ctx.stroke();
}
