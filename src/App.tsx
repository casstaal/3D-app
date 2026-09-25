import { Download } from "lucide-react";
import CameraViewport from "./components/CameraViewport";

export default function HandCadUiStarter() {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      <div className="absolute inset-0">
        <CameraViewport />
      </div>

      {/* Export knop rechtsonder */}
      <div className="absolute bottom-6 right-6 z-50">
        <button
          className="
            flex items-center gap-2
            rounded-2xl
            border border-white/10
            bg-zinc-900/80
            px-5 py-3
            text-sm font-medium text-white
            shadow-xl
            backdrop-blur-md
            transition
            hover:bg-zinc-800
          "
        >
          <Download className="h-4 w-4" />
          Export STL
        </button>
      </div>
    </div>
  );
}
