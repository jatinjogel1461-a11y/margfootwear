// ---------------------------------------------------------------------------
// 3-axis CAD-style dimension lines + mono labels rendered inside the R3F scene
// ---------------------------------------------------------------------------
import { Line, Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useMemo, useState, useEffect } from "react";
import * as THREE from "three";
import {
  formatDimension,
  type DimensionKey,
  type DimensionUnit,
  type ShoeDimensions,
} from "../lib/shoeDimensions";
import { useIsMobile } from "../hooks/use-mobile";

export interface DimensionOverlayProps {
  box: THREE.Box3;
  dims: ShoeDimensions;
  unit: DimensionUnit;
  visible: boolean;
  highlightedDim?: DimensionKey | null;
}

type V3 = [number, number, number];

const ACCENT_COLOR = "#ff6a00";
const HIGHLIGHT_COLOR = "#ff8c38";
const DRAW_DURATION_SEC = 0.6; // ~600 ms

function lerpV3(a: V3, b: V3, t: number): V3 {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

function midV3(a: V3, b: V3): V3 {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
}

function normalizeV3(v: V3): V3 {
  const len = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / len, v[1] / len, v[2] / len];
}

interface CadDimension {
  main: [V3, V3];
  ext1: [V3, V3];
  ext2: [V3, V3];
  arrow1a: [V3, V3];
  arrow1b: [V3, V3];
  arrow2a: [V3, V3];
  arrow2b: [V3, V3];
  label: V3;
}

/**
 * Builds a CAD dimension line with extension lines from the model's anchor
 * points and arrowheads at both ends.
 */
function buildCadDim(
  anchor1: V3,
  anchor2: V3,
  offsetDir: V3,
  offsetDist: number,
  arrowLen: number,
  arrowSpread: number,
): CadDimension {
  const o: V3 = [
    offsetDir[0] * offsetDist,
    offsetDir[1] * offsetDist,
    offsetDir[2] * offsetDist,
  ];
  const overshoot = 1.18;
  const start: V3 = [anchor1[0] + o[0], anchor1[1] + o[1], anchor1[2] + o[2]];
  const end: V3 = [anchor2[0] + o[0], anchor2[1] + o[1], anchor2[2] + o[2]];

  const ext1: [V3, V3] = [
    anchor1,
    [
      anchor1[0] + o[0] * overshoot,
      anchor1[1] + o[1] * overshoot,
      anchor1[2] + o[2] * overshoot,
    ],
  ];
  const ext2: [V3, V3] = [
    anchor2,
    [
      anchor2[0] + o[0] * overshoot,
      anchor2[1] + o[1] * overshoot,
      anchor2[2] + o[2] * overshoot,
    ],
  ];

  // Unit vector along main line (from start -> end)
  const dir = normalizeV3([end[0] - start[0], end[1] - start[1], end[2] - start[2]]);
  const wing = normalizeV3(offsetDir);

  const arrow1a: [V3, V3] = [
    start,
    [
      start[0] + dir[0] * arrowLen + wing[0] * arrowSpread,
      start[1] + dir[1] * arrowLen + wing[1] * arrowSpread,
      start[2] + dir[2] * arrowLen + wing[2] * arrowSpread,
    ],
  ];
  const arrow1b: [V3, V3] = [
    start,
    [
      start[0] + dir[0] * arrowLen - wing[0] * arrowSpread,
      start[1] + dir[1] * arrowLen - wing[1] * arrowSpread,
      start[2] + dir[2] * arrowLen - wing[2] * arrowSpread,
    ],
  ];

  const arrow2a: [V3, V3] = [
    end,
    [
      end[0] - dir[0] * arrowLen + wing[0] * arrowSpread,
      end[1] - dir[1] * arrowLen + wing[1] * arrowSpread,
      end[2] - dir[2] * arrowLen + wing[2] * arrowSpread,
    ],
  ];
  const arrow2b: [V3, V3] = [
    end,
    [
      end[0] - dir[0] * arrowLen - wing[0] * arrowSpread,
      end[1] - dir[1] * arrowLen - wing[1] * arrowSpread,
      end[2] - dir[2] * arrowLen - wing[2] * arrowSpread,
    ],
  ];

  return {
    main: [start, end],
    ext1,
    ext2,
    arrow1a,
    arrow1b,
    arrow2a,
    arrow2b,
    label: midV3(start, end),
  };
}

