import { useMemo } from "react";

import * as THREE from "three";

import type { ShapeObject } from "../../features/modeling/sketchTypes";

import SketchLine from "./SketchLine";

type ShapeRendererProps = {
  shape: ShapeObject;

  selected?: boolean;
  hovered?: boolean;
};

export default function ShapeRenderer({
  shape,

  selected = false,
  hovered = false,
}: ShapeRendererProps) {
  /*
   * Free draw en normale lijnen blijven
   * voorlopig lijnen.
   */
  if (shape.type === "free" || shape.type === "line") {
    return (
      <SketchLine
        stroke={shape}
        strokeId={shape.id}
        selected={selected}
        hovered={hovered}
      />
    );
  }

  /*
   * Rectangle zonder depth:
   * gewone outline.
   */
  if (shape.type === "rectangle" && shape.depth <= 0) {
    return (
      <SketchLine
        stroke={shape}
        strokeId={shape.id}
        selected={selected}
        hovered={hovered}
      />
    );
  }

  /*
   * Rectangle MET depth:
   * echte BoxGeometry.
   */
  if (shape.type === "rectangle") {
    return <Rectangle3D shape={shape} selected={selected} hovered={hovered} />;
  }

  /*
   * Circle zonder depth.
   */
  if (shape.type === "circle" && shape.depth <= 0) {
    return (
      <SketchLine
        stroke={shape}
        strokeId={shape.id}
        selected={selected}
        hovered={hovered}
      />
    );
  }

  /*
   * Circle met depth:
   * echte cylinder.
   */
  if (shape.type === "circle") {
    return <Circle3D shape={shape} selected={selected} hovered={hovered} />;
  }

  return null;
}

type Rectangle3DProps = {
  shape: Extract<ShapeObject, { type: "rectangle" }>;

  selected: boolean;
  hovered: boolean;
};

function Rectangle3D({ shape, selected, hovered }: Rectangle3DProps) {
  const color = getColor(selected, hovered);

  /*
   * x/y bij een rectangle zijn gebaseerd
   * op de linkeronderhoek.
   *
   * BoxGeometry gebruikt zijn middelpunt.
   */
  const centerX = shape.x + shape.width / 2;

  const centerY = shape.y + shape.height / 2;

  const centerZ = 0;

  return (
    <mesh
      position={[centerX, centerY, centerZ]}
      userData={{
        selectable: true,

        strokeId: shape.id,
      }}
    >
      <boxGeometry
        args={[
          Math.abs(shape.width),

          Math.abs(shape.height),

          Math.max(shape.depth, 0.001),
        ]}
      />

      <meshStandardMaterial
        color={color}
        transparent
        opacity={0.65}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

type Circle3DProps = {
  shape: Extract<ShapeObject, { type: "circle" }>;

  selected: boolean;
  hovered: boolean;
};

function Circle3D({ shape, selected, hovered }: Circle3DProps) {
  const color = getColor(selected, hovered);

  const rotation = useMemo(() => new THREE.Euler(Math.PI / 2, 0, 0), []);

  return (
    <mesh
      position={[shape.center.x, shape.center.y, 0]}
      rotation={rotation}
      userData={{
        selectable: true,

        strokeId: shape.id,
      }}
    >
      <cylinderGeometry
        args={[shape.radius, shape.radius, Math.max(shape.depth, 0.001), 64]}
      />

      <meshStandardMaterial
        color={color}
        transparent
        opacity={0.65}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function getColor(selected: boolean, hovered: boolean) {
  if (selected) {
    return "#3b82f6";
  }

  if (hovered) {
    return "#ca0bf5";
  }

  return "#22c55e";
}
