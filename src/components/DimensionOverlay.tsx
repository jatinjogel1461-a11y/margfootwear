// ---------------------------------------------------------------------------
// 3D Scanner Reveal: 3-phase laser sweep -> lock-on flash -> CAD wireframe cage
// Driven 100% via refs + useFrame (zero per-frame React state updates).
// ---------------------------------------------------------------------------
import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  formatDimension,
  type DimensionKey,
  type DimensionUnit,
  type ShoeDimensions,
} from "../lib/shoeDimensions";
import { useIsMobile } from "../hooks/use-mobile";

export const AXIS_TINTS: Record<DimensionKey, string> = {
  length: "#ff6a00",
  width: "#ffb020",
  height: "#38bdf8",
};

export interface ScanProgressSnapshot {
  active: boolean;
  phase: DimensionKey | "done" | "idle";
  length: number;
  width: number;
  height: number;
}

export type ScanProgressListener = (snap: ScanProgressSnapshot) => void;

export interface DimensionOverlayProps {
  box: THREE.Box3;
  dims: ShoeDimensions;
  unit: DimensionUnit;
  visible: boolean;
  scanTrigger: number;
  highlightedDim?: DimensionKey | null;
  onScanProgress?: ScanProgressListener;
}

const DUR_LENGTH = 1.6;
const DUR_WIDTH = 1.2;
const DUR_HEIGHT = 1.2;
const TOTAL_SCAN_DUR = DUR_LENGTH + DUR_WIDTH + DUR_HEIGHT;
const LOCK_ON_DUR = 0.4; // ~400 ms lock-on flash after phase 3
const SIZE_TWEEN_DUR = 0.4;

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export function DimensionOverlay({
  box,
  dims,
  unit,
  visible,
  scanTrigger,
  highlightedDim = null,
  onScanProgress,
}: DimensionOverlayProps) {
  const rootRef = useRef<THREE.Group>(null!);
  const laserGroupRef = useRef<THREE.Group>(null!);
  const { camera } = useThree();
  const isMobile = useIsMobile();

  // Label DOM refs for zero-rerender text & screen-space offset updates
  const labelWrapRefs = useRef<Record<DimensionKey, HTMLDivElement | null>>({
    length: null,
    width: null,
    height: null,
  });
  const labelTextRefs = useRef<Record<DimensionKey, HTMLSpanElement | null>>({
    length: null,
    width: null,
    height: null,
  });

  // Keep latest props in refs for useFrame
  const dimsRef = useRef(dims);
  const unitRef = useRef(unit);
  const highlightedRef = useRef(highlightedDim);
  const onProgressRef = useRef(onScanProgress);
  dimsRef.current = dims;
  unitRef.current = unit;
  highlightedRef.current = highlightedDim;
  onProgressRef.current = onScanProgress;

  // Size tween refs (used when UK size changes while overlay is visible)
  const displayDimsRef = useRef<ShoeDimensions>({ ...dims });
  const tweenStartDimsRef = useRef<ShoeDimensions>({ ...dims });
  const tweenTargetDimsRef = useRef<ShoeDimensions>({ ...dims });
  const tweenProgressRef = useRef(1);

  // Scan state refs
  const scanTimeRef = useRef(0);
  const scanningRef = useRef(false);
  const lockOnTimeRef = useRef(LOCK_ON_DUR);
  const lastTriggerRef = useRef(-1);
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = mq.matches;
    const onChange = (e: MediaQueryListEvent) => {
      reducedMotionRef.current = e.matches;
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Trigger size tween when dims change (do NOT replay scan)
  useEffect(() => {
    if (
      tweenTargetDimsRef.current.length === dims.length &&
      tweenTargetDimsRef.current.width === dims.width &&
      tweenTargetDimsRef.current.height === dims.height
    ) {
      return;
    }
    if (reducedMotionRef.current || !visible) {
      displayDimsRef.current = { ...dims };
      tweenStartDimsRef.current = { ...dims };
      tweenTargetDimsRef.current = { ...dims };
      tweenProgressRef.current = 1;
    } else {
      tweenStartDimsRef.current = { ...displayDimsRef.current };
      tweenTargetDimsRef.current = { ...dims };
      tweenProgressRef.current = 0;
    }
  }, [dims, visible]);

  // Trigger scan when visible turns on or scanTrigger increments
  useEffect(() => {
    if (!visible) {
      scanningRef.current = false;
      lockOnTimeRef.current = LOCK_ON_DUR;
      onProgressRef.current?.({
        active: false,
        phase: "idle",
        length: 1,
        width: 1,
        height: 1,
      });
      return;
    }

    if (scanTrigger !== lastTriggerRef.current) {
      lastTriggerRef.current = scanTrigger;
      if (reducedMotionRef.current) {
        scanTimeRef.current = TOTAL_SCAN_DUR;
        scanningRef.current = false;
        lockOnTimeRef.current = LOCK_ON_DUR;
        onProgressRef.current?.({
          active: false,
          phase: "done",
          length: 1,
          width: 1,
          height: 1,
        });
      } else {
        scanTimeRef.current = 0;
        scanningRef.current = true;
        lockOnTimeRef.current = 0;
      }
    }
  }, [visible, scanTrigger]);

  // Compute bounding box geometry + ruler edges + ticks + laser plane
  const geo = useMemo(() => {
    if (box.isEmpty()) return null;

    const sx = Math.max(box.max.x - box.min.x, 0.001);
    const sy = Math.max(box.max.y - box.min.y, 0.001);
    const sz = Math.max(box.max.z - box.min.z, 0.001);
    const cx = (box.min.x + box.max.x) / 2;
    const cy = (box.min.y + box.max.y) / 2;
    const cz = (box.min.z + box.max.z) / 2;
    const lengthIsX = sx >= sz;
    const maxDim = Math.max(sx, sy, sz);
    const gap = maxDim * 0.16;

    // 1. Wireframe bounding cage
    const boxGeo = new THREE.BoxGeometry(sx, sy, sz);
    const cageGeo = new THREE.EdgesGeometry(boxGeo);
    boxGeo.dispose();
    const cageMat = new THREE.LineDashedMaterial({
      color: "#94a3b8",
      dashSize: maxDim * 0.04,
      gapSize: maxDim * 0.03,
      transparent: true,
      opacity: 0.28,
      depthTest: false,
    });

    // 2. Three axis ruler lines (updated in-place during scan)
    const createRuler = (color: string, start: THREE.Vector3, end: THREE.Vector3) => {
      const g = new THREE.BufferGeometry().setFromPoints([start.clone(), end.clone()]);
      const m = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.95,
        depthTest: false,
      });
      return { geom: g, mat: m, start, end };
    };

    const lenStart = lengthIsX
      ? new THREE.Vector3(box.min.x, box.min.y, box.max.z + gap)
      : new THREE.Vector3(box.max.x + gap, box.min.y, box.min.z);
    const lenEnd = lengthIsX
      ? new THREE.Vector3(box.max.x, box.min.y, box.max.z + gap)
      : new THREE.Vector3(box.max.x + gap, box.min.y, box.max.z);

    const widStart = lengthIsX
      ? new THREE.Vector3(box.min.x + sx * 0.78, box.min.y - gap * 0.55, box.min.z)
      : new THREE.Vector3(box.min.x, box.min.y - gap * 0.55, box.min.z + sz * 0.78);
    const widEnd = lengthIsX
      ? new THREE.Vector3(box.min.x + sx * 0.78, box.min.y - gap * 0.55, box.max.z)
      : new THREE.Vector3(box.max.x, box.min.y - gap * 0.55, box.min.z + sz * 0.78);

    const heiStart = lengthIsX
      ? new THREE.Vector3(box.min.x - gap * 0.8, box.min.y, cz)
      : new THREE.Vector3(cx, box.min.y, box.min.z - gap * 0.8);
    const heiEnd = lengthIsX
      ? new THREE.Vector3(box.min.x - gap * 0.8, box.max.y, cz)
      : new THREE.Vector3(cx, box.max.y, box.min.z - gap * 0.8);

    const rulers: Record<DimensionKey, ReturnType<typeof createRuler>> = {
      length: createRuler(AXIS_TINTS.length, lenStart, lenEnd),
      width: createRuler(AXIS_TINTS.width, widStart, widEnd),
      height: createRuler(AXIS_TINTS.height, heiStart, heiEnd),
    };

    // 3. Tick mark geometries (every 10 mm short tick, every 50 mm longer tick)
    const buildTicks = (
      start: THREE.Vector3,
      end: THREE.Vector3,
      tickDir: THREE.Vector3,
      realMm: number,
      color: string,
    ) => {
      const pts: THREE.Vector3[] = [];
      const count = Math.max(1, Math.floor(realMm / 10));
      for (let i = 0; i <= count; i++) {
        const t = Math.min(1, (i * 10) / Math.max(realMm, 1));
        const p = new THREE.Vector3().lerpVectors(start, end, t);
        const tickLen = i % 5 === 0 ? maxDim * 0.045 : maxDim * 0.022;
        pts.push(p, p.clone().addScaledVector(tickDir, tickLen));
      }
      const g = new THREE.BufferGeometry().setFromPoints(pts);
      const m = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.75,
        depthTest: false,
      });
      return { geom: g, mat: m };
    };

    const ticks: Record<DimensionKey, { geom: THREE.BufferGeometry; mat: THREE.LineBasicMaterial }> = {
      length: buildTicks(
        lenStart,
        lenEnd,
        lengthIsX ? new THREE.Vector3(0, 0, -1) : new THREE.Vector3(-1, 0, 0),
        dims.length,
        AXIS_TINTS.length,
      ),
      width: buildTicks(
        widStart,
        widEnd,
        new THREE.Vector3(0, 1, 0),
        dims.width,
        AXIS_TINTS.width,
      ),
      height: buildTicks(
        heiStart,
        heiEnd,
        lengthIsX ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 0, 1),
        dims.height,
        AXIS_TINTS.height,
      ),
    };

    // 4. Laser plane + bright edge line (unit 1x1, scaled & oriented per phase)
    const laserPlaneGeom = new THREE.PlaneGeometry(1, 1);
    const laserPlaneMat = new THREE.MeshBasicMaterial({
      color: AXIS_TINTS.length,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: false,
    });
    const laserEdgeBase = new THREE.EdgesGeometry(laserPlaneGeom);
    const laserEdgeMat = new THREE.LineBasicMaterial({
      color: "#ffffff",
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthTest: false,
    });

    // Label positions (offset along edges away from center)
    const labelVecs: Record<DimensionKey, THREE.Vector3> = {
      length: lenStart.clone().lerp(lenEnd, 0.34),
      width: widStart.clone().lerp(widEnd, 0.88),
      height: heiStart.clone().lerp(heiEnd, 0.55),
    };
    const labelPos: Record<DimensionKey, [number, number, number]> = {
      length: labelVecs.length.toArray() as [number, number, number],
      width: labelVecs.width.toArray() as [number, number, number],
      height: labelVecs.height.toArray() as [number, number, number],
    };

    return {
      sx,
      sy,
      sz,
      cx,
      cy,
      cz,
      lengthIsX,
      maxDim,
      cageGeo,
      cageMat,
      rulers,
      ticks,
      laserPlaneGeom,
      laserPlaneMat,
      laserEdgeBase,
      laserEdgeMat,
      labelVecs,
      labelPos,
    };
  }, [box, dims.length, dims.width, dims.height]);

  // Dispose geometries and materials on unmount or recompute
  useEffect(() => {
    if (!geo) return;
    return () => {
      geo.cageGeo.dispose();
      geo.cageMat.dispose();
      geo.laserPlaneGeom.dispose();
      geo.laserPlaneMat.dispose();
      geo.laserEdgeBase.dispose();
      geo.laserEdgeMat.dispose();
      (["length", "width", "height"] as DimensionKey[]).forEach((k) => {
        geo.rulers[k].geom.dispose();
        geo.rulers[k].mat.dispose();
        geo.ticks[k].geom.dispose();
        geo.ticks[k].mat.dispose();
      });
    };
  }, [geo]);

  // Precompute line distances for dashed cage
  const cageLineRef = useRef<THREE.LineSegments>(null!);
  useEffect(() => {
    if (cageLineRef.current) {
      cageLineRef.current.computeLineDistances();
    }
  }, [geo]);

  // Reusable temp objects for zero-allocation useFrame
  const tmpVec = useMemo(() => new THREE.Vector3(), []);
  const projVecs = useMemo(
    () => ({
      length: new THREE.Vector3(),
      width: new THREE.Vector3(),
      height: new THREE.Vector3(),
    }),
    [],
  );
  const baseCageColor = useMemo(() => new THREE.Color("#94a3b8"), []);
  const flashCageColor = useMemo(() => new THREE.Color("#ff6a00"), []);

  useFrame(({ clock }, dt) => {
    if (!geo || !rootRef.current) return;

    rootRef.current.visible = visible;
    if (!visible) return;

    // 1. Update size tween
    if (tweenProgressRef.current < 1) {
      tweenProgressRef.current = Math.min(1, tweenProgressRef.current + dt / SIZE_TWEEN_DUR);
      const t = 1 - Math.pow(1 - tweenProgressRef.current, 3);
      displayDimsRef.current.length = THREE.MathUtils.lerp(
        tweenStartDimsRef.current.length,
        tweenTargetDimsRef.current.length,
        t,
      );
      displayDimsRef.current.width = THREE.MathUtils.lerp(
        tweenStartDimsRef.current.width,
        tweenTargetDimsRef.current.width,
        t,
      );
      displayDimsRef.current.height = THREE.MathUtils.lerp(
        tweenStartDimsRef.current.height,
        tweenTargetDimsRef.current.height,
        t,
      );
    }

    // 2. Advance 3-phase scan timer + lock-on flash
    if (scanningRef.current) {
      scanTimeRef.current = Math.min(TOTAL_SCAN_DUR, scanTimeRef.current + dt);
      if (scanTimeRef.current >= TOTAL_SCAN_DUR) {
        scanningRef.current = false;
        lockOnTimeRef.current = 0;
      }
    } else if (lockOnTimeRef.current < LOCK_ON_DUR && !reducedMotionRef.current) {
      lockOnTimeRef.current = Math.min(LOCK_ON_DUR, lockOnTimeRef.current + dt);
    }

    const elapsed = scanTimeRef.current;
    const pLen = reducedMotionRef.current ? 1 : easeInOutCubic(clamp01(elapsed / DUR_LENGTH));
    const pWid = reducedMotionRef.current
      ? 1
      : easeInOutCubic(clamp01((elapsed - DUR_LENGTH) / DUR_WIDTH));
    const pHei = reducedMotionRef.current
      ? 1
      : easeInOutCubic(clamp01((elapsed - DUR_LENGTH - DUR_WIDTH) / DUR_HEIGHT));

    let phase: DimensionKey | "done" = "done";
    if (scanningRef.current) {
      if (elapsed < DUR_LENGTH) phase = "length";
      else if (elapsed < DUR_LENGTH + DUR_WIDTH) phase = "width";
      else phase = "height";
    }

    onProgressRef.current?.({
      active: scanningRef.current,
      phase,
      length: pLen,
      width: pWid,
      height: pHei,
    });

    // 3. Position and orient the laser plane for the active phase
    if (laserGroupRef.current) {
      if (!scanningRef.current || reducedMotionRef.current) {
        laserGroupRef.current.visible = false;
      } else {
        laserGroupRef.current.visible = true;
        const pad = geo.maxDim * 1.15;
        if (phase === "length") {
          geo.laserPlaneMat.color.set(AXIS_TINTS.length);
          geo.laserEdgeMat.color.set(AXIS_TINTS.length);
          if (geo.lengthIsX) {
            const x = THREE.MathUtils.lerp(box.min.x, box.max.x, pLen);
            laserGroupRef.current.position.set(x, geo.cy, geo.cz);
            laserGroupRef.current.rotation.set(0, Math.PI / 2, 0);
            laserGroupRef.current.scale.set(geo.sz * 1.15, geo.sy * 1.15, 1);
          } else {
            const z = THREE.MathUtils.lerp(box.min.z, box.max.z, pLen);
            laserGroupRef.current.position.set(geo.cx, geo.cy, z);
            laserGroupRef.current.rotation.set(0, 0, 0);
            laserGroupRef.current.scale.set(geo.sx * 1.15, geo.sy * 1.15, 1);
          }
        } else if (phase === "width") {
          geo.laserPlaneMat.color.set(AXIS_TINTS.width);
          geo.laserEdgeMat.color.set(AXIS_TINTS.width);
          if (geo.lengthIsX) {
            const z = THREE.MathUtils.lerp(box.min.z, box.max.z, pWid);
            laserGroupRef.current.position.set(geo.cx, geo.cy, z);
            laserGroupRef.current.rotation.set(0, 0, 0);
            laserGroupRef.current.scale.set(pad, geo.sy * 1.15, 1);
          } else {
            const x = THREE.MathUtils.lerp(box.min.x, box.max.x, pWid);
            laserGroupRef.current.position.set(x, geo.cy, geo.cz);
            laserGroupRef.current.rotation.set(0, Math.PI / 2, 0);
            laserGroupRef.current.scale.set(pad, geo.sy * 1.15, 1);
          }
        } else {
          geo.laserPlaneMat.color.set(AXIS_TINTS.height);
          geo.laserEdgeMat.color.set(AXIS_TINTS.height);
          const y = THREE.MathUtils.lerp(box.min.y, box.max.y, pHei);
          laserGroupRef.current.position.set(geo.cx, y, geo.cz);
          laserGroupRef.current.rotation.set(Math.PI / 2, 0, 0);
          laserGroupRef.current.scale.set(geo.sx * 1.15, geo.sz * 1.15, 1);
        }
      }
    }

    // 4. Cage opacity + lock-on flash pulse after phase 3
    const cageProgress = reducedMotionRef.current
      ? 1
      : clamp01((elapsed - TOTAL_SCAN_DUR * 0.6) / (TOTAL_SCAN_DUR * 0.4));
    let lockFlash = 0;
    if (!scanningRef.current && lockOnTimeRef.current < LOCK_ON_DUR && !reducedMotionRef.current) {
      lockFlash = Math.sin((lockOnTimeRef.current / LOCK_ON_DUR) * Math.PI);
    }
    geo.cageMat.opacity = 0.28 * cageProgress + 0.58 * lockFlash;
    geo.cageMat.color.copy(baseCageColor).lerp(flashCageColor, lockFlash);

    // 5. Screen-space label collision avoidance (nudge in px when two labels are too close)
    const keys: DimensionKey[] = ["length", "width", "height"];
    const nudges: Record<DimensionKey, { x: number; y: number }> = {
      length: { x: 0, y: 0 },
      width: { x: 0, y: 0 },
      height: { x: 0, y: 0 },
    };

    keys.forEach((k) => {
      projVecs[k].copy(geo.labelVecs[k]);
      rootRef.current.localToWorld(projVecs[k]);
      projVecs[k].project(camera);
    });

    const minDist = 0.22;
    for (let i = 0; i < keys.length; i++) {
      for (let j = i + 1; j < keys.length; j++) {
        const a = keys[i];
        const b = keys[j];
        const dx = projVecs[b].x - projVecs[a].x;
        const dy = projVecs[b].y - projVecs[a].y;
        const d = Math.hypot(dx, dy);
        if (d < minDist) {
          const nx = d > 0.001 ? dx / d : 0;
          const ny = d > 0.001 ? dy / d : 1;
          const push = ((minDist - d) / minDist) * 18;
          nudges[a].x -= nx * push;
          nudges[a].y += ny * push;
          nudges[b].x += nx * push;
          nudges[b].y -= ny * push;
        }
      }
    }

    // 6. Update ruler lines, ticks, pulse highlight, and label text/opacity/nudge
    const progressByAxis: Record<DimensionKey, number> = {
      length: pLen,
      width: pWid,
      height: pHei,
    };

    const hl = highlightedRef.current;
    const pulse = 0.6 + 0.4 * Math.sin(clock.elapsedTime * 7);

    keys.forEach((key) => {
      const p = progressByAxis[key];
      const ruler = geo.rulers[key];
      const posAttr = ruler.geom.getAttribute("position") as THREE.BufferAttribute;
      tmpVec.lerpVectors(ruler.start, ruler.end, p);
      posAttr.setXYZ(1, tmpVec.x, tmpVec.y, tmpVec.z);
      posAttr.needsUpdate = true;

      const isHl = hl === key;
      const isDimmed = hl !== null && hl !== key;
      const axisAlpha = (p > 0.01 ? 1 : 0) * (isDimmed ? 0.28 : isHl ? pulse : 0.95);

      ruler.mat.opacity = axisAlpha;
      geo.ticks[key].mat.opacity =
        (p > 0.95 ? 0.75 : p * 0.5) * (isDimmed ? 0.28 : isHl ? pulse : 1);

      const textEl = labelTextRefs.current[key];
      if (textEl) {
        const prefix = key === "length" ? "L" : key === "width" ? "W" : "H";
        const val = displayDimsRef.current[key] * p;
        textEl.textContent = `${prefix} ${formatDimension(val, unitRef.current)}`;
      }
      const wrapEl = labelWrapRefs.current[key];
      if (wrapEl) {
        wrapEl.style.opacity = p > 0.02 ? String(isDimmed ? 0.35 : 1) : "0";
        wrapEl.style.boxShadow = isHl ? `0 0 14px ${AXIS_TINTS[key]}` : "none";
        wrapEl.style.transform = `translate(${nudges[key].x.toFixed(1)}px, ${nudges[key].y.toFixed(1)}px)`;
      }
    });
  });

  if (!geo) return null;

  const fontSize = isMobile ? 9.5 : 11;

  return (
    <group ref={rootRef} visible={visible}>
      {/* Wireframe bounding cage */}
      <lineSegments
        ref={cageLineRef}
        position={[geo.cx, geo.cy, geo.cz]}
        geometry={geo.cageGeo}
        material={geo.cageMat}
      />

      {/* Sweeping laser plane + bright edge */}
      <group ref={laserGroupRef} visible={false}>
        <mesh geometry={geo.laserPlaneGeom} material={geo.laserPlaneMat} renderOrder={998} />
        <lineSegments geometry={geo.laserEdgeBase} material={geo.laserEdgeMat} renderOrder={999} />
      </group>

      {/* Extending ruler lines, tick marks, and mono labels */}
      {(["length", "width", "height"] as DimensionKey[]).map((key) => {
        const tint = AXIS_TINTS[key];
        const prefix = key === "length" ? "L" : key === "width" ? "W" : "H";
        return (
          <group key={key}>
            <lineSegments geometry={geo.rulers[key].geom} material={geo.rulers[key].mat} renderOrder={999} />
            <lineSegments geometry={geo.ticks[key].geom} material={geo.ticks[key].mat} renderOrder={999} />
            <Html position={geo.labelPos[key]} center zIndexRange={[40, 0]}>
              <div
                ref={(el) => {
                  labelWrapRefs.current[key] = el;
                }}
                style={{
                  color: tint,
                  fontSize,
                  fontWeight: 700,
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                  background: "rgba(12, 12, 16, 0.88)",
                  padding: isMobile ? "2px 5px" : "3px 8px",
                  borderRadius: 6,
                  whiteSpace: "nowrap",
                  pointerEvents: "none",
                  userSelect: "none",
                  border: `1px solid ${tint}66`,
                  fontVariantNumeric: "tabular-nums",
                  letterSpacing: "0.04em",
                  transition: "opacity 0.12s linear",
                }}
              >
                <span
                  ref={(el) => {
                    labelTextRefs.current[key] = el;
                  }}
                >
                  {prefix} {formatDimension(dims[key], unit)}
                </span>
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}
