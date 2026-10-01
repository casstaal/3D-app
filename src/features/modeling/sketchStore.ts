import { useCallback, useState } from "react";
import type { Sketch, SketchStroke } from "./sketchTypes";

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

  const updateStroke = useCallback(
    (strokeId: string, updater: (stroke: SketchStroke) => SketchStroke) => {
      setSketches((currentSketches) =>
        currentSketches.map((sketch) => {
          const containsStroke = sketch.strokes.some(
            (stroke) => stroke.id === strokeId,
          );

          if (!containsStroke) {
            return sketch;
          }

          return {
            ...sketch,

            strokes: sketch.strokes.map((stroke) => {
              if (stroke.id !== strokeId) {
                return stroke;
              }

              return updater(stroke);
            }),
          };
        }),
      );
    },
    [],
  );

  return {
    sketches,
    addSketch,
    clearSketches,
    removeLastSketch,
    updateStroke,
  };
}
