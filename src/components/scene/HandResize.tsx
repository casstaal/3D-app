import { useEffect, useRef } from "react";

import { useThree } from "@react-three/fiber";

import * as THREE from "three";

import type { GestureMode, Point } from "../../features/handTracking/types";

import type { Sketch, SketchStroke } from "../../features/modeling/sketchTypes";

type HandResizeProps = {
  mode: GestureMode;

  pointer: Point | null;
  secondPointer: Point | null;

  selectedId: string | null;

  sketches: Sketch[];

  onUpdateStroke: (
    strokeId: string,

    updater: (stroke: SketchStroke) => SketchStroke,
  ) => void;
};

type Axis = "x" | "y" | "z";

type ResizeStart = {
  pointer: Point;

  secondPointer: Point;

  stroke: SketchStroke;

  sketchQuaternion: THREE.Quaternion;
};

const DEADZONE = 15;

const SENSITIVITY = 300;

const MIN_SIZE = 0.05;

export default function HandResize({
  mode,
  pointer,
  secondPointer,
  selectedId,
  sketches,
  onUpdateStroke,
}: HandResizeProps) {
  const { camera } = useThree();

  const startRef = useRef<ResizeStart | null>(null);

  useEffect(() => {
    const resizing =
      mode === "resize" &&
      pointer !== null &&
      secondPointer !== null &&
      selectedId !== null;

    if (!resizing) {
      startRef.current = null;

      return;
    }

    let selectedStroke: SketchStroke | null = null;

    let selectedSketch: Sketch | null = null;

    for (const sketch of sketches) {
      const found = sketch.strokes.find((stroke) => stroke.id === selectedId);

      if (found) {
        selectedStroke = found;

        selectedSketch = sketch;

        break;
      }
    }

    if (!selectedStroke || !selectedSketch) {
      return;
    }

    if (
      startRef.current === null ||
      startRef.current.stroke.id !== selectedId
    ) {
      startRef.current = {
        pointer: {
          ...pointer,
        },

        secondPointer: {
          ...secondPointer,
        },

        stroke: structuredClone(selectedStroke),

        sketchQuaternion: new THREE.Quaternion(
          selectedSketch.quaternion.x,

          selectedSketch.quaternion.y,

          selectedSketch.quaternion.z,

          selectedSketch.quaternion.w,
        ),
      };

      return;
    }

    const start = startRef.current;

    const startDx = Math.abs(start.secondPointer.x - start.pointer.x);

    const startDy = Math.abs(start.secondPointer.y - start.pointer.y);

    const currentDx = Math.abs(secondPointer.x - pointer.x);

    const currentDy = Math.abs(secondPointer.y - pointer.y);

    const changeX = currentDx - startDx;

    const changeY = currentDy - startDy;

    if (Math.abs(changeX) < DEADZONE && Math.abs(changeY) < DEADZONE) {
      return;
    }

    const localX = new THREE.Vector3(1, 0, 0)
      .applyQuaternion(start.sketchQuaternion)
      .normalize();

    const localY = new THREE.Vector3(0, 1, 0)
      .applyQuaternion(start.sketchQuaternion)
      .normalize();

    const localZ = new THREE.Vector3(0, 0, 1)
      .applyQuaternion(start.sketchQuaternion)
      .normalize();

    const cameraRight = new THREE.Vector3(1, 0, 0)
      .applyQuaternion(camera.quaternion)
      .normalize();

    const cameraUp = new THREE.Vector3(0, 1, 0)
      .applyQuaternion(camera.quaternion)
      .normalize();

    const horizontalAxis = findBestAxis(cameraRight, localX, localY, localZ);

    const verticalAxis = findBestAxis(cameraUp, localX, localY, localZ);

    const horizontalScale = Math.max(
      0.2,

      1 + changeX / SENSITIVITY,
    );

    const verticalScale = Math.max(
      0.2,

      1 + changeY / SENSITIVITY,
    );

    onUpdateStroke(
      selectedId,

      () =>
        resizeShape(
          start.stroke,

          horizontalAxis,
          horizontalScale,

          verticalAxis,
          verticalScale,

          Math.abs(changeX) >= DEADZONE,

          Math.abs(changeY) >= DEADZONE,
        ),
    );
  }, [
    mode,
    pointer,
    secondPointer,
    selectedId,
    sketches,
    camera,
    onUpdateStroke,
  ]);

  return null;
}

function findBestAxis(
  screenDirection: THREE.Vector3,

  localX: THREE.Vector3,

  localY: THREE.Vector3,

  localZ: THREE.Vector3,
): Axis {
  const xScore = Math.abs(screenDirection.dot(localX));

  const yScore = Math.abs(screenDirection.dot(localY));

  const zScore = Math.abs(screenDirection.dot(localZ));

  if (xScore >= yScore && xScore >= zScore) {
    return "x";
  }

  if (yScore >= xScore && yScore >= zScore) {
    return "y";
  }

  return "z";
}

function resizeShape(
  stroke: SketchStroke,

  horizontalAxis: Axis,

  horizontalScale: number,

  verticalAxis: Axis,

  verticalScale: number,

  useHorizontal: boolean,

  useVertical: boolean,
): SketchStroke {
  if (stroke.type !== "rectangle") {
    return stroke;
  }

  let width = stroke.width;

  let height = stroke.height;

  let depth = stroke.depth;

  if (useHorizontal) {
    if (horizontalAxis === "x") {
      width = stroke.width * horizontalScale;
    }

    if (horizontalAxis === "y") {
      height = stroke.height * horizontalScale;
    }

    if (horizontalAxis === "z") {
      depth = stroke.depth * horizontalScale;
    }
  }

  if (useVertical) {
    if (verticalAxis === "x") {
      width = stroke.width * verticalScale;
    }

    if (verticalAxis === "y") {
      height = stroke.height * verticalScale;
    }

    if (verticalAxis === "z") {
      depth = stroke.depth * verticalScale;
    }
  }

  width = Math.max(MIN_SIZE, width);

  height = Math.max(MIN_SIZE, height);

  if (stroke.depth > 0) {
    depth = Math.max(MIN_SIZE, depth);
  }

  const centerX = stroke.x + stroke.width / 2;

  const centerY = stroke.y + stroke.height / 2;

  return {
    ...stroke,

    x: centerX - width / 2,

    y: centerY - height / 2,

    width,
    height,
    depth,
  };
}
