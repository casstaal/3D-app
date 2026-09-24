import { useEffect, useMemo, useRef, useState } from "react";

import { useThree } from "@react-three/fiber";
import * as THREE from "three";

import type { GestureMode, Point } from "../../features/handTracking/types";

import type {
  Point3D,
  Sketch,
  SketchStroke,
} from "../../features/modeling/sketchTypes";

type ActiveSketchProps = {
  mode: GestureMode;
  pointer: Point | null;

  viewportWidth: number;
  viewportHeight: number;

  finishSignal: number;

  onFinish: (sketch: Sketch) => void;
};

export default function ActiveSketch({
  mode,
  pointer,
  viewportWidth,
  viewportHeight,
  finishSignal,
  onFinish,
}: ActiveSketchProps) {
  const { camera } = useThree();

  /*
    Het daadwerkelijke onzichtbare vlak waarop
    de raycaster de vinger projecteert.
  */
  const planeRef = useRef<THREE.Mesh>(null);

  /*
    De gehele sketch.

    Alle punten worden lokaal ten opzichte
    van deze group opgeslagen.
  */
  const groupRef = useRef<THREE.Group>(null);

  const raycaster = useMemo(() => new THREE.Raycaster(), []);

  const ndcPointer = useMemo(() => new THREE.Vector2(), []);

  /*
    Reeds afgeronde strokes binnen
    de huidige actieve sketch.
  */
  const [strokes, setStrokes] = useState<SketchStroke[]>([]);

  /*
    Stroke die op dit moment wordt getekend.
  */
  const [currentPoints, setCurrentPoints] = useState<Point3D[]>([]);

  const wasDrawingRef = useRef(false);

  /*
    Heel belangrijk:

    De positie en rotatie van deze ActiveSketch
    worden EENMALIG bepaald wanneer het component
    wordt aangemaakt.

    Daarna veranderen ze niet meer wanneer
    de camera beweegt.
  */
  const initialTransform = useRef<{
    position: THREE.Vector3;
    quaternion: THREE.Quaternion;
  } | null>(null);

  if (!initialTransform.current) {
    /*
      Alle sketches worden rond dezelfde
      world origin geplaatst.
    */
    const position = new THREE.Vector3(0, 0, 0);

    /*
      De sketch kijkt bij het aanmaken
      dezelfde kant op als de camera.
    */
    const quaternion = camera.quaternion.clone();

    initialTransform.current = {
      position,
      quaternion,
    };
  }

  const transform = initialTransform.current;

  /*
   * POINTER
   *   ↓
   * NDC
   *   ↓
   * RAY
   *   ↓
   * SKETCH PLANE
   *   ↓
   * LOCAL 3D POINT
   */
  useEffect(() => {
    const isDrawing =
      mode === "draw" && pointer !== null && planeRef.current !== null;

    /*
      We waren aan het tekenen,
      maar nu niet meer.

      Daarmee eindigt de huidige stroke.
    */
    if (!isDrawing) {
      if (wasDrawingRef.current) {
        finishCurrentStroke();
      }

      wasDrawingRef.current = false;

      return;
    }

    if (!pointer || !planeRef.current || !groupRef.current) {
      return;
    }

    /*
      Controle tegen delen door 0.
    */
    if (viewportWidth <= 0 || viewportHeight <= 0) {
      return;
    }

    /*
      MediaPipe geeft pixels:

      0 ---------------- width
      |
      |
      |
      height

      Three.js raycasting verwacht NDC:

              +1
               |
        -1 ----+---- +1
               |
              -1
    */
    ndcPointer.set(
      (pointer.x / viewportWidth) * 2 - 1,

      -(pointer.y / viewportHeight) * 2 + 1,
    );

    /*
      Maak vanuit de Three.js-camera
      een ray door de vingerpositie.
    */
    raycaster.setFromCamera(ndcPointer, camera);

    /*
      Zoek waar de ray ons sketchvlak raakt.
    */
    const intersections = raycaster.intersectObject(planeRef.current, false);

    /*
      Geen intersection betekent:
      vinger/ray raakt het tekenvlak niet.
    */
    if (intersections.length === 0) {
      return;
    }

    /*
      Raycaster geeft world coordinates.
    */
    const worldPoint = intersections[0].point.clone();

    /*
      Wij willen de punten NIET in world
      coordinates opslaan.

      We zetten ze om naar lokale coordinaten
      van deze specifieke sketch.
    */
    const localPoint = groupRef.current.worldToLocal(worldPoint);

    /*
      Omdat dit een plat sketchvlak is,
      forceren we z naar 0.
    */
    const point: Point3D = {
      x: localPoint.x,
      y: localPoint.y,
      z: 0,
    };

    /*
      Eerste punt van een nieuwe stroke.
    */
    if (!wasDrawingRef.current) {
      setCurrentPoints([point]);

      wasDrawingRef.current = true;

      return;
    }

    /*
      Volgende punten.
    */
    setCurrentPoints((current) => {
      const last = current[current.length - 1];

      if (!last) {
        return [point];
      }

      const dx = point.x - last.x;

      const dy = point.y - last.y;

      const distance = Math.sqrt(dx * dx + dy * dy);

      /*
        Kleine bewegingen negeren.

        Dit voorkomt enorme aantallen punten
        door handtracking-jitter.
      */
      if (distance < 0.02) {
        return current;
      }

      return [...current, point];
    });
  }, [
    mode,
    pointer,
    viewportWidth,
    viewportHeight,
    camera,
    raycaster,
    ndcPointer,
  ]);

  /*
    Huidige stroke opslaan in strokes.
  */
  function finishCurrentStroke() {
    setCurrentPoints((current) => {
      if (current.length > 1) {
        const stroke: SketchStroke = {
          id: crypto.randomUUID(),
          points: current,
        };

        setStrokes((previous) => [...previous, stroke]);
      }

      return [];
    });
  }

  /*
   * FINISH SKETCH
   *
   * Wordt uitgevoerd wanneer je op
   * "Finish Sketch" drukt.
   */
  useEffect(() => {
    if (finishSignal === 0) {
      return;
    }

    let finalStrokes = [...strokes];

    /*
      Als de gebruiker op Finish drukt
      terwijl hij nog een stroke heeft,
      nemen we die ook mee.
    */
    if (currentPoints.length > 1) {
      finalStrokes = [
        ...finalStrokes,
        {
          id: crypto.randomUUID(),
          points: currentPoints,
        },
      ];
    }

    /*
      Lege sketch niet opslaan.
    */
    if (finalStrokes.length === 0) {
      return;
    }

    /*
      Maak het definitieve Sketch-object.
    */
    const sketch: Sketch = {
      id: crypto.randomUUID(),

      position: {
        x: transform.position.x,
        y: transform.position.y,
        z: transform.position.z,
      },

      quaternion: {
        x: transform.quaternion.x,
        y: transform.quaternion.y,
        z: transform.quaternion.z,
        w: transform.quaternion.w,
      },

      strokes: finalStrokes,
    };

    /*
      Geef hem terug aan CameraViewport/store.
    */
    onFinish(sketch);

    /*
      ActiveSketch leegmaken.

      Door key={sketches.length} wordt dit
      component hierna bovendien opnieuw gemount.
    */
    setStrokes([]);
    setCurrentPoints([]);

    wasDrawingRef.current = false;
  }, [finishSignal]);

  return (
    <group
      ref={groupRef}
      position={transform.position}
      quaternion={transform.quaternion}
    >
      {/*
        ONZICHTBAAR SKETCHVLAK

        Dit vlak blijft bestaan zodat de
        Raycaster ertegenaan kan schieten.

        opacity=0 betekent alleen dat de
        gebruiker hem niet ziet.
      */}
      <mesh ref={planeRef}>
        <planeGeometry args={[6, 4]} />

        <meshBasicMaterial
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/*
        Afgeronde strokes van de
        huidige ActiveSketch.
      */}
      {strokes.map((stroke) => (
        <LocalLine key={stroke.id} points={stroke.points} />
      ))}

      {/*
        Stroke die NU getekend wordt.
      */}
      {currentPoints.length > 1 && <LocalLine points={currentPoints} />}
    </group>
  );
}

type LocalLineProps = {
  points: Point3D[];
};

function LocalLine({ points }: LocalLineProps) {
  const line = useMemo(() => {
    /*
      Omdat de lijn anders exact in hetzelfde
      vlak als het sketchplane ligt, geven we
      hem een héél kleine Z-offset.

      Dat voorkomt z-fighting.
    */
    const vectors = points.map(
      (point) => new THREE.Vector3(point.x, point.y, 0.01),
    );

    const geometry = new THREE.BufferGeometry().setFromPoints(vectors);

    const material = new THREE.LineBasicMaterial({
      color: "#22c55e",
    });

    return new THREE.Line(geometry, material);
  }, [points]);

  /*
    Three.js resources opruimen wanneer
    deze lijn verdwijnt.
  */
  useEffect(() => {
    return () => {
      line.geometry.dispose();

      if (line.material instanceof THREE.Material) {
        line.material.dispose();
      }
    };
  }, [line]);

  return <primitive object={line} />;
}
