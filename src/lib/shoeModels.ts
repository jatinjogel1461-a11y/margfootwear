import { products } from "./products";

export const BASE_MODELS = [
  "/models/shoe-1.glb",
  "/models/shoe-2.glb",
  "/models/shoe-3.glb",
  "/models/shoe-4.glb",
  "/models/shoe-5.glb",
  "/models/shoe-6.glb",
];

export const FALLBACK_SHOE_MODEL = "/models/sneaker/scene.gltf";

export const VARIANTS = [
  { name: "original", tint: null, rotateY: 0 },
  { name: "warm", tint: "#ffaa66", rotateY: Math.PI / 6 },
  { name: "cool", tint: "#88ccff", rotateY: -Math.PI / 6 },
  { name: "mono", tint: "#999999", rotateY: Math.PI },
];

export const COMBOS = BASE_MODELS.flatMap((model) =>
  VARIANTS.map((variant) => ({ model, variant }))
);

// We delay sorting until the function is called so products array is fully loaded
let sortedProductIds: string[] | null = null;

export function getShoeVariant(productId: string | undefined) {
  if (!productId) return { model: FALLBACK_SHOE_MODEL, variant: VARIANTS[0] };
  
  if (!sortedProductIds) {
    sortedProductIds = [...products].map((p) => p.id).sort();
  }
  
  let index = sortedProductIds.indexOf(productId);
  if (index === -1) {
    // fallback hash if id not found
    index = productId.length;
  }
  return COMBOS[index % COMBOS.length];
}

// Deprecated old getShoeModel function for compatibility, but updated to use new system
export function getShoeModel(key: string | number | undefined): string {
  return getShoeVariant(String(key)).model;
}
