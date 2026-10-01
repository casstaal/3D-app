import { useState, useRef } from "react";
import { useCamera } from "../hooks/useCamera";
import { useHandTracking } from "../hooks/useHandTracking";
import type { DrawingMode } from "../features/handTracking/types";
import SceneViewport from "./SceneViewport";
import { useSketchStore } from "../features/modeling/sketchStore";

export default function CameraViewport() {
  const { videoRef, isLoading, isActive, error, startCamera, stopCamera } =
    useCamera({
      autoStart: false,
      width: 1280,
      height: 720,
      facingMode: "user",
    });

  const [drawingMode, setDrawingMode] = useState<DrawingMode>("free");

  const [selectionProgress, setSelectionProgress] = useState(0);
  const [hasSelection, setHasSelection] = useState(false);

  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const { mode, pointer, secondPointer } = useHandTracking({
    videoRef,
    overlayCanvasRef,
    enabled: isActive,
    selectionProgress,
  });

  const { sketches, addSketch, clearSketches, removeLastSketch, updateStroke } =
    useSketchStore();

  const [finishSignal, setFinishSignal] = useState(0);
  const [deselectSignal, setDeselectSignal] = useState(0);

  const videoWidth = videoRef.current?.videoWidth ?? 1280;

  const mirroredPointer = pointer
    ? {
        x: videoWidth - pointer.x,
        y: pointer.y,
      }
    : null;

  const mirroredSecondPointer = secondPointer
    ? {
        x: videoWidth - secondPointer.x,
        y: secondPointer.y,
      }
    : null;

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      {/* Webcam */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="
          absolute inset-0 z-0
          h-full w-full
          -scale-x-100
          object-cover
        "
      />

      {/* Three.js */}
      <div className="absolute inset-0 z-20">
        <SceneViewport
          mode={mode}
          drawingMode={drawingMode}
          pointer={mirroredPointer}
          secondPointer={mirroredSecondPointer}
          viewportWidth={videoRef.current?.videoWidth ?? 1280}
          viewportHeight={videoRef.current?.videoHeight ?? 720}
          sketches={sketches}
          finishSignal={finishSignal}
          deselectSignal={deselectSignal}
          onFinishSketch={addSketch}
          onUpdateStroke={updateStroke}
          onSelectionProgressChange={setSelectionProgress}
          onSelectionStateChange={setHasSelection}
        />
      </div>

      {/* MediaPipe handtracking */}
      <canvas
        ref={overlayCanvasRef}
        className="
          pointer-events-none
          absolute inset-0 z-30
          h-full w-full
          -scale-x-100
        "
      />

      {/* Bovenste knoppen */}
      <div className="absolute left-4 top-4 z-50 flex gap-2">
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
          onClick={() => setFinishSignal((current) => current + 1)}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          Finish Sketch
        </button>

        <button
          onClick={clearSketches}
          className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur hover:bg-white/20"
        >
          Clear
        </button>

        <button
          onClick={removeLastSketch}
          className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur hover:bg-white/20"
        >
          Undo
        </button>
      </div>

      {/* Drawing mode knoppen */}
      <div className="absolute left-4 top-16 z-50 flex gap-2">
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

      {/* Camera error */}
      {error && (
        <div className="absolute bottom-4 left-4 z-50 rounded-xl bg-red-500/20 p-3 text-sm text-red-100 backdrop-blur">
          {error}
        </div>
      )}

      {/* Development status */}
      <div className="absolute right-4 top-4 z-50 flex flex-col gap-2">
        <div className="rounded-full bg-black/60 px-3 py-1 text-sm text-white backdrop-blur">
          {isLoading
            ? "Camera starten..."
            : isActive
              ? "Camera actief"
              : "Camera uit"}
        </div>

        <div className="rounded-full bg-black/60 px-3 py-1 text-sm text-white backdrop-blur">
          Gesture: {mode}
        </div>
        {hasSelection && (
          <button
            onClick={() => setDeselectSignal((current) => current + 1)}
            className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500"
          >
            Deselect
          </button>
        )}
      </div>
    </div>
  );
}
