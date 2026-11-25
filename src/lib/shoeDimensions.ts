// ---------------------------------------------------------------------------
// Shoe dimension data, size-scaling & fit recommendation helpers
// Note: Values below are approximate placeholders until real measurements
// are entered for each SKU.
// ---------------------------------------------------------------------------
import type { Category, Product, SubCategory } from "./products";

export type DimensionUnit = "mm" | "cm" | "in";
export type DimensionKey = "length" | "width" | "height";
export type FitTag = "Snug" | "Perfect" | "Loose";
export type CompareObjectId =
  | "none"
  | "credit-card"
  | "smartphone"
  | "cricket-ball"
  | "a4-sheet";

export interface ShoeDimensions {
  length: number;
  width: number;
  height: number;
}

export interface SizeScaleRatios {
  lengthRatio: number;
  widthRatio: number;
  heightRatio: number;
}

export interface CompareObjectSpec {
  id: Exclude<CompareObjectId, "none">;
  label: string;
  sizeMm: number;
  shortLabel: string;
}

export const COMPARE_OBJECTS: CompareObjectSpec[] = [
  { id: "credit-card", label: "Credit card (85.6 mm)", sizeMm: 85.6, shortLabel: "Credit card · 85.6 mm" },
  { id: "smartphone", label: "Smartphone (150 mm)", sizeMm: 150, shortLabel: "Smartphone · 150 mm" },
  { id: "cricket-ball", label: "Cricket ball (71 mm)", sizeMm: 71, shortLabel: "Cricket ball · 71 mm" },
  { id: "a4-sheet", label: "A4 sheet (297 mm)", sizeMm: 297, shortLabel: "A4 sheet · 297 mm" },
];

/** Reference UK size for each category */
const REFERENCE_SIZE: Record<Category, number> = {
  men: 9,
  women: 7,
  kids: 3,
};

/** Per-UK-size step increments in millimetres */
const STEP_MM = {
  length: 8.47,
  width: 3.3,
  height: 1.5,
} as const;

/** Default dimensions (mm) at category reference size, grouped by category & sub-category */
const CATEGORY_SUB_DEFAULTS: Record<Category, Record<SubCategory, ShoeDimensions>> = {
  men: {
    Running: { length: 300, width: 110, height: 105 },
    Casual: { length: 296, width: 108, height: 100 },
    Sports: { length: 302, width: 112, height: 124 },
    Lifestyle: { length: 298, width: 109, height: 108 },
    Training: { length: 299, width: 114, height: 115 },
  },
  women: {
    Running: { length: 268, width: 98, height: 96 },
    Casual: { length: 264, width: 96, height: 92 },
    Sports: { length: 270, width: 100, height: 114 },
    Lifestyle: { length: 266, width: 97, height: 98 },
    Training: { length: 267, width: 101, height: 104 },
  },
  kids: {
    Running: { length: 218, width: 82, height: 84 },
    Casual: { length: 215, width: 80, height: 80 },
    Sports: { length: 220, width: 84, height: 96 },
    Lifestyle: { length: 216, width: 81, height: 84 },
    Training: { length: 219, width: 85, height: 90 },
  },
};

/** Optional per-product overrides (mm at category reference size) */
const PRODUCT_OVERRIDES: Record<string, Partial<ShoeDimensions>> = {
  "sv-zz-demo-shoe": { length: 295, width: 108, height: 102 },
  "sv-velocity-x": { length: 302, width: 109, height: 104 },
  "sv-phantom-elite": { length: 304, width: 107, height: 106 },
  "sv-infinity-run": { length: 303, width: 111, height: 108 },
  "sv-titan-court": { length: 304, width: 113, height: 132 },
  "sv-hyper-lift": { length: 298, width: 116, height: 120 },
  "sv-elevate-w": { length: 266, width: 98, height: 112 },
  "sv-aria-pro": { length: 270, width: 97, height: 95 },
  "sv-rocket-kids": { length: 220, width: 83, height: 86 },
};

export function getReferenceSize(product: Product): number {
  if (product.category in REFERENCE_SIZE) {
    return REFERENCE_SIZE[product.category];
  }
  return product.sizes.length > 0
    ? product.sizes[Math.floor(product.sizes.length / 2)]
    : 9;
}

/**
 * Returns approximate shoe dimensions in millimetres for a product at the
 * given UK size, scaling from the category reference size.
 */
