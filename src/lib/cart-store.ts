import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  color: string;
  colorHex: string;
  size: number;
  qty: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  add: (item: Omit<CartItem, "id" | "qty"> & { qty?: number }) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),
      add: (item) =>
        set((s) => {
          const key = `${item.productId}-${item.color}-${item.size}`;
          const existing = s.items.find((i) => i.id === key);
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.id === key ? { ...i, qty: i.qty + (item.qty ?? 1) } : i,
              ),
              isOpen: true,
            };
          }
          return {
            items: [...s.items, { ...item, id: key, qty: item.qty ?? 1 }],
            isOpen: true,
          };
        }),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      setQty: (id, qty) =>
        set((s) => ({
          items: s.items
            .map((i) => (i.id === id ? { ...i, qty: Math.max(1, qty) } : i))
            .filter((i) => i.qty > 0),
        })),
      clear: () => set({ items: [] }),
    }),
    { name: "marg-cart" },
  ),
);

export const selectTotal = (items: CartItem[]) =>
  items.reduce((sum, i) => sum + i.price * i.qty, 0);
export const selectCount = (items: CartItem[]) =>
  items.reduce((sum, i) => sum + i.qty, 0);
