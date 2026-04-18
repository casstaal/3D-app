import { useState } from "react";
import {
  Hand,
  Download,
  MousePointer2,
  Rotate3D,
  Move3D,
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

export default function HandCadUiStarter() {
  const [activeTool, setActiveTool] = useState("hand-nav");

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="grid min-h-screen grid-cols-[84px_1fr_320px]">
        <aside className="border-r border-zinc-800 bg-zinc-900/80 p-3">
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
              <h1 className="text-white text-lg font-semibold">
                Hand CAD Prototype
              </h1>
            </div>
          </header>

          <div className="grid flex-1 grid-rows-[1fr_180px] gap-4 p-4">
            <section className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl">
              <div className="grid h-full grid-cols-[1.1fr_0.9fr]">
                <div className="relative border-r border-zinc-800 bg-[radial-gradient(circle_at_top,_rgba(80,80,80,0.18),_transparent_35%),linear-gradient(to_bottom_right,_rgba(39,39,42,0.95),_rgba(9,9,11,1))]">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <h2 className="text-lg font-medium">Camera viewport</h2>
                      <div className="h-[70vh] overflow-hidden rounded-3xl border border-zinc-800">
                        <CameraViewport />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-[1fr_1fr_1fr] gap-4">
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
      </div>
    </div>
  );
}
