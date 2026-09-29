import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

import type { GestureMode, Point } from "../../features/handTracking/types";

type HandSelectionProps = {
  mode: GestureMode;
  pointer: Point | null;

  viewportWidth: number;
  viewportHeight: number;

  selectableRoot: React.RefObject<THREE.Group | null>;

  selectedId: string | null;

  onHoverChange: (id: string | null) => void;

  onSelectionChange: (id: string | null) => void;

  onProgressChange: (progress: number) => void;
};

const SELECTION_TIME = 3000;

export default function HandSelection({
  mode,
  pointer,
  viewportWidth,
  viewportHeight,
  selectableRoot,
  selectedId,
  onHoverChange,
  onSelectionChange,
  onProgressChange,
}: HandSelectionProps) {
  const { camera } = useThree();

  const raycasterRef = useRef(new THREE.Raycaster());

  const ndcRef = useRef(new THREE.Vector2());

  const hoveredIdRef = useRef<string | null>(null);

  const hoverStartRef = useRef<number | null>(null);

  function resetHover() {
    if (hoveredIdRef.current !== null) {
      onHoverChange(null);
    }

    hoveredIdRef.current = null;
    hoverStartRef.current = null;

    onProgressChange(0);
  }

  useFrame(() => {
    if (
      mode !== "select" ||
      !pointer ||
      !selectableRoot.current ||
      viewportWidth <= 0 ||
      viewportHeight <= 0
    ) {
      resetHover();
      return;
    }

    if (selectedId !== null) {
      resetHover();
      return;
    }

    ndcRef.current.set(
      (pointer.x / viewportWidth) * 2 - 1,
      -(pointer.y / viewportHeight) * 2 + 1,
    );

    raycasterRef.current.setFromCamera(ndcRef.current, camera);

    const intersections = raycasterRef.current.intersectObject(
      selectableRoot.current,
      true,
    );

    const hit = intersections.find(
      (intersection) =>
        intersection.object.userData.selectable === true &&
        typeof intersection.object.userData.strokeId === "string",
    );

    const hitId = hit?.object.userData.strokeId ?? null;

    if (!hitId) {
      resetHover();
      return;
    }

    if (hoveredIdRef.current !== hitId) {
      hoveredIdRef.current = hitId;

      hoverStartRef.current = performance.now();

      onHoverChange(hitId);
      onProgressChange(0);

      return;
    }

    if (hoverStartRef.current === null) {
      hoverStartRef.current = performance.now();

      return;
    }

    const elapsed = performance.now() - hoverStartRef.current;

    const progress = Math.min(elapsed / SELECTION_TIME, 1);

    onProgressChange(progress);

    if (progress >= 1) {
      onSelectionChange(hitId);

      resetHover();
    }
  });

  return null;
}
