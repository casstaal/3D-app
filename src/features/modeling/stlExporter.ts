import * as THREE from "three";
import { STLExporter } from "three/addons/exporters/STLExporter.js";

import type { Sketch, SketchStroke } from "./sketchTypes";

/**
 * Exporteert alle geëxtrudeerde shapes naar één STL-bestand.
 *
 * Niet-geëxtrudeerde shapes worden overgeslagen.
 */
export function exportSketchesToSTL(
  sketches: Sketch[],
  fileName = "model.stl",
): boolean {
  const exportGroup = new THREE.Group();

  try {
    // 1. Bouw de exporteerbare geometrie op.
    for (const sketch of sketches) {
      const sketchGroup = new THREE.Group();

      sketchGroup.position.set(
        sketch.position.x,
        sketch.position.y,
        sketch.position.z,
      );

      sketchGroup.quaternion.set(
        sketch.quaternion.x,
        sketch.quaternion.y,
        sketch.quaternion.z,
        sketch.quaternion.w,
      );

      for (const stroke of sketch.strokes) {
        const mesh = createExportMesh(stroke);

        if (mesh) {
          sketchGroup.add(mesh);
        }
      }

      if (sketchGroup.children.length > 0) {
        exportGroup.add(sketchGroup);
      }
    }

    // 2. Controleer of er 3D-objecten bestaan.
    if (exportGroup.children.length === 0) {
      console.warn("Er zijn geen 3D-objecten om te exporteren.");

      return false;
    }

    // 3. Werk alle transformaties bij.
    exportGroup.updateMatrixWorld(true);

    // 4. Genereer de binaire STL.
    const exporter = new STLExporter();

    const result = exporter.parse(exportGroup, {
      binary: true,
    });

    // 5. Download het bestand.
    downloadSTL(result, fileName);

    console.log("STL succesvol geëxporteerd.");

    return true;
  } catch (error) {
    console.error("Er is iets misgegaan tijdens de STL-export:", error);

    return false;
  } finally {
    // Ook bij fouten tijdelijke geometrie opruimen.
    disposeObject(exportGroup);
  }
}

/**
 * Zet een shape om naar een Three.js mesh.
 *
 * Alleen shapes met daadwerkelijk volume
 * kunnen worden geëxporteerd.
 */
function createExportMesh(stroke: SketchStroke): THREE.Mesh | null {
  switch (stroke.type) {
    case "rectangle": {
      if (stroke.depth <= 0 || stroke.width === 0 || stroke.height === 0) {
        return null;
      }

      const geometry = new THREE.BoxGeometry(
        Math.abs(stroke.width),
        Math.abs(stroke.height),
        stroke.depth,
      );

      const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());

      // BoxGeometry gebruikt het middelpunt.
      mesh.position.set(
        stroke.x + stroke.width / 2,
        stroke.y + stroke.height / 2,
        0,
      );

      return mesh;
    }

    case "circle": {
      if (stroke.depth <= 0 || stroke.radius <= 0) {
        return null;
      }

      const geometry = new THREE.CylinderGeometry(
        stroke.radius,
        stroke.radius,
        stroke.depth,
        64,
      );

      const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());

      mesh.position.set(stroke.center.x, stroke.center.y, stroke.center.z);

      // CylinderGeometry gebruikt standaard de Y-as.
      // Lokale diepte loopt langs de Z-as.
      mesh.rotation.x = Math.PI / 2;

      return mesh;
    }

    default:
      // Free draw en lines hebben nog geen volume.
      return null;
  }
}

/**
 * Downloadt de STL-data.
 *
 * Ondersteunt:
 * - ArrayBuffer
 * - DataView
 * - Andere TypedArrays
 * - ASCII STL (string)
 */
function downloadSTL(
  data: ArrayBuffer | ArrayBufferView | string,
  fileName: string,
): void {
  let blob: Blob;

  if (typeof data === "string") {
    blob = new Blob([data], {
      type: "model/stl",
    });
  } else if (ArrayBuffer.isView(data)) {
    /*
     * Maak een kopie van uitsluitend de bytes
     * die bij deze DataView/TypedArray horen.
     *
     * Dit voorkomt problemen met byteOffset
     * en SharedArrayBuffer.
     */
    const bytes = new Uint8Array(data.byteLength);

    bytes.set(new Uint8Array(data.buffer, data.byteOffset, data.byteLength));

    blob = new Blob([bytes], {
      type: "application/octet-stream",
    });
  } else {
    blob = new Blob([data], {
      type: "application/octet-stream",
    });
  }

  if (blob.size === 0) {
    throw new Error("Het gegenereerde STL-bestand is leeg.");
  }

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;

  link.download = fileName.toLowerCase().endsWith(".stl")
    ? fileName
    : `${fileName}.stl`;

  document.body.appendChild(link);

  try {
    link.click();
  } finally {
    link.remove();

    // Geef de browser tijd om de download te starten.
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  }
}

/**
 * Ruimt de tijdelijke Three.js-geometrie
 * en materialen op.
 */
function disposeObject(object: THREE.Object3D): void {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) {
      return;
    }

    child.geometry.dispose();

    if (Array.isArray(child.material)) {
      for (const material of child.material) {
        material.dispose();
      }
    } else {
      child.material.dispose();
    }
  });
}
