import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import {
  formatDimension,
  type DimensionKey,
  type DimensionUnit,
  type ShoeDimensions,
} from "@/lib/shoeDimensions";
import { AXIS_TINTS, type ScanProgressSnapshot } from "./DimensionOverlay";

interface ShoeSpecsProps {
  dimensions: ShoeDimensions;
  unit: DimensionUnit;
  onUnitChange: (unit: DimensionUnit) => void;
  highlightedDim: DimensionKey | null;
  onHighlightDim: (dim: DimensionKey | null) => void;
  onSelectDim?: (dim: DimensionKey) => void;
  onRescan: () => void;
  subscribeScan?: (fn: (snap: ScanProgressSnapshot) => void) => () => void;
}

const SPEC_ITEMS: { key: DimensionKey; label: string; short: string }[] = [
  { key: "length", label: "Length", short: "Toe to heel" },
  { key: "width", label: "Width", short: "Ball of foot" },
  { key: "height", label: "Height", short: "Sole to collar" },
];

const UNITS: DimensionUnit[] = ["mm", "cm", "in"];

function AxisIcon({ axis, color }: { axis: DimensionKey; color: string }) {
  if (axis === "length") {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M2 8H14M2 8L4.5 5.5M2 8L4.5 10.5M14 8L11.5 5.5M14 8L11.5 10.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (axis === "width") {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M3 11L13 5M3 11L4.2 8.2M3 11L5.8 11.4M13 5L11.8 7.8M13 5L10.2 4.6" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 2V14M8 2L5.5 4.5M8 2L10.5 4.5M8 14L5.5 11.5M8 14L10.5 11.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ShoeSpecs({
  dimensions,
  unit,
  onUnitChange,
  highlightedDim,
  onHighlightDim,
  onSelectDim,
  onRescan,
  subscribeScan,
}: ShoeSpecsProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const tileRefs = useRef<Record<DimensionKey, HTMLButtonElement | null>>({
    length: null,
    width: null,
    height: null,
  });
  const valRefs = useRef<Record<DimensionKey, HTMLDivElement | null>>({
    length: null,
    width: null,
    height: null,
  });
  const barRefs = useRef<Record<DimensionKey, HTMLDivElement | null>>({
    length: null,
    width: null,
    height: null,
  });

  const dimsRef = useRef(dimensions);
  const unitRef = useRef(unit);
  const displayDimsRef = useRef<ShoeDimensions>({ ...dimensions });
  const isScanningRef = useRef(false);
  dimsRef.current = dimensions;
  unitRef.current = unit;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Tween readout numbers over 400 ms when UK size or unit changes (without replaying scan)
  useEffect(() => {
    if (prefersReducedMotion || isScanningRef.current) {
      displayDimsRef.current = { ...dimensions };
      (["length", "width", "height"] as DimensionKey[]).forEach((k) => {
        const el = valRefs.current[k];
        if (el) el.textContent = formatDimension(dimensions[k], unit);
      });
      return;
    }

    const start = { ...displayDimsRef.current };
    const target = { ...dimensions };
    const t0 = performance.now();
    const dur = 400;
    let raf = 0;

    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      const ease = 1 - Math.pow(1 - p, 3);
      (["length", "width", "height"] as DimensionKey[]).forEach((k) => {
        const val = start[k] + (target[k] - start[k]) * ease;
        displayDimsRef.current[k] = val;
        const el = valRefs.current[k];
        if (el) el.textContent = formatDimension(val, unitRef.current);
      });
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        displayDimsRef.current = { ...target };
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [dimensions, unit, prefersReducedMotion]);

  // Subscribe to 3D scanner progress without React re-renders
  useEffect(() => {
    if (!subscribeScan) return;
    return subscribeScan((snap) => {
      isScanningRef.current = snap.active;

      (["length", "width", "height"] as DimensionKey[]).forEach((k) => {
        const p = snap.phase === "idle" ? 1 : snap[k];
        const bar = barRefs.current[k];
        if (bar) {
          bar.style.transform = `scaleX(${p})`;
        }

        const valEl = valRefs.current[k];
        if (valEl) {
          const v = snap.phase === "idle" ? dimsRef.current[k] : dimsRef.current[k] * p;
          valEl.textContent = formatDimension(v, unitRef.current);
        }

        const tile = tileRefs.current[k];
        if (tile) {
          const tint = AXIS_TINTS[k];
          const isActivePhase = snap.active && snap.phase === k;
          const isLitAfter = snap.phase === "done";
          if (isActivePhase) {
            tile.style.borderColor = tint;
            tile.style.boxShadow = `0 0 18px ${tint}55`;
          } else if (isLitAfter) {
            tile.style.borderColor = `${tint}66`;
            tile.style.boxShadow = `0 0 10px ${tint}22`;
          } else {
            tile.style.borderColor = "";
            tile.style.boxShadow = "";
          }
        }
      });
    });
  }, [subscribeScan]);

  return (
    <div className="mt-5" aria-label="Shoe dimensions">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <h4 className="text-xs tracking-[0.25em] text-muted-foreground">DIMENSIONS</h4>
          <span className="text-[11px] text-muted-foreground/70">approx.</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onRescan}
            aria-label="Re-scan shoe dimensions in 3D"
            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] text-muted-foreground hover:text-neon rounded-full hover:bg-neon/10 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-neon"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Re-scan</span>
          </button>

          <div
            className="inline-flex items-center rounded-full border border-border bg-surface p-0.5"
            role="group"
            aria-label="Dimension unit"
          >
            {UNITS.map((u) => {
              const active = unit === u;
              return (
                <button
                  key={u}
                  type="button"
                  onClick={() => onUnitChange(u)}
                  aria-pressed={active}
                  aria-label={`Show dimensions in ${u}`}
                  className={`px-2.5 py-0.5 text-[11px] font-mono rounded-full ${
                    prefersReducedMotion ? "" : "transition-colors"
                  } ${
                    active
                      ? "bg-neon text-neon-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {u}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {SPEC_ITEMS.map(({ key, label, short }) => {
          const isHighlighted = highlightedDim === key;
          const tint = AXIS_TINTS[key];
          const value = formatDimension(dimensions[key], unit);
          return (
            <button
              key={key}
              ref={(el) => {
                tileRefs.current[key] = el;
              }}
              type="button"
              onMouseEnter={() => onHighlightDim(key)}
              onMouseLeave={() => onHighlightDim(null)}
              onFocus={() => onHighlightDim(key)}
              onBlur={() => onHighlightDim(null)}
              onClick={() => {
                onHighlightDim(key);
                onSelectDim?.(key);
              }}
              aria-label={`${label}: ${value} (${short}). Click to inspect in 3D`}
              aria-pressed={isHighlighted}
              style={
                isHighlighted
                  ? { borderColor: tint, boxShadow: `0 0 18px ${tint}44` }
                  : undefined
              }
              className={`group text-left rounded-xl border px-3 py-2.5 min-h-[44px] bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-neon ${
                prefersReducedMotion ? "" : "transition-colors duration-150"
              } ${
                isHighlighted ? "bg-secondary/60" : "border-border hover:border-foreground/30"
              }`}
            >
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground group-hover:text-foreground">
                  {label}
                </span>
                <AxisIcon axis={key} color={tint} />
              </div>

              <div
                ref={(el) => {
                  valRefs.current[key] = el;
                }}
                className="mt-1 font-mono text-sm sm:text-base font-semibold text-foreground tabular-nums"
              >
                {value}
              </div>

              <div className="mt-2 h-0.5 w-full rounded-full bg-border/60 overflow-hidden">
                <div
                  ref={(el) => {
                    barRefs.current[key] = el;
                  }}
                  className="h-full w-full origin-left rounded-full"
                  style={{
                    backgroundColor: tint,
                    transform: "scaleX(1)",
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
