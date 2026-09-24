// import { useEffect, useMemo, useRef, useState } from "react";
// import { useThree } from "@react-three/fiber";
// import * as THREE from "three";

// import type { GestureMode, Point } from "../../features/handTracking/types";

// type SketchPlaneProps = {
//   mode: GestureMode;
//   pointer: Point | null;
//   viewportWidth: number;
//   viewportHeight: number;
// };

// export default function SketchPlane({
//   mode,
//   pointer,
//   viewportWidth,
//   viewportHeight,
// }: SketchPlaneProps) {
//   const { camera } = useThree();

//   const planeRef = useRef<THREE.Mesh>(null);

//   const [strokes, setStrokes] = useState<THREE.Vector3[][]>([]);
//   const currentStrokeRef = useRef<THREE.Vector3[]>([]);
//   const wasDrawingRef = useRef(false);

//   const raycaster = useMemo(() => new THREE.Raycaster(), []);

//   const ndcPointer = useMemo(() => new THREE.Vector2(), []);

//   useEffect(() => {
//     const isDrawing =
//       mode === "draw" && pointer !== null && planeRef.current !== null;

//     if (!isDrawing) {
//       if (wasDrawingRef.current) {
//         finishStroke();
//       }

//       wasDrawingRef.current = false;
//       return;
//     }

//     if (!pointer || !planeRef.current) {
//       return;
//     }

//     // MediaPipe pixels -> Three.js NDC (-1 t/m +1)
//     ndcPointer.set(
//       (pointer.x / viewportWidth) * 2 - 1,
//       -(pointer.y / viewportHeight) * 2 + 1,
//     );

//     // Ray vanuit virtuele camera door de pointer
//     raycaster.setFromCamera(ndcPointer, camera);

//     // Kijk waar die ray ons sketchvlak raakt
//     const intersections = raycaster.intersectObject(planeRef.current, false);

//     if (intersections.length === 0) {
//       return;
//     }

//     const hit = intersections[0];

//     // World-space 3D punt
//     const point = hit.point.clone();

//     if (!wasDrawingRef.current) {
//       currentStrokeRef.current = [point];
//       wasDrawingRef.current = true;

//       // Forceer render zodat eerste punt geregistreerd wordt
//       setStrokes((previous) => [...previous]);
//       return;
//     }

//     const currentStroke = currentStrokeRef.current;
//     const lastPoint = currentStroke[currentStroke.length - 1];

//     // Voorkomt honderden vrijwel identieke punten
//     if (!lastPoint || lastPoint.distanceTo(point) > 0.02) {
//       currentStroke.push(point);

//       // Nieuwe array zodat React opnieuw rendert
//       setStrokes((previous) => [...previous]);
//     }
//   }, [
//     mode,
//     pointer,
//     viewportWidth,
//     viewportHeight,
//     camera,
//     raycaster,
//     ndcPointer,
//   ]);

//   function finishStroke() {
//     if (currentStrokeRef.current.length > 1) {
//       const finishedStroke = currentStrokeRef.current.map((point) =>
//         point.clone(),
//       );

//       setStrokes((previous) => [...previous, finishedStroke]);
//     }

//     currentStrokeRef.current = [];
//   }

//   return (
//     <>
//       {/* Het oppervlak waarop we tekenen */}
//       <mesh ref={planeRef} position={[0, 0, 0]}>
//         <planeGeometry args={[6, 4]} />

//         <meshBasicMaterial
//           transparent
//           opacity={0.08}
//           side={THREE.DoubleSide}
//           color="#ffffff"
//         />
//       </mesh>

//       {/* Definitieve strokes */}
//       {strokes.map((stroke, index) => (
//         <StrokeLine key={index} points={stroke} />
//       ))}

//       {/* Stroke waar je nu mee bezig bent */}
//       {currentStrokeRef.current.length > 1 && (
//         <StrokeLine points={currentStrokeRef.current} />
//       )}
//     </>
//   );
// }

// type StrokeLineProps = {
//   points: THREE.Vector3[];
// };

// function StrokeLine({ points }: StrokeLineProps) {
//   const line = useMemo(() => {
//     const geometry = new THREE.BufferGeometry().setFromPoints(points);

//     const material = new THREE.LineBasicMaterial({
//       color: "#22c55e",
//     });

//     return new THREE.Line(geometry, material);
//   }, [points]);

//   useEffect(() => {
//     return () => {
//       line.geometry.dispose();

//       if (line.material instanceof THREE.Material) {
//         line.material.dispose();
//       }
//     };
//   }, [line]);

//   return <primitive object={line} />;
// }
