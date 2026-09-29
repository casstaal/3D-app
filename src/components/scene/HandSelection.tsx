import { useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
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

  const pointerNdcRef = useRef(new THREE.Vector2());

  const hoveredIdRef = useRef<string | null>(null);

  const hoverStartRef = useRef<number | null>(null);

  useEffect(() => {
    /*
     * Alleen selecteren wanneer de gebruiker
     * geen draw/rotate gesture uitvoert.
     */
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

    /*
     * Als er al iets geselecteerd is,
     * hoeven we niet ondertussen andere
     * objecten te selecteren.
     */
    if (selectedId !== null) {
      resetHover();
      return;
    }

    /*
     * MediaPipe pixelcoördinaten omzetten
     * naar Three.js Normalized Device
     * Coordinates (-1 t/m 1).
     */
    pointerNdcRef.current.set(
      (pointer.x / viewportWidth) * 2 - 1,
      -(pointer.y / viewportHeight) * 2 + 1,
    );

    /*
     * Ray vanaf de camera door de positie
     * van de wijsvinger.
     */
    raycasterRef.current.setFromCamera(pointerNdcRef.current, camera);

    /*
     * Alle opgeslagen sketches controleren.
     */
    const intersections = raycasterRef.current.intersectObject(
      selectableRoot.current,
      true,
    );

    /*
     * Zoek de eerste Three.js lijn waarop
     * we een strokeId hebben gezet.
     */
    const hit = intersections.find(
      (intersection) =>
        intersection.object.userData.selectable === true &&
        typeof intersection.object.userData.strokeId === "string",
    );

    const hitId = hit?.object.userData.strokeId ?? null;

    /*
     * Geen object geraakt.
     */
    if (!hitId) {
      resetHover();
      return;
    }

    /*
     * Wijsvinger is naar een andere lijn
     * gegaan.
     */
    if (hoveredIdRef.current !== hitId) {
      hoveredIdRef.current = hitId;

      hoverStartRef.current = performance.now();

      onHoverChange(hitId);
      onProgressChange(0);

      return;
    }

    /*
     * We zitten nog steeds boven
     * dezelfde lijn.
     */
    if (hoverStartRef.current === null) {
      hoverStartRef.current = performance.now();

      return;
    }

    const elapsed = performance.now() - hoverStartRef.current;

    const progress = Math.min(elapsed / SELECTION_TIME, 1);

    onProgressChange(progress);

    /*
     * Na drie seconden daadwerkelijk
     * selecteren.
     */
    if (progress >= 1) {
      onSelectionChange(hitId);

      resetHover();
    }
  }, [
    mode,
    pointer,
    viewportWidth,
    viewportHeight,
    camera,
    selectableRoot,
    selectedId,
    onHoverChange,
    onSelectionChange,
    onProgressChange,
  ]);

  function resetHover() {
    hoveredIdRef.current = null;
    hoverStartRef.current = null;

    onHoverChange(null);
    onProgressChange(0);
  }

  return null;
}