export function DimensionOverlay({
  box,
  dims,
  unit,
  visible,
  highlightedDim = null,
}: DimensionOverlayProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const progressRef = useRef(0);
  const lastStepRef = useRef(0);
  const [animProgress, setAnimProgress] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      const target = visible ? 1 : 0;
      progressRef.current = target;
      lastStepRef.current = target;
      setAnimProgress(target);
    }
  }, [visible, prefersReducedMotion]);

  useFrame((_, dt) => {
    const target = visible ? 1 : 0;

    if (prefersReducedMotion) {
      progressRef.current = target;
    } else if (progressRef.current !== target) {
      const step = dt / DRAW_DURATION_SEC;
      if (target > progressRef.current) {
        progressRef.current = Math.min(1, progressRef.current + step);
      } else {
        progressRef.current = Math.max(0, progressRef.current - step * 1.5);
      }
      // Step React state ~30fps during the 600ms draw-in for smooth count-up & line draw
      const stepped = Math.round(progressRef.current * 30) / 30;
      if (stepped !== lastStepRef.current) {
        lastStepRef.current = stepped;
        setAnimProgress(stepped);
      }
    }

    if (groupRef.current) {
      groupRef.current.visible = progressRef.current > 0.01;
    }
  });

  const cad = useMemo(() => {
    if (box.isEmpty()) return null;

    const sx = box.max.x - box.min.x;
    const sy = box.max.y - box.min.y;
    const sz = box.max.z - box.min.z;
    const maxDim = Math.max(sx, sy, sz);
    const gap = maxDim * 0.22;
    const arrowLen = maxDim * 0.055;
    const arrowSpread = maxDim * 0.025;
    const yBot = box.min.y;
    const lengthIsX = sx >= sz;

    if (lengthIsX) {
      // 1. Length along the sole (X axis, offset toward +Z front side of side view)
      const length = buildCadDim(
        [box.min.x, yBot, box.max.z],
        [box.max.x, yBot, box.max.z],
        [0, 0, 1],
        gap,
        arrowLen,
        arrowSpread,
      );

      // 2. Width at the ball of the foot (Z axis, slightly forward of center, below sole)
      const ballX = box.min.x + sx * 0.58;
      const width = buildCadDim(
        [ballX, yBot, box.min.z],
        [ballX, yBot, box.max.z],
        [0, -1, 0],
        gap * 0.55,
        arrowLen,
        arrowSpread,
      );

      // 3. Height at the heel/ankle (Y axis, at heel end, offset outward along -X)
      const heelZ = box.min.z + sz * 0.5;
      const height = buildCadDim(
        [box.min.x, box.min.y, heelZ],
        [box.min.x, box.max.y, heelZ],
        [-1, 0, 0],
        gap * 0.85,
        arrowLen,
        arrowSpread,
      );

      return { length, width, height };
    } else {
      // 1. Length along the sole (Z axis, offset toward +X)
      const length = buildCadDim(
        [box.max.x, yBot, box.min.z],
        [box.max.x, yBot, box.max.z],
        [1, 0, 0],
        gap,
        arrowLen,
        arrowSpread,
      );

      // 2. Width at the ball of the foot (X axis, below sole)
      const ballZ = box.min.z + sz * 0.58;
      const width = buildCadDim(
        [box.min.x, yBot, ballZ],
        [box.max.x, yBot, ballZ],
        [0, -1, 0],
        gap * 0.55,
        arrowLen,
        arrowSpread,
      );

      // 3. Height at the heel/ankle (Y axis, offset outward along -Z)
      const heelX = box.min.x + sx * 0.5;
      const height = buildCadDim(
        [heelX, box.min.y, box.min.z],
        [heelX, box.max.y, box.min.z],
        [0, 0, -1],
        gap * 0.85,
        arrowLen,
        arrowSpread,
      );

      return { length, width, height };
    }
  }, [box]);

  if (!cad) return null;

  const eased = prefersReducedMotion
    ? visible
      ? 1
      : 0
    : 1 - Math.pow(1 - animProgress, 3);

  const fontSize = isMobile ? 10 : 11;

  const renderDim = (key: DimensionKey, prefix: string, dim: CadDimension, targetMm: number) => {
    const isHighlighted = highlightedDim === key;
    const isDimmed = highlightedDim !== null && highlightedDim !== key;
    const axisOpacity = (isDimmed ? 0.3 : 1) * eased;
    const color = isHighlighted ? HIGHLIGHT_COLOR : ACCENT_COLOR;
    const lw = (isMobile ? 1.35 : 1.7) * (isHighlighted ? 1.45 : 1);

    // Draw main line outward from midpoint
    const center = midV3(dim.main[0], dim.main[1]);
    const animatedMain: [V3, V3] = [
      lerpV3(center, dim.main[0], eased),
      lerpV3(center, dim.main[1], eased),
    ];

    const animatedValue = formatDimension(targetMm * eased, unit);

    return (
      <group key={key}>
        <Line points={animatedMain} color={color} lineWidth={lw} transparent opacity={axisOpacity} depthTest={false} />
        {eased > 0.2 && (
          <>
            <Line points={dim.ext1} color={color} lineWidth={lw * 0.75} transparent opacity={axisOpacity * 0.75} depthTest={false} />
            <Line points={dim.ext2} color={color} lineWidth={lw * 0.75} transparent opacity={axisOpacity * 0.75} depthTest={false} />
          </>
        )}
        {eased > 0.65 && (
          <>
            <Line points={dim.arrow1a} color={color} lineWidth={lw} transparent opacity={axisOpacity} depthTest={false} />
            <Line points={dim.arrow1b} color={color} lineWidth={lw} transparent opacity={axisOpacity} depthTest={false} />
            <Line points={dim.arrow2a} color={color} lineWidth={lw} transparent opacity={axisOpacity} depthTest={false} />
            <Line points={dim.arrow2b} color={color} lineWidth={lw} transparent opacity={axisOpacity} depthTest={false} />
          </>
        )}
        <Html position={dim.label} center zIndexRange={[40, 0]}>
          <div
            style={{
              color: isHighlighted ? "#ffffff" : ACCENT_COLOR,
              fontSize,
              fontWeight: 700,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              background: isHighlighted ? "rgba(255, 106, 0, 0.92)" : "rgba(12, 12, 16, 0.86)",
              padding: isMobile ? "2px 6px" : "3px 8px",
              borderRadius: 6,
              whiteSpace: "nowrap",
              pointerEvents: "none",
              userSelect: "none",
              opacity: axisOpacity,
              letterSpacing: "0.04em",
              border: `1px solid ${isHighlighted ? "#ff6a00" : "rgba(255, 106, 0, 0.4)"}`,
              boxShadow: isHighlighted ? "0 0 12px rgba(255, 106, 0, 0.45)" : "none",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {prefix} {animatedValue}
          </div>
        </Html>
      </group>
    );
  };

  return (
    <group ref={groupRef}>
      {renderDim("length", "L", cad.length, dims.length)}
      {renderDim("width", "W", cad.width, dims.width)}
      {renderDim("height", "H", cad.height, dims.height)}
    </group>
  );
}
