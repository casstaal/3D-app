import { useState, useRef } from "react";
import { useCamera } from "../hooks/useCamera";
import { useHandTracking } from "../hooks/useHandTracking";
import { useHandDrawing } from "../hooks/useHandDrawing";
import type { DrawingMode } from "../features/handTracking/types";

export default function CameraViewport() {
  const { videoRef, isLoading, isActive, error, startCamera, stopCamera } =
    useCamera({
      autoStart: false,
      width: 1280,
      height: 720,
      facingMode: "user",
    });

  const [drawingMode, setDrawingMode] = useState<DrawingMode>("free");

  const drawingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const { mode, pointer } = useHandTracking({
    videoRef,
    overlayCanvasRef,
    enabled: isActive,
  });

  const { clear, undo } = useHandDrawing({
    drawingCanvasRef,
    videoRef,
    enabled: isActive,
    mode,
    pointer,
    drawingMode,
  });

  return (
    <div className="w-full p-6">
      <div className="mx-auto w-full max-w-6xl">
        <div className="relative aspect-video h-[500px] w-full overflow-hidden rounded-3xl bg-zinc-900 shadow-2xl">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 z-0 h-full w-full object-cover"
          />

          <canvas
            ref={drawingCanvasRef}
            className="pointer-events-none absolute inset-0 z-10 h-full w-full"
          />

          <canvas
            ref={overlayCanvasRef}
            className="pointer-events-none absolute inset-0 z-20 h-full w-full"
          />
        </div>

        {error && (
          <div className="mt-4 rounded-2xl bg-red-500/20 p-3 text-sm text-red-100">
            {error}
          </div>
        )}
      </div>
      <div className="absolute left-4 top-4 z-30 flex gap-2">
        <button
          onClick={() => void startCamera()}
          className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur hover:bg-white/20"
        >
          Start
        </button>

        <button
          onClick={stopCamera}
          className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur hover:bg-white/20"
        >
          Stop
        </button>

        <button
          onClick={clear}
          className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur hover:bg-white/20"
        >
          Clear
        </button>

        <button
          onClick={undo}
          className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur hover:bg-white/20"
        >
          Undo
        </button>

        {/* <div className="absolute right-4 top-4 z-30 flex flex-col gap-2">
          <div className="rounded-full bg-black/60 px-3 py-1 text-sm text-white backdrop-blur">
            {isLoading
              ? "Camera starten..."
              : isActive
                ? "Camera actief"
                : "Camera uit"}
          </div>

          <div className="rounded-full bg-black/60 px-3 py-1 text-sm text-white backdrop-blur">
            Draw mode: {mode === "draw" ? "aan" : "uit"}
          </div>

          <div className="rounded-full bg-black/60 px-3 py-1 text-sm text-white backdrop-blur">
            Pointer:{" "}
            {pointer
              ? `${Math.round(pointer.x)}, ${Math.round(pointer.y)}`
              : "geen"}
          </div>
        </div> */}
      </div>
      <div className="absolute left-4 top-16 z-30 flex gap-2">
        <button
          onClick={() => setDrawingMode("free")}
          className={`rounded-xl px-4 py-2 text-sm font-medium text-white backdrop-blur ${
            drawingMode === "free"
              ? "bg-green-600/80"
              : "bg-white/10 hover:bg-white/20"
          }`}
        >
          Free draw
        </button>

        <button
          onClick={() => setDrawingMode("shape-detect")}
          className={`rounded-xl px-4 py-2 text-sm font-medium text-white backdrop-blur ${
            drawingMode === "shape-detect"
              ? "bg-green-600/80"
              : "bg-white/10 hover:bg-white/20"
          }`}
        >
          Shape detect
        </button>
      </div>
    </div>
  );
}
