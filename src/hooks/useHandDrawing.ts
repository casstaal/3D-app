// import { useEffect, useRef } from "react";
// import type {
//   DrawItem,
//   DrawingMode,
//   GestureMode,
//   Point,
//   Stroke,
// } from "../features/handTracking/types";
// import { detectShapeFromStroke } from "../features/modeling/shapeBuilder";

// type UseHandDrawingOptions = {
//   drawingCanvasRef: React.RefObject<HTMLCanvasElement | null>;
//   videoRef: React.RefObject<HTMLVideoElement | null>;
//   enabled: boolean;
//   mode: GestureMode;
//   pointer: Point | null;
//   drawingMode: DrawingMode;
// };

// export function useHandDrawing({
//   drawingCanvasRef,
//   videoRef,
//   enabled,
//   mode,
//   pointer,
//   drawingMode,
// }: UseHandDrawingOptions) {
//   // Alles wat definitief op het canvas moet blijven staan
//   const itemsRef = useRef<DrawItem[]>([]);

//   // De lijn waar de gebruiker NU mee bezig is
//   const currentStrokeRef = useRef<Stroke | null>(null);

//   // Om te weten of we in het vorige frame nog aan het tekenen waren
//   const wasDrawingRef = useRef(false);

//   // Zorg dat drawing canvas dezelfde echte grootte heeft als de video
//   useEffect(() => {
//     const canvas = drawingCanvasRef.current;
//     const video = videoRef.current;

//     if (!canvas || !video) return;

//     if (
//       video.videoWidth > 0 &&
//       video.videoHeight > 0 &&
//       (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight)
//     ) {
//       canvas.width = video.videoWidth;
//       canvas.height = video.videoHeight;

//       redraw(canvas, itemsRef.current, currentStrokeRef.current);
//     }
//   }, [drawingCanvasRef, videoRef, enabled]);

//   useEffect(() => {
//     const canvas = drawingCanvasRef.current;
//     if (!canvas) return;

//     // Tracking staat uit
//     if (!enabled) {
//       currentStrokeRef.current = null;
//       wasDrawingRef.current = false;
//       redraw(canvas, itemsRef.current, null);
//       return;
//     }

//     const isDrawing = mode === "draw" && pointer !== null;

//     // 1. Start van een nieuwe stroke
//     if (isDrawing && !wasDrawingRef.current) {
//       currentStrokeRef.current = {
//         type: "stroke",
//         points: [pointer],
//       };
//     }

//     // 2. Tijdens het tekenen: voeg nieuwe punten toe
//     else if (isDrawing && wasDrawingRef.current && currentStrokeRef.current) {
//       const points = currentStrokeRef.current.points;
//       const lastPoint = points[points.length - 1];

//       const dx = pointer.x - lastPoint.x;
//       const dy = pointer.y - lastPoint.y;
//       const distance = Math.sqrt(dx * dx + dy * dy);

//       // Alleen toevoegen als de vinger echt iets verplaatst is
//       if (distance > 2) {
//         points.push(pointer);
//       }
//     }

//     // 3. Einde van de stroke
//     else if (!isDrawing && wasDrawingRef.current) {
//       if (
//         currentStrokeRef.current &&
//         currentStrokeRef.current.points.length > 1
//       ) {
//         const finalItem =
//           drawingMode === "shape-detect"
//             ? detectShapeFromStroke(currentStrokeRef.current)
//             : currentStrokeRef.current;

//         itemsRef.current.push(finalItem);
//       }

//       currentStrokeRef.current = null;
//     }

//     wasDrawingRef.current = isDrawing;

//     redraw(canvas, itemsRef.current, currentStrokeRef.current);
//   }, [drawingCanvasRef, enabled, mode, pointer, drawingMode]);

//   const clear = () => {
//     itemsRef.current = [];
//     currentStrokeRef.current = null;

//     const canvas = drawingCanvasRef.current;
//     if (!canvas) return;

//     const ctx = canvas.getContext("2d");
//     if (!ctx) return;

//     ctx.clearRect(0, 0, canvas.width, canvas.height);
//   };

//   const undo = () => {
//     // Als je nog bezig bent met tekenen: verwijder huidige stroke
//     if (currentStrokeRef.current) {
//       currentStrokeRef.current = null;
//       wasDrawingRef.current = false;
//     } else {
//       // Anders verwijder laatste definitieve item
//       itemsRef.current.pop();
//     }

//     const canvas = drawingCanvasRef.current;
//     if (!canvas) return;

//     redraw(canvas, itemsRef.current, currentStrokeRef.current);
//   };

//   return {
//     clear,
//     undo,
//   };
// }

// function redraw(
//   canvas: HTMLCanvasElement,
//   items: DrawItem[],
//   currentStroke: Stroke | null,
// ) {
//   const ctx = canvas.getContext("2d");
//   if (!ctx) return;

//   ctx.clearRect(0, 0, canvas.width, canvas.height);

//   // Definitieve items tekenen
//   for (const item of items) {
//     drawItem(ctx, item, "#22c55e");
//   }

//   // Huidige stroke tonen in lichtere kleur als preview
//   if (currentStroke) {
//     drawItem(ctx, currentStroke, "#86efac");
//   }
// }

// function drawItem(
//   ctx: CanvasRenderingContext2D,
//   item: DrawItem,
//   color: string,
// ) {
//   ctx.strokeStyle = color;
//   ctx.lineWidth = 4;
//   ctx.lineCap = "round";
//   ctx.lineJoin = "round";

//   if (item.type === "stroke") {
//     drawStroke(ctx, item);
//     return;
//   }

//   if (item.type === "line") {
//     ctx.beginPath();
//     ctx.moveTo(item.start.x, item.start.y);
//     ctx.lineTo(item.end.x, item.end.y);
//     ctx.stroke();
//     return;
//   }

//   if (item.type === "rectangle") {
//     ctx.strokeRect(item.x, item.y, item.width, item.height);
//     return;
//   }

//   if (item.type === "circle") {
//     ctx.beginPath();
//     ctx.arc(item.cx, item.cy, item.radius, 0, Math.PI * 2);
//     ctx.stroke();
//   }
// }

// function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
//   if (stroke.points.length < 2) return;

//   ctx.beginPath();
//   ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

//   for (let i = 1; i < stroke.points.length; i++) {
//     ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
//   }

//   ctx.stroke();
// }
