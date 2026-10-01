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
    (
      strokeId: string,

      updater: (stroke: SketchStroke) => SketchStroke,
    ) => {
      setSketches((currentSketches) =>
        currentSketches.map((sketch) => ({
          ...sketch,

          strokes: sketch.strokes.map((stroke) =>
            stroke.id === strokeId ? updater(stroke) : stroke,
          ),
        })),
      );
    },
    [],
  );

  const extrudeStroke = useCallback(
    (
      strokeId: string,

      depth: number,
    ) => {
      setSketches((currentSketches) =>
        currentSketches.map((sketch) => ({
          ...sketch,

          strokes: sketch.strokes.map((stroke) => {
            if (stroke.id !== strokeId) {
              return stroke;
            }

            if (stroke.type === "rectangle") {
              return {
                ...stroke,

                depth: Math.max(0, depth),
              };
            }

            if (stroke.type === "circle") {
              return {
                ...stroke,

                depth: Math.max(0, depth),
              };
            }

            return stroke;
          }),
        })),
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

    extrudeStroke,
  };
}
