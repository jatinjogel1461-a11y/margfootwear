import { AnimatePresence, motion } from "framer-motion";
import { useCart, selectTotal } from "@/lib/cart-store";
import { Link } from "@tanstack/react-router";
import { X, Minus, Plus, Trash2 } from "lucide-react";
import { formatINR } from "@/lib/products";

export function CartDrawer() {
  const { isOpen, close, items, setQty, remove } = useCart();
  const total = selectTotal(items);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.35 }}
            className="fixed top-0 right-0 bottom-0 w-full sm:w-[420px] bg-background border-l border-border z-[70] flex flex-col"
          >
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="font-display text-lg tracking-wide">YOUR BAG</h3>
              <button onClick={close} aria-label="Close cart" className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-secondary rounded-full transition"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {items.length === 0 && (
                <div className="text-center text-muted-foreground mt-20 text-sm">Your bag is empty.</div>
              )}
              {items.map((i) => (
                <div key={i.id} className="flex gap-3 border border-border rounded-lg p-3">
                  <div
                    className="h-16 w-16 rounded-md flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${i.colorHex}, #111)` }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-2">
                      <p className="text-sm font-medium truncate">{i.name}</p>
                      <button onClick={() => remove(i.id)} aria-label="Remove" className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2 -mt-2"><Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive transition" /></button>
                    </div>
                    <p className="text-xs text-muted-foreground">{i.color} · Size {i.size}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-1 border border-border rounded">
                        <button onClick={() => setQty(i.id, i.qty - 1)} className="p-1 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-secondary"><Minus className="h-3 w-3" /></button>
                        <span className="px-2 text-sm w-7 text-center">{i.qty}</span>
                        <button onClick={() => setQty(i.id, i.qty + 1)} className="p-1 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-secondary"><Plus className="h-3 w-3" /></button>
                      </div>
                      <span className="text-sm font-semibold">{formatINR(i.price * i.qty)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {items.length > 0 && (
              <div className="border-t border-border p-5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">{formatINR(total)}</span>
                </div>
                <Link
                  to="/checkout"
                  onClick={close}
                  className="block w-full text-center bg-neon text-neon-foreground font-semibold py-3 min-h-[48px] rounded-lg hover:opacity-90 transition"
                >
                  Checkout
                </Link>
                <Link to="/cart" onClick={close} className="block text-center text-sm text-muted-foreground hover:text-foreground">
                  View bag
                </Link>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