export function getDimensions(product: Product, ukSize: number): ShoeDimensions {
  const category = product.category in CATEGORY_SUB_DEFAULTS ? product.category : "men";
  const catMap = CATEGORY_SUB_DEFAULTS[category];
  const subDefault = catMap[product.sub] ?? catMap.Running;
  const override = PRODUCT_OVERRIDES[product.id];

  const base: ShoeDimensions = {
    length: override?.length ?? subDefault.length,
    width: override?.width ?? subDefault.width,
    height: override?.height ?? subDefault.height,
  };

  const refSize = getReferenceSize(product);
  const validSize =
    product.sizes.length > 0 && product.sizes.includes(ukSize)
      ? ukSize
      : ukSize || refSize;

  const steps = validSize - refSize;

  return {
    length: Math.round((base.length + steps * STEP_MM.length) * 10) / 10,
    width: Math.round((base.width + steps * STEP_MM.width) * 10) / 10,
    height: Math.round((base.height + steps * STEP_MM.height) * 10) / 10,
  };
}

/**
 * Returns scale ratios relative to the product's reference size.
 */
export function getSizeScaleRatios(product: Product, ukSize: number): SizeScaleRatios {
  const refDims = getDimensions(product, getReferenceSize(product));
  const curDims = getDimensions(product, ukSize);
  return {
    lengthRatio: refDims.length > 0 ? curDims.length / refDims.length : 1,
    widthRatio: refDims.width > 0 ? curDims.width / refDims.width : 1,
    heightRatio: refDims.height > 0 ? curDims.height / refDims.height : 1,
  };
}

/**
 * Formats a millimetre measurement into "mm" (whole number), "cm" (1 decimal),
 * or "in" (1 decimal).
 */
export function formatDimension(mm: number, unit: DimensionUnit): string {
  switch (unit) {
    case "mm":
      return `${Math.round(mm)} mm`;
    case "cm":
      return `${(mm / 10).toFixed(1)} cm`;
    case "in":
      return `${(mm / 25.4).toFixed(1)} in`;
  }
}

export interface SizeFitEntry {
  size: number;
  innerLengthMm: number;
  toeRoomMm: number;
  tag: FitTag;
}

export interface SizeRecommendation {
  recommendedSize: number | null;
  snugAlternative: number | null;
  entries: SizeFitEntry[];
  outOfRange: boolean;
}

/**
 * Recommends a UK size from the product's available sizes based on foot length (cm).
 * inner length = shoe length - 14 mm; target toe room >= 10 mm.
 */
export function recommendSize(product: Product, footLengthCm: number): SizeRecommendation {
  const footMm = footLengthCm * 10;
  const sortedSizes = [...product.sizes].sort((a, b) => a - b);

  const entries: SizeFitEntry[] = sortedSizes.map((size) => {
    const shoeLen = getDimensions(product, size).length;
    const innerLengthMm = Math.round((shoeLen - 14) * 10) / 10;
    const toeRoomMm = Math.round((innerLengthMm - footMm) * 10) / 10;
    let tag: FitTag;
    if (toeRoomMm < 10) {
      tag = "Snug";
    } else if (toeRoomMm <= 18) {
      tag = "Perfect";
    } else {
      tag = "Loose";
    }
    return { size, innerLengthMm, toeRoomMm, tag };
  });

  // Smallest size where innerLength >= footMm + 10
  const fit = entries.find((e) => e.toeRoomMm >= 10) ?? null;

  // Check if foot is way too small even for the smallest size (> 35 mm extra toe room)
  const smallest = entries[0];
  const outOfRange = !fit || (smallest && fit.size === smallest.size && smallest.toeRoomMm > 35);

  if (outOfRange) {
    return {
      recommendedSize: null,
      snugAlternative: null,
      entries,
      outOfRange: true,
    };
  }

  // If foot is between sizes: previous size has 0 <= toeRoom < 10
  const fitIdx = entries.indexOf(fit);
  const prev = fitIdx > 0 ? entries[fitIdx - 1] : null;
  const snugAlternative = prev && prev.toeRoomMm >= 0 && prev.toeRoomMm < 10 ? prev.size : null;

  return {
    recommendedSize: fit.size,
    snugAlternative,
    entries,
    outOfRange: false,
  };
}
