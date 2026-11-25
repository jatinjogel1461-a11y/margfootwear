// ---------------------------------------------------------------------------
// Fit Engine: estimates foot length (mm) from height and/or an existing
// brand + UK shoe size, with confidence scoring and transparent steps.
// ---------------------------------------------------------------------------

export const BRANDS = [
  "Nike",
  "Adidas",
  "Puma",
  "Reebok",
  "Skechers",
  "Bata",
  "Other",
] as const;

export type BrandName = (typeof BRANDS)[number];

/**
 * Approximate brand last/sizing offsets in millimetres (placeholder values
 * between -4 and +4 mm; replace with real brand fit data when available).
 */
export const BRAND_OFFSET_MM: Record<BrandName, number> = {
  Nike: -2,
  Adidas: 0,
  Puma: -1,
  Reebok: 1,
  Skechers: 3,
  Bata: 2,
  Other: 0,
};

export interface EstimateFootInput {
  heightCm: number;
  brand?: BrandName | "";
  ukSize?: number | null;
}

export interface FitEstimate {
  footMm: number;
  rangeMm: [number, number];
  confidence: number;
  method: "blended" | "brand-size" | "height-only";
  steps: string[];
}

export interface StoredFitEstimate {
  heightCm: number;
  brand: BrandName | "";
  ukSize: number | null;
}

const STORAGE_KEY = "marg-fit-estimate";

const round1 = (n: number) => Math.round(n * 10) / 10;

export function estimateFoot({
  heightCm,
  brand,
  ukSize,
}: EstimateFootInput): FitEstimate {
  const clampedHeight = Math.min(210, Math.max(120, Number.isFinite(heightCm) ? heightCm : 170));
  const hasBrandSize = Boolean(brand) && typeof ukSize === "number" && Number.isFinite(ukSize) && ukSize > 0;

  const heightFootMm = clampedHeight * 1.53; // 10 * 0.153
  const steps: string[] = [
    `Height estimate: ${clampedHeight} cm × 1.53 = ${round1(heightFootMm)} mm`,
  ];

  let footMm: number;
  let confidence: number;
  let method: FitEstimate["method"];

  if (hasBrandSize && brand) {
    const offset = BRAND_OFFSET_MM[brand] ?? 0;
    const brandFootMm = 8.47 * ukSize! + 199 + offset;
    const sign = offset >= 0 ? `+ ${offset}` : `- ${Math.abs(offset)}`;
    steps.push(
      `Brand + size (${brand} UK ${ukSize}): 8.47 × ${ukSize} + 199 ${sign} = ${round1(brandFootMm)} mm`,
    );

    if (Number.isFinite(heightCm) && heightCm >= 120 && heightCm <= 210) {
      footMm = brandFootMm * 0.7 + heightFootMm * 0.3;
      confidence = 0.85;
      method = "blended";
      steps.push(
        `Blended (70% brand + 30% height): 0.7 × ${round1(brandFootMm)} + 0.3 × ${round1(heightFootMm)} = ${round1(footMm)} mm`,
      );
    } else {
      footMm = brandFootMm;
      confidence = 0.75;
      method = "brand-size";
    }
  } else {
    footMm = heightFootMm;
    confidence = 0.6;
    method = "height-only";
  }

  const roundedFootMm = round1(footMm);
  const halfRange = round1((1 - confidence) * 30);
  const rangeMm: [number, number] = [
    round1(roundedFootMm - halfRange),
    round1(roundedFootMm + halfRange),
  ];

  steps.push(
    `Confidence ${Math.round(confidence * 100)}% → ±${halfRange} mm (${rangeMm[0]} to ${rangeMm[1]} mm)`,
  );

  return {
    footMm: roundedFootMm,
    rangeMm,
    confidence,
    method,
    steps,
  };
}

export function loadFitEstimate(): StoredFitEstimate | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredFitEstimate>;
    if (typeof parsed.heightCm !== "number") return null;
    return {
      heightCm: parsed.heightCm,
      brand: (parsed.brand as BrandName | "") ?? "",
      ukSize: typeof parsed.ukSize === "number" ? parsed.ukSize : null,
    };
  } catch {
    return null;
  }
}

export function saveFitEstimate(data: StoredFitEstimate): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage errors (private browsing / quota)
  }
}

export function clearFitEstimate(): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}
