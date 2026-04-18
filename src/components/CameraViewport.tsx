import { useRef } from "react";
import { useCamera } from "../hooks/useCamera";
import { useHandTracking } from "../hooks/useHandTracking";

export default function CameraViewport() {
  const { videoRef, isLoading, isActive, error, startCamera, stopCamera } =
    useCamera({
      autoStart: false,
      width: 1280,
      height: 720,
      facingMode: "user",
    });

  const drawingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const { mode } = useHandTracking({
    videoRef,
    overlayCanvasRef,
    enabled: isActive,
  });

  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl bg-zinc-900">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 h-full w-full object-cover"
      />

      <canvas
        ref={drawingCanvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full"
      />

      <canvas
        ref={overlayCanvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full"
      />

      <div className="absolute left-4 top-4 flex gap-2">
        <button
          onClick={() => void startCamera()}
          className="rounded-xl bg-white/10 px-3 py-2 text-sm text-white"
        >
          Start
        </button>

        <button
          onClick={stopCamera}
          className="rounded-xl bg-white/10 px-3 py-2 text-sm text-white"
        >
          Stop
        </button>
      </div>

      <div className="absolute right-4 top-4 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
        {isLoading
          ? "Camera starten..."
          : isActive
            ? "Camera actief"
            : "Camera uit"}
      </div>

      <div className="absolute right-4 top-16 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
        Draw mode: {mode === "draw" ? "aan" : "uit"}
      </div>

      {error && (
        <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-red-500/20 p-3 text-sm text-red-100">
          {error}
        </div>
      )}
    </div>
  );
}
