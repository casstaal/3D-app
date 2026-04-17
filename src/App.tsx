import React, { useMemo, useState } from "react";
import {
  Camera,
  Box,
  Hand,
  Download,
  MousePointer2,
  Rotate3D,
  Move3D,
  ZoomIn,
  Play,
  Square,
  Circle,
} from "lucide-react";
import CameraViewport from "./components/CameraViewport";

const tools = [
  { id: "select", label: "Select", icon: MousePointer2 },
  { id: "draw-circle", label: "Circle", icon: Circle },
  { id: "draw-rect", label: "Rectangle", icon: Square },
  { id: "hand-nav", label: "Hand Nav", icon: Hand },
  { id: "rotate", label: "Rotate", icon: Rotate3D },
  { id: "move", label: "Move", icon: Move3D },
];

const gestures = [
  { name: "Pinch", action: "Select / Confirm" },
  { name: "Open hand", action: "Navigate" },
  { name: "Index finger", action: "Draw path" },
  { name: "Two fingers", action: "Rotate model" },
];

export default function HandCadUiStarter() {
  const [activeTool, setActiveTool] = useState("hand-nav");
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [status, setStatus] = useState("Idle");

  const activeLabel = useMemo(() => {
    return tools.find((tool) => tool.id === activeTool)?.label ?? "Unknown";
  }, [activeTool]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="grid min-h-screen grid-cols-[84px_1fr_320px]">
        <aside className="border-r border-zinc-800 bg-zinc-900/80 p-3">
          <div className="mb-4 flex h-14 items-center justify-center rounded-2xl bg-zinc-800 text-sm font-semibold">
            HCAD
          </div>

          <div className="space-y-2">
            {tools.map((tool) => {
              const Icon = tool.icon;
              const active = activeTool === tool.id;
              return (
                <button
                  key={tool.id}
                  onClick={() => setActiveTool(tool.id)}
                  className={`flex w-full flex-col items-center gap-1 rounded-2xl px-2 py-3 transition ${
                    active
                      ? "bg-zinc-100 text-zinc-900 shadow-lg"
                      : "bg-zinc-800/70 text-zinc-300 hover:bg-zinc-800"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[11px] leading-tight text-center">
                    {tool.label}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <main className="flex min-w-0 flex-col">
          <header className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/60 px-5 py-3">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Project
              </div>
              <h1 className="text-lg font-semibold">Hand CAD Prototype</h1>
            </div>

            {/* <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setCameraEnabled((v) => !v);
                  setStatus((s) =>
                    cameraEnabled ? "Camera stopped" : "Camera ready",
                  );
                }}
                className="inline-flex items-center gap-2 rounded-2xl bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700"
              >
                <Camera className="h-4 w-4" />
                {cameraEnabled ? "Stop camera" : "Start camera"}
              </button>

              <button
                onClick={() => {
                  setTrackingEnabled((v) => !v);
                  setStatus((s) =>
                    trackingEnabled ? "Tracking paused" : "Tracking enabled",
                  );
                }}
                className="inline-flex items-center gap-2 rounded-2xl bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-300"
              >
                <Play className="h-4 w-4" />
                {trackingEnabled ? "Pause tracking" : "Start tracking"}
              </button>
            </div> */}
          </header>

          <div className="grid flex-1 grid-rows-[1fr_180px] gap-4 p-4">
            <section className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl">
              {/* <div className="absolute left-4 top-4 z-10 flex gap-2">
                <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                  {cameraEnabled ? "Camera active" : "Camera off"}
                </div>
                <div className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs text-sky-300">
                  Tool: {activeLabel}
                </div>
                <div className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-300">
                  {trackingEnabled ? "Tracking on" : "Tracking off"}
                </div>
              </div> */}

              <div className="grid h-full grid-cols-[1.1fr_0.9fr]">
                <div className="relative border-r border-zinc-800 bg-[radial-gradient(circle_at_top,_rgba(80,80,80,0.18),_transparent_35%),linear-gradient(to_bottom_right,_rgba(39,39,42,0.95),_rgba(9,9,11,1))]">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      {/* <Camera className="mx-auto mb-3 h-10 w-10 text-zinc-500" /> */}
                      <h2 className="text-lg font-medium">Camera viewport</h2>
                      <div className="h-[70vh] overflow-hidden rounded-3xl border border-zinc-800">
                        <CameraViewport />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative bg-[linear-gradient(to_bottom_right,_rgba(24,24,27,1),_rgba(9,9,11,1))]">
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:28px_28px]" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Box className="mx-auto mb-3 h-10 w-10 text-zinc-500" />
                      <h2 className="text-lg font-medium">3D preview</h2>
                      <p className="mt-2 max-w-md text-sm text-zinc-400">
                        Hier komt straks de Three.js scene met een mesh,
                        orbit-controls en STL-export.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-[1fr_1fr_1fr] gap-4">
              <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-4">
                <div className="mb-2 text-sm font-semibold">Status</div>
                <div className="rounded-2xl bg-zinc-800 p-3 text-sm text-zinc-300">
                  {status}
                </div>
              </div>

              <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-4">
                <div className="mb-2 text-sm font-semibold">Input mode</div>
                <div className="space-y-2 text-sm text-zinc-300">
                  <div className="flex items-center justify-between rounded-2xl bg-zinc-800 p-3">
                    <span>Current tool</span>
                    <span className="font-medium text-zinc-100">
                      {activeLabel}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-zinc-800 p-3">
                    <span>Tracking</span>
                    <span className="font-medium text-zinc-100">
                      {trackingEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-4">
                <div className="mb-2 flex items-center justify-between text-sm font-semibold">
                  <span>Export</span>
                  <Download className="h-4 w-4 text-zinc-500" />
                </div>
                <button className="w-full rounded-2xl bg-zinc-100 px-4 py-3 text-sm font-medium text-zinc-900 hover:bg-zinc-300">
                  Export STL
                </button>
              </div>
            </section>
          </div>
        </main>

        <aside className="border-l border-zinc-800 bg-zinc-900/80 p-4">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-3 text-sm font-semibold">Gesture map</div>
            <div className="space-y-2">
              {gestures.map((gesture) => (
                <div key={gesture.name} className="rounded-2xl bg-zinc-800 p-3">
                  <div className="text-sm font-medium text-zinc-100">
                    {gesture.name}
                  </div>
                  <div className="text-sm text-zinc-400">{gesture.action}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-3xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-3 text-sm font-semibold">Next wiring steps</div>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-zinc-300">
              <li>Webcam stream koppelen aan een video element.</li>
              <li>MediaPipe hand landmarks per frame verwerken.</li>
              <li>Canvas overlay tekenen boven de camera feed.</li>
              <li>Three.js scene koppelen aan geselecteerde tool.</li>
              <li>Gesture events vertalen naar rotate / select / draw.</li>
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}
