import { useState, useId } from "react";
import type { Product } from "@/lib/products";
import { recommendSize, type FitTag } from "@/lib/shoeDimensions";

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

export function FindMySize({ product, selectedSize, onSelectSize }: FindMySizeProps) {
  const defaultCm = product.category === "kids" ? 21.0 : product.category === "women" ? 24.5 : 27.0;
  const [footCm, setFootCm] = useState<number>(defaultCm);
  const inputId = useId();
  const sliderId = useId();

  const clampedCm = Math.min(32, Math.max(20, Number.isFinite(footCm) ? footCm : defaultCm));
  const rec = recommendSize(product, clampedCm);

  // Active preview entry: recommended size if available, otherwise currently selected size
  const activeEntry =
    rec.entries.find((e) => e.size === (rec.recommendedSize ?? selectedSize)) ?? rec.entries[0];

  const footMm = clampedCm * 10;
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

      {/* Foot length input + slider */}
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
            value={clampedCm}
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
            onBlur={() => setFootCm(clampedCm)}
            aria-label="Foot length in centimetres"
            className="w-20 min-h-[38px] rounded-md border border-border bg-background px-2.5 py-1 text-sm font-mono text-foreground text-right focus:outline-none focus:border-neon"
          />
        </div>
      </div>

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
          {rec.outOfRange ? (
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

        {!rec.outOfRange && rec.recommendedSize !== null && (
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
