// ---------------------------------------------------------------------------
// Shoe dimension data & size-scaling helper
// Note: Values below are approximate placeholders until real measurements
// are entered for each SKU.
// ---------------------------------------------------------------------------
import type { Category, Product, SubCategory } from "./products";

export type DimensionUnit = "mm" | "cm" | "in";
export type DimensionKey = "length" | "width" | "height";

export interface ShoeDimensions {
  length: number;
  width: number;
  height: number;
}

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

  const refSize =
    REFERENCE_SIZE[category] ??
    (product.sizes.length > 0
      ? product.sizes[Math.floor(product.sizes.length / 2)]
      : 9);

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
