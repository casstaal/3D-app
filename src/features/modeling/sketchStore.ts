import { useCallback, useState } from "react";
import type { Sketch } from "./sketchTypes";

export function useSketchStore() {
  const [sketches, setSketches] = useState<Sketch[]>([]);

  const addSketch = useCallback((sketch: Sketch) => {
    setSketches((current) => [...current, sketch]);
  }, []);

  const clearSketches = useCallback(() => {
    setSketches([]);
  }, []);

  const removeLastSketch = useCallback(() => {
    setSketches((current) => current.slice(0, -1));
  }, []);

  return {
    sketches,
    addSketch,
    clearSketches,
    removeLastSketch,
  };
}
