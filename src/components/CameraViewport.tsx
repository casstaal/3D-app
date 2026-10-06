import { useEffect, useRef, useState } from "react";

import {
  Camera,
  Check,
  Download,
  Hand,
  MousePointer2,
  OctagonX,
  Play,
  Redo2,
  RotateCcw,
  Shapes,
  Square,
  Trash2,
  Undo2,
  Video,
  Waves,
  Box,
} from "lucide-react";

import { useCamera } from "../hooks/useCamera";

import { useHandTracking } from "../hooks/useHandTracking";

import type { DrawingMode } from "../features/handTracking/types";

import { useSketchStore } from "../features/modeling/sketchStore";

import { exportSketchesToSTL } from "../features/modeling/stlExporter";

import SceneViewport from "./SceneViewport";

export default function CameraViewport() {
  const {
    videoRef,

    isLoading,
    isActive,
    error,

    startCamera,
    stopCamera,
  } = useCamera({
    autoStart: false,

    width: 1280,
    height: 720,

    facingMode: "user",
  });

  const [drawingMode, setDrawingMode] = useState<DrawingMode>("free");

  const [selectionProgress, setSelectionProgress] = useState(0);

  const [selectedStrokeId, setSelectedStrokeId] = useState<string | null>(null);
  const hasSelection = selectedStrokeId !== null;

  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const { mode, pointer, secondPointer, copySignal } = useHandTracking({
    videoRef,
    overlayCanvasRef,
    enabled: isActive,
    selectionProgress,
  });

  const {
    sketches,
    addSketch,
    clearSketches,
    removeLastSketch,
    updateStroke,
    extrudeStroke,
    copyStroke,
  } = useSketchStore();

  const [finishSignal, setFinishSignal] = useState(0);

  const [deselectSignal, setDeselectSignal] = useState(0);

  const videoWidth = videoRef.current?.videoWidth ?? 1280;

  const videoHeight = videoRef.current?.videoHeight ?? 720;

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

  const selectedStroke = selectedStrokeId
    ? sketches
        .flatMap((sketch) => sketch.strokes)
        .find((stroke) => stroke.id === selectedStrokeId)
    : null;

  const canUseObjectActions = selectedStroke !== null;

  const canExtrude =
    canUseObjectActions &&
    (selectedStroke?.type === "rectangle" || selectedStroke?.type === "circle");

  const canCopy =
    selectedStroke !== null &&
    ((selectedStroke?.type === "rectangle" && selectedStroke.depth > 0) ||
      (selectedStroke?.type === "circle" && selectedStroke.depth > 0));

  const hasExportableObjects = sketches.some((sketch) =>
    sketch.strokes.some(
      (stroke) =>
        (stroke.type === "rectangle" || stroke.type === "circle") &&
        stroke.depth > 0,
    ),
  );

  const lastCopySignalRef = useRef(copySignal);

  useEffect(() => {
    if (copySignal === lastCopySignalRef.current) {
      return;
    }

    lastCopySignalRef.current = copySignal;

    if (!selectedStrokeId || !canCopy) {
      return;
    }

    const newStrokeId = crypto.randomUUID();

    copyStroke(selectedStrokeId, newStrokeId);

    setSelectedStrokeId(newStrokeId);
  }, [copySignal, selectedStrokeId, canCopy, copyStroke]);

  function handleFinishSketch() {
    setFinishSignal((current) => current + 1);
  }

  function handleUndo() {
    removeLastSketch();

    setSelectedStrokeId(null);
  }

  function handleClear() {
    clearSketches();

    setSelectedStrokeId(null);
  }

  function handleDeselect() {
    if (!canUseObjectActions) {
      return;
    }

    setDeselectSignal((current) => current + 1);
  }

  function handleExtrude() {
    if (!selectedStrokeId || !canExtrude) {
      return;
    }

    extrudeStroke(selectedStrokeId, 0.5);
  }

  function handleExportSTL() {
    exportSketchesToSTL(sketches, "hand-cad-model.stl");
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#929292]">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="
          absolute
          inset-0
          z-0
          h-full
          w-full
          -scale-x-100
          object-cover
        "
      />

      <div className="absolute inset-0 z-20">
        <SceneViewport
          mode={mode}
          drawingMode={drawingMode}
          pointer={mirroredPointer}
          secondPointer={mirroredSecondPointer}
          viewportWidth={videoWidth}
          viewportHeight={videoHeight}
          sketches={sketches}
          finishSignal={finishSignal}
          deselectSignal={deselectSignal}
          onFinishSketch={addSketch}
          onUpdateStroke={updateStroke}
          onSelectionProgressChange={setSelectionProgress}
          selectedStrokeId={selectedStrokeId}
          onSelectedStrokeChange={setSelectedStrokeId}
        />
      </div>

      <canvas
        ref={overlayCanvasRef}
        className="
          pointer-events-none
          absolute
          inset-0
          z-30
          h-full
          w-full
          -scale-x-100
        "
      />

      <aside
        className="
          absolute
          left-4
          top-4
          z-50
          w-[180px]
          overflow-hidden
          rounded-xl
          border
          border-white/10
          bg-[#202329]/95
          p-3
          text-white
          shadow-2xl
          backdrop-blur-md
        "
      >
        <ToolbarSection title="CAMERA" icon={<Camera size={13} />} first>
          <div className="grid grid-cols-2 gap-2">
            <ToolbarButton
              active={isActive}
              disabled={isLoading || isActive}
              onClick={() => void startCamera()}
              icon={<Video size={15} />}
              variant="green"
            >
              Start
            </ToolbarButton>

            <ToolbarButton
              disabled={!isActive}
              onClick={stopCamera}
              icon={<Square size={13} fill="currentColor" />}
            >
              Stop
            </ToolbarButton>
          </div>
        </ToolbarSection>

        <ToolbarSection title="TEKEN MODUS" icon={<Shapes size={13} />}>
          <div className="grid grid-cols-2 gap-2">
            <ToolbarButton
              active={drawingMode === "free"}
              onClick={() => setDrawingMode("free")}
              icon={<Waves size={16} />}
              variant="blue"
              title="Free draw"
            />

            <ToolbarButton
              active={drawingMode === "shape-detect"}
              onClick={() => setDrawingMode("shape-detect")}
              icon={<Shapes size={16} />}
              variant="blue"
              title="Shape detect"
            />
          </div>
        </ToolbarSection>

        <ToolbarSection title="TEKEN ACTIES" icon={<MousePointer2 size={13} />}>
          <div className="flex flex-col gap-1.5">
            <ToolbarButton
              onClick={handleFinishSketch}
              icon={<Check size={15} />}
              fullWidth
            >
              Finish sketch
            </ToolbarButton>

            <ToolbarButton
              onClick={handleUndo}
              disabled={sketches.length === 0}
              icon={<Undo2 size={15} />}
              fullWidth
            >
              Undo
            </ToolbarButton>

            <ToolbarButton
              onClick={handleClear}
              disabled={sketches.length === 0}
              icon={<Trash2 size={15} />}
              fullWidth
            >
              Clear
            </ToolbarButton>
          </div>
        </ToolbarSection>

        <ToolbarSection title="OBJECT ACTIES" icon={<Box size={13} />}>
          <div className="flex flex-col gap-1.5">
            <ToolbarButton
              onClick={handleExtrude}
              disabled={!canExtrude}
              icon={<Box size={15} />}
              variant="orange"
              fullWidth
              title={
                !hasSelection
                  ? "Selecteer eerst een object"
                  : !canExtrude
                    ? "Alleen een rectangle of circle kan worden geëxtrudeerd"
                    : "Extrude geselecteerd object"
              }
            >
              Extrude
            </ToolbarButton>
            <ToolbarButton
              onClick={handleDeselect}
              disabled={!canUseObjectActions}
              icon={<OctagonX size={15} />}
              fullWidth
            >
              Deselect
            </ToolbarButton>
          </div>
        </ToolbarSection>
      </aside>
      <div
        className="
          pointer-events-none
          absolute
          right-4
          top-4
          z-50
          min-w-[150px]
          rounded-xl
          border
          border-white/10
          bg-[#202329]/95
          px-4
          py-3
          text-white
          shadow-xl
          backdrop-blur-md
        "
      >
        <StatusRow
          icon={
            <span
              className={`
                h-2
                w-2
                rounded-full
                ${
                  isActive
                    ? "bg-emerald-400"
                    : isLoading
                      ? "bg-amber-400"
                      : "bg-zinc-500"
                }
              `}
            />
          }
        >
          {isLoading
            ? "Camera starten..."
            : isActive
              ? "Camera actief"
              : "Camera uit"}
        </StatusRow>

        <StatusRow icon={<Hand size={16} />}>Gesture: {mode}</StatusRow>
      </div>
      <button
        type="button"
        onClick={handleExportSTL}
        disabled={!hasExportableObjects}
        className="
          absolute
          bottom-4
          right-4
          z-50
          flex
          h-11
          items-center
          gap-2
          rounded-xl
          border
          border-white/10
          bg-[#202329]/95
          px-5
          text-sm
          font-semibold
          text-white
          shadow-xl
          backdrop-blur-md
          transition
          hover:bg-[#30343b]
          active:scale-[0.98]
        "
      >
        <Download size={16} />
        Export STL
      </button>

      {error && (
        <div
          className="
            absolute
            bottom-4
            left-[212px]
            z-50
            max-w-md
            rounded-xl
            border
            border-red-400/20
            bg-red-950/80
            px-4
            py-3
            text-sm
            text-red-100
            shadow-xl
            backdrop-blur-md
          "
        >
          {error}
        </div>
      )}
    </div>
  );
}

type ToolbarSectionProps = {
  title: string;

  icon?: React.ReactNode;

  children: React.ReactNode;

  first?: boolean;
};

function ToolbarSection({
  title,
  icon,
  children,
  first = false,
}: ToolbarSectionProps) {
  return (
    <section
      className={`
        ${first ? "" : "mt-3 border-t border-white/10 pt-3"}
      `}
    >
      <div
        className="
          mb-2
          flex
          items-center
          gap-1.5
          px-1
          text-[10px]
          font-semibold
          uppercase
          tracking-[0.08em]
          text-zinc-400
        "
      >
        {icon}

        <span>{title}</span>
      </div>

      {children}
    </section>
  );
}

type ToolbarButtonProps = {
  children?: React.ReactNode;

  icon?: React.ReactNode;

  onClick?: () => void;

  disabled?: boolean;

  active?: boolean;

  fullWidth?: boolean;

  title?: string;

  variant?: "default" | "green" | "blue" | "orange";
};

function ToolbarButton({
  children,
  icon,
  onClick,
  disabled = false,
  active = false,
  fullWidth = false,
  title,
  variant = "default",
}: ToolbarButtonProps) {
  const activeClass =
    variant === "green"
      ? "bg-emerald-600 hover:bg-emerald-500"
      : variant === "blue"
        ? "bg-blue-600 hover:bg-blue-500"
        : variant === "orange"
          ? "bg-orange-600 hover:bg-orange-500"
          : "bg-zinc-600 hover:bg-zinc-500";

  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`
        flex
        h-9
        items-center
        justify-center
        gap-2
        rounded-lg
        px-3
        text-xs
        font-semibold
        text-white
        transition

        ${fullWidth ? "w-full justify-start" : ""}

        ${
          active
            ? activeClass
            : variant === "orange" && !disabled
              ? "bg-orange-600 hover:bg-orange-500"
              : "bg-white/10 hover:bg-white/15"
        }

        ${
          disabled
            ? "cursor-not-allowed opacity-35 hover:bg-white/10"
            : "cursor-pointer active:scale-[0.98]"
        }
      `}
    >
      {icon}

      {children && <span>{children}</span>}
    </button>
  );
}

type StatusRowProps = {
  icon: React.ReactNode;

  children: React.ReactNode;
};

function StatusRow({ icon, children }: StatusRowProps) {
  return (
    <div
      className="
        flex
        h-8
        items-center
        gap-2
        whitespace-nowrap
        text-xs
        font-semibold
        text-zinc-100
      "
    >
      <span className="flex w-4 items-center justify-center text-zinc-300">
        {icon}
      </span>

      <span>{children}</span>
    </div>
  );
}
