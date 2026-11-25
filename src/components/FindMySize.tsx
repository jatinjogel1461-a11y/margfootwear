import { useState, useEffect, useId } from "react";
import type { Product } from "@/lib/products";
import { recommendSize, type FitTag } from "@/lib/shoeDimensions";
import {
  BRANDS,
  clearFitEstimate,
  estimateFoot,
  loadFitEstimate,
  saveFitEstimate,
  type BrandName,
} from "@/lib/fitEngine";

interface FindMySizeProps {
  product: Product;
  selectedSize: number;
  onSelectSize: (size: number) => void;
}

const TAG_STYLE: Record<FitTag, string> = {
  Snug: "border-amber-500/40 bg-amber-500/10 text-amber-400",
  Perfect: "border-neon/60 bg-neon/15 text-neon",
  Loose: "border-border bg-secondary/60 text-muted-foreground",
};

const REFERENCE_UK_SIZES = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

export function FindMySize({ product, selectedSize, onSelectSize }: FindMySizeProps) {
  const defaultCm = product.category === "kids" ? 21.0 : product.category === "women" ? 24.5 : 27.0;
  const [mode, setMode] = useState<"known" | "estimate">("known");
  const [footCm, setFootCm] = useState<number>(defaultCm);

  // Fit Engine state
  const [heightCm, setHeightCm] = useState<number>(172);
  const [brand, setBrand] = useState<BrandName | "">("");
  const [refUkSize, setRefUkSize] = useState<number | null>(null);
  const [hasSavedEstimate, setHasSavedEstimate] = useState(false);
  const [showSteps, setShowSteps] = useState(false);

  const inputId = useId();
  const sliderId = useId();
  const heightInputId = useId();
  const brandSelectId = useId();
  const refSizeSelectId = useId();

  // Load saved estimate from localStorage on mount
  useEffect(() => {
    const saved = loadFitEstimate();
    if (saved) {
      setHeightCm(saved.heightCm);
      setBrand(saved.brand);
      setRefUkSize(saved.ukSize);
      setHasSavedEstimate(true);
      setMode("estimate");
    }
  }, []);

  // Persist estimate changes when in estimate mode
  const persistEstimate = (nextHeight: number, nextBrand: BrandName | "", nextUk: number | null) => {
    saveFitEstimate({ heightCm: nextHeight, brand: nextBrand, ukSize: nextUk });
    setHasSavedEstimate(true);
  };

  const handleClearEstimate = () => {
    clearFitEstimate();
    setHeightCm(172);
    setBrand("");
    setRefUkSize(null);
    setHasSavedEstimate(false);
    setShowSteps(false);
  };

  const clampedHeight = Math.min(210, Math.max(120, Number.isFinite(heightCm) ? heightCm : 172));
  const estimate = estimateFoot({
    heightCm: clampedHeight,
    brand,
    ukSize: brand ? refUkSize : null,
  });

  const activeFootCm =
    mode === "estimate"
      ? estimate.footMm / 10
      : Math.min(32, Math.max(20, Number.isFinite(footCm) ? footCm : defaultCm));

  const rec = recommendSize(product, activeFootCm);

  // Active preview entry: recommended size if available, otherwise currently selected size
  const activeEntry =
    rec.entries.find((e) => e.size === (rec.recommendedSize ?? selectedSize)) ?? rec.entries[0];

  const footMm = activeFootCm * 10;
  const innerMm = activeEntry?.innerLengthMm ?? 280;
  const toeRoomMm = activeEntry ? Math.round(activeEntry.toeRoomMm) : 0;
  const fillPct = Math.min(100, Math.max(25, (footMm / Math.max(innerMm, 1)) * 100));

  const handleNumberChange = (val: string) => {
    const parsed = parseFloat(val);
    if (!Number.isNaN(parsed)) {
      setFootCm(parsed);
    }
  };

  return (
    <div
      className="mt-4 rounded-xl border border-border bg-surface p-3.5 sm:p-4"
      aria-label="Find my size"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h4 className="text-xs tracking-[0.25em] text-muted-foreground uppercase">
          Find my size
        </h4>
        <span className="text-[11px] text-muted-foreground/75">
          Approximate guide. Foot shapes vary.
        </span>
      </div>

      {/* Mode tab switch */}
      <div
        className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-background/60 p-1 mb-3.5"
        role="tablist"
        aria-label="Foot measurement mode"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "known"}
          onClick={() => setMode("known")}
          className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-neon ${
            mode === "known"
              ? "bg-neon text-neon-foreground font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          I know my foot length
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "estimate"}
          onClick={() => setMode("estimate")}
          className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-neon ${
            mode === "estimate"
              ? "bg-neon text-neon-foreground font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Estimate it for me
        </button>
      </div>

      {mode === "known" ? (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <label htmlFor={inputId} className="text-xs text-muted-foreground whitespace-nowrap">
            Foot length (cm)
          </label>
          <div className="flex items-center gap-3 flex-1">
            <input
              id={sliderId}
              type="range"
              min={20}
              max={32}
              step={0.1}
              value={activeFootCm}
              onChange={(e) => setFootCm(parseFloat(e.target.value))}
              aria-label="Foot length slider in centimetres"
              className="flex-1 accent-[#ff6a00] cursor-pointer h-2 bg-secondary rounded-lg"
            />
            <input
              id={inputId}
              type="number"
              min={20}
              max={32}
              step={0.1}
              value={footCm}
              onChange={(e) => handleNumberChange(e.target.value)}
              onBlur={() => setFootCm(activeFootCm)}
              aria-label="Foot length in centimetres"
              className="w-20 min-h-[38px] rounded-md border border-border bg-background px-2.5 py-1 text-sm font-mono text-foreground text-right focus:outline-none focus:border-neon"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-3" aria-label="Fit Engine estimator">
          {/* Height input + slider */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <label htmlFor={heightInputId} className="text-xs text-muted-foreground whitespace-nowrap">
              Height (cm)
            </label>
            <div className="flex items-center gap-3 flex-1">
              <input
                type="range"
                min={120}
                max={210}
                step={1}
                value={clampedHeight}
                onChange={(e) => {
                  const next = parseFloat(e.target.value);
                  setHeightCm(next);
                  persistEstimate(next, brand, refUkSize);
                }}
                aria-label="Height slider in centimetres"
                className="flex-1 accent-[#ff6a00] cursor-pointer h-2 bg-secondary rounded-lg"
              />
              <input
                id={heightInputId}
                type="number"
                min={120}
                max={210}
                step={1}
                value={heightCm}
                onChange={(e) => {
                  const parsed = parseFloat(e.target.value);
                  if (!Number.isNaN(parsed)) {
                    setHeightCm(parsed);
                    persistEstimate(parsed, brand, refUkSize);
                  }
                }}
                onBlur={() => setHeightCm(clampedHeight)}
                aria-label="Height in centimetres"
                className="w-20 min-h-[38px] rounded-md border border-border bg-background px-2.5 py-1 text-sm font-mono text-foreground text-right focus:outline-none focus:border-neon"
              />
            </div>
          </div>

          {/* Optional brand + UK size */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label htmlFor={brandSelectId} className="block text-[11px] text-muted-foreground mb-1">
                Current shoe brand (optional)
              </label>
              <select
                id={brandSelectId}
                value={brand}
                onChange={(e) => {
                  const nextBrand = e.target.value as BrandName | "";
                  const nextSize = nextBrand && !refUkSize ? 9 : refUkSize;
                  setBrand(nextBrand);
                  setRefUkSize(nextSize);
                  persistEstimate(clampedHeight, nextBrand, nextSize);
                }}
                aria-label="Current shoe brand"
                className="w-full min-h-[38px] rounded-md border border-border bg-background px-2.5 py-1 text-xs sm:text-sm text-foreground focus:outline-none focus:border-neon"
              >
                <option value="">None (height only)</option>
                {BRANDS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor={refSizeSelectId} className="block text-[11px] text-muted-foreground mb-1">
                UK size in that brand
              </label>
              <select
                id={refSizeSelectId}
                value={refUkSize ?? ""}
                disabled={!brand}
                onChange={(e) => {
                  const nextUk = e.target.value ? Number(e.target.value) : null;
                  setRefUkSize(nextUk);
                  persistEstimate(clampedHeight, brand, nextUk);
                }}
                aria-label="UK size in selected brand"
                className="w-full min-h-[38px] rounded-md border border-border bg-background px-2.5 py-1 text-xs sm:text-sm text-foreground focus:outline-none focus:border-neon disabled:opacity-45"
              >
                <option value="">Select UK size</option>
                {REFERENCE_UK_SIZES.map((s) => (
                  <option key={s} value={s}>
                    UK {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Estimate summary + Confidence meter */}
          <div className="rounded-lg border border-neon/30 bg-neon/5 p-2.5 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs sm:text-sm">
                <span className="inline-block rounded bg-neon/20 text-neon px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider mr-1.5">
                  Estimate
                </span>
                <span className="text-muted-foreground">Estimated foot length </span>
                <span className="font-mono font-semibold text-foreground">
                  {(estimate.footMm / 10).toFixed(1)} cm
                </span>{" "}
                <span className="font-mono text-xs text-muted-foreground">
                  ({(estimate.rangeMm[0] / 10).toFixed(1)} to {(estimate.rangeMm[1] / 10).toFixed(1)})
                </span>
              </div>

              {hasSavedEstimate && (
                <button
                  type="button"
                  onClick={handleClearEstimate}
                  className="text-[11px] text-muted-foreground hover:text-neon underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-neon rounded"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Confidence meter */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Estimate confidence</span>
                <span className="font-mono font-semibold text-neon">
                  {Math.round(estimate.confidence * 100)}%
                </span>
              </div>
              <div
                className="h-1.5 w-full rounded-full bg-secondary overflow-hidden"
                role="progressbar"
                aria-valuenow={Math.round(estimate.confidence * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Estimate confidence"
              >
                <div
                  className="h-full bg-neon transition-all duration-300"
                  style={{ width: `${Math.round(estimate.confidence * 100)}%` }}
                />
              </div>
            </div>

            {/* Collapsible "How we calculated this" */}
            <div>
              <button
                type="button"
                onClick={() => setShowSteps((s) => !s)}
                aria-expanded={showSteps}
                className="text-[11px] text-neon hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-neon rounded"
              >
                {showSteps ? "Hide calculation" : "How we calculated this"}
              </button>
              {showSteps && (
                <ul className="mt-2 space-y-1 border-t border-border/60 pt-2 text-[11px] font-mono text-muted-foreground">
                  {estimate.steps.map((step, idx) => (
                    <li key={idx}>• {step}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Small SVG foot silhouette over insole bar showing free toe room */}
      <div className="mt-3.5 rounded-lg border border-border/70 bg-background/60 p-2.5">
        <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
          <span className="text-muted-foreground">
            {activeEntry ? `UK ${activeEntry.size} insole (${Math.round(innerMm)} mm)` : "Insole"}
          </span>
          <span className={toeRoomMm >= 10 ? "text-neon font-semibold" : "text-amber-400 font-semibold"}>
            {toeRoomMm >= 0 ? `${toeRoomMm} mm toe room` : `${Math.abs(toeRoomMm)} mm tight`}
          </span>
        </div>

        <svg
          viewBox="0 0 260 36"
          className="w-full h-9 overflow-visible"
          role="img"
          aria-label={`Foot silhouette inside insole bar showing ${toeRoomMm} mm toe room`}
        >
          {/* Insole bar */}
          <rect
            x="2"
            y="6"
            width="256"
            height="24"
            rx="12"
            fill="rgba(255,255,255,0.04)"
            stroke="rgba(255,255,255,0.16)"
            strokeWidth="1.2"
          />
          {/* Toe room highlight */}
          {toeRoomMm > 0 && (
            <rect
              x={Math.max(6, (fillPct / 100) * 252)}
              y="8"
              width={Math.max(0, 254 - (fillPct / 100) * 252)}
              height="20"
              rx="9"
              fill="rgba(255,106,0,0.22)"
              stroke="rgba(255,106,0,0.55)"
              strokeWidth="1"
              strokeDasharray="3 2"
            />
          )}
          {/* Stylized foot silhouette */}
          <g transform={`translate(6, 8) scale(${Math.min(1, fillPct / 100) * 0.96}, 1)`}>
            <path
              d="M10,10 C10,4 28,2 56,3 C98,4 150,2 198,3 C224,4 244,6 248,10 C244,15 224,18 198,18 C150,18 98,16 56,17 C28,18 10,16 10,10 Z"
              fill="rgba(255,106,0,0.68)"
            />
          </g>
        </svg>
      </div>

      {/* Recommendation + Select size action */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs sm:text-sm">
          {rec.fitStatus === "too-short" && rec.recommendedSize !== null ? (
            <span className="text-amber-400 font-medium">
              UK {rec.recommendedSize} is the smallest available and will feel loose ({Math.round(activeEntry?.toeRoomMm ?? 0)} mm toe room)
            </span>
          ) : rec.fitStatus === "too-long" && rec.recommendedSize !== null ? (
            <span className="text-amber-400 font-medium">
              UK {rec.recommendedSize} is the largest available and may feel tight
            </span>
          ) : rec.recommendedSize === null ? (
            <span className="text-amber-400 font-medium">Outside available sizes</span>
          ) : (
            <div className="space-y-0.5">
              <div>
                <span className="text-muted-foreground">Recommended: </span>
                <span className="font-semibold text-neon">UK {rec.recommendedSize}</span>
                <span className="text-muted-foreground"> (comfortable)</span>
              </div>
              {rec.snugAlternative !== null && (
                <p className="text-[11px] text-muted-foreground">
                  Between sizes: <span className="text-foreground font-medium">UK {rec.snugAlternative}</span> is snug,{" "}
                  <span className="text-foreground font-medium">UK {rec.recommendedSize}</span> is comfortable.
                </p>
              )}
            </div>
          )}
        </div>

        {rec.recommendedSize !== null && (
          <button
            type="button"
            onClick={() => onSelectSize(rec.recommendedSize!)}
            aria-label={`Select recommended size UK ${rec.recommendedSize}`}
            className={`px-3.5 py-1.5 min-h-[36px] rounded-full text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-neon ${
              selectedSize === rec.recommendedSize
                ? "bg-neon/20 text-neon border border-neon"
                : "bg-neon text-neon-foreground hover:opacity-90"
            }`}
          >
            {selectedSize === rec.recommendedSize ? `UK ${rec.recommendedSize} Selected` : "Select size"}
          </button>
        )}
      </div>

      {/* Per-size fit tags */}
      <div className="mt-3 grid grid-cols-3 sm:grid-cols-6 gap-1.5" aria-label="Fit by UK size">
        {rec.entries.map((entry) => {
          const isRec = entry.size === rec.recommendedSize;
          return (
            <button
              key={entry.size}
              type="button"
              onClick={() => onSelectSize(entry.size)}
              aria-label={`UK ${entry.size}: ${entry.tag} fit`}
              className={`rounded-lg border px-1.5 py-1.5 text-center transition focus:outline-none focus-visible:ring-2 focus-visible:ring-neon ${
                isRec
                  ? "border-neon bg-neon/10"
                  : "border-border/70 bg-background/40 hover:border-foreground/40"
              }`}
            >
              <div className="text-[11px] font-mono font-semibold text-foreground">UK {entry.size}</div>
              <span
                className={`mt-0.5 inline-block rounded px-1.5 text-[10px] font-medium border ${TAG_STYLE[entry.tag]}`}
              >
                {entry.tag}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
