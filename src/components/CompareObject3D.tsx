// ---------------------------------------------------------------------------
// Primitive 3D silhouette of a real-world reference object at true relative
// scale next to the shoe. Uses Three.js primitives only (no external assets).
// ---------------------------------------------------------------------------
import { Html } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { COMPARE_OBJECTS, type CompareObjectId } from "../lib/shoeDimensions";
import { useIsMobile } from "../hooks/use-mobile";

export interface CompareObject3DProps {
  compareObject: CompareObjectId;
  /** Unscaled bounding box of the cloned GLTF shoe */
  box: THREE.Box3;
  /** Base fitTransform scale of the shoe at reference size */
  baseScale: number;
  /** Reference shoe length in mm (so object stays constant physical size) */
  referenceLengthMm: number;
}

export function CompareObject3D({
  compareObject,
  box,
  baseScale,
  referenceLengthMm,
}: CompareObject3DProps) {
  const isMobile = useIsMobile();

  const spec = useMemo(
    () => COMPARE_OBJECTS.find((c) => c.id === compareObject) ?? null,
    [compareObject],
  );

  const placement = useMemo(() => {
    if (!spec || box.isEmpty() || referenceLengthMm <= 0) return null;

    const sx = (box.max.x - box.min.x) * baseScale;
    const sz = (box.max.z - box.min.z) * baseScale;
    const lengthIsX = sx >= sz;
    const shoeWorldLen = Math.max(sx, sz);

    // World units per millimetre (constant across UK size changes)
    const mmToWorld = shoeWorldLen / referenceLengthMm;

    // Floor Y matches shoe sole at yOffset - 0.35 = -0.35 in world space
    const floorY = -0.35;

    // Offset sideways from the shoe's bounding box
    const sideOffset = (lengthIsX ? sz : sx) * 0.68 + 0.35;

    return {
      mmToWorld,
      lengthIsX,
      floorY,
      sideOffset,
    };
  }, [spec, box, baseScale, referenceLengthMm]);

  if (!spec || !placement) return null;

  const { mmToWorld, lengthIsX, floorY, sideOffset } = placement;

  // Real dimensions in mm -> world units
  let dimL = 85.6 * mmToWorld;
  let dimW = 53.98 * mmToWorld;
  let dimH = 2.0 * mmToWorld;
  let isSphere = false;

  if (spec.id === "smartphone") {
    dimL = 150 * mmToWorld;
    dimW = 72 * mmToWorld;
    dimH = 8 * mmToWorld;
  } else if (spec.id === "cricket-ball") {
    dimL = 71 * mmToWorld;
    dimW = 71 * mmToWorld;
    dimH = 71 * mmToWorld;
    isSphere = true;
  } else if (spec.id === "a4-sheet") {
    dimL = 297 * mmToWorld;
    dimW = 210 * mmToWorld;
    dimH = 1.5 * mmToWorld;
  }

  // Align object's longest dimension with the shoe's length axis
  const boxArgs: [number, number, number] = lengthIsX
    ? [dimL, dimH, dimW]
    : [dimW, dimH, dimL];

  // Position next to shoe on the front-side (+Z if lengthIsX, +X otherwise)
  const posX = lengthIsX ? 0 : sideOffset + dimW * 0.5;
  const posZ = lengthIsX ? sideOffset + dimW * 0.5 : 0;
  const posY = floorY + dimH * 0.5;
  const labelY = dimH * 0.5 + 0.14;

  return (
    <group position={[posX, posY, posZ]}>
      {isSphere ? (
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[dimL * 0.5, 24, 24]} />
          <meshStandardMaterial
            color="#ff6a00"
            roughness={0.45}
            metalness={0.15}
            transparent
            opacity={0.82}
          />
        </mesh>
      ) : (
        <mesh castShadow receiveShadow>
          <boxGeometry args={boxArgs} />
          <meshStandardMaterial
            color="#1f2028"
            roughness={0.35}
            metalness={0.2}
            emissive="#ff6a00"
            emissiveIntensity={0.22}
            transparent
            opacity={0.86}
          />
        </mesh>
      )}

      <Html position={[0, labelY, 0]} center zIndexRange={[35, 0]}>
        <div
          style={{
            color: "#f8fafc",
            fontSize: isMobile ? 10 : 11,
            fontWeight: 600,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            background: "rgba(12, 12, 16, 0.88)",
            padding: isMobile ? "2px 6px" : "3px 8px",
            borderRadius: 6,
            whiteSpace: "nowrap",
            pointerEvents: "none",
            userSelect: "none",
            border: "1px solid rgba(255, 106, 0, 0.5)",
            letterSpacing: "0.02em",
          }}
        >
          {spec.shortLabel}
        </div>
      </Html>
    </group>
  );
}
