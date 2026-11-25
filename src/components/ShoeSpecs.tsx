import { useState, useEffect } from "react";
import {
  formatDimension,
  type DimensionKey,
  type DimensionUnit,
  type ShoeDimensions,
} from "@/lib/shoeDimensions";

interface ShoeSpecsProps {
  dimensions: ShoeDimensions;
  unit: DimensionUnit;
  onUnitChange: (unit: DimensionUnit) => void;
  highlightedDim: DimensionKey | null;
  onHighlightDim: (dim: DimensionKey | null) => void;
  onSelectDim?: (dim: DimensionKey) => void;
}

const SPEC_ITEMS: { key: DimensionKey; label: string; short: string }[] = [
  { key: "length", label: "Length", short: "Toe to heel" },
  { key: "width", label: "Width", short: "Ball of foot" },
  { key: "height", label: "Height", short: "Sole to collar" },
];

const UNITS: DimensionUnit[] = ["mm", "cm", "in"];

export function ShoeSpecs({
  dimensions,
  unit,
  onUnitChange,
  highlightedDim,
  onHighlightDim,
  onSelectDim,
}: ShoeSpecsProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <div className="mt-5" aria-label="Shoe dimensions">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <h4 className="text-xs tracking-[0.25em] text-muted-foreground">DIMENSIONS</h4>
          <span className="text-[11px] text-muted-foreground/70">approx.</span>
        </div>

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

      <div className="grid grid-cols-3 gap-2">
        {SPEC_ITEMS.map(({ key, label, short }) => {
          const isHighlighted = highlightedDim === key;
          const value = formatDimension(dimensions[key], unit);
          return (
            <button
              key={key}
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
              className={`group text-left rounded-xl border px-3 py-2.5 min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-neon ${
                prefersReducedMotion ? "" : "transition-all duration-150"
              } ${
                isHighlighted
                  ? "border-neon bg-neon/10 shadow-[0_0_16px_rgba(255,106,0,0.18)]"
                  : "border-border bg-surface hover:border-neon/60"
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground group-hover:text-foreground">
                  {label}
                </span>
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isHighlighted ? "bg-neon" : "bg-border group-hover:bg-neon/60"
                  }`}
                />
              </div>
              <div className="mt-1 font-mono text-sm sm:text-base font-semibold text-foreground tabular-nums">
                {value}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
