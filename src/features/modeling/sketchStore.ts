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

  const copyStroke = useCallback((strokeId: string, newStrokeId: string) => {
    setSketches((currentSketches) =>
      currentSketches.map((sketch) => {
        const stroke = sketch.strokes.find((stroke) => stroke.id === strokeId);

        if (!stroke) {
          return sketch;
        }

        if (stroke.type !== "rectangle" && stroke.type !== "circle") {
          return sketch;
        }

        if (stroke.depth <= 0) {
          return sketch;
        }

        const gap = 0.25;

        if (stroke.type === "rectangle") {
          const offsetX = Math.abs(stroke.width) + gap;

          const copy: SketchStroke = {
            ...stroke,

            id: newStrokeId,

            x: stroke.x + offsetX,
          };

          return {
            ...sketch,

            strokes: [...sketch.strokes, copy],
          };
        }

        const offsetX = stroke.radius * 2 + gap;

        const copy: SketchStroke = {
          ...stroke,

          id: newStrokeId,

          center: {
            ...stroke.center,

            x: stroke.center.x + offsetX,
          },
        };

        return {
          ...sketch,

          strokes: [...sketch.strokes, copy],
        };
      }),
    );
  }, []);

  return {
    sketches,

    addSketch,

    clearSketches,

    removeLastSketch,

    updateStroke,

    extrudeStroke,

    copyStroke,
  };
}
