import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { useCart, selectTotal } from "@/lib/cart-store";
import { formatINR } from "@/lib/products";
import { Minus, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [
    { title: "Your Bag — Marg" },
    { name: "description", content: "Review the items in your Marg bag." },
  ] }),
  component: CartPage,
});

function CartPage() {
  const { items, setQty, remove } = useCart();
  const total = selectTotal(items);
  return (
    <PageShell>
      <div className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-4xl md:text-5xl font-display font-bold">Your Bag</h1>
        {items.length === 0 ? (
          <div className="mt-16 text-center text-muted-foreground">
            <p>Your bag is empty.</p>
            <Link to="/new-arrivals" className="mt-4 inline-block text-neon">Shop new arrivals →</Link>
          </div>
        ) : (
          <div className="mt-10 grid lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-4">
              {items.map((i) => (
                <div key={i.id} className="flex gap-4 border border-border rounded-2xl p-4 bg-surface">
                  <div className="h-24 w-24 rounded-xl flex-shrink-0" style={{ background: `linear-gradient(135deg, ${i.colorHex}, #111)` }} />
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-semibold">{i.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{i.color} · Size {i.size}</p>
                      </div>
                      <button onClick={() => remove(i.id)} aria-label="Remove"><Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" /></button>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center border border-border rounded">
                        <button onClick={() => setQty(i.id, i.qty - 1)} className="p-1.5 hover:bg-secondary"><Minus className="h-3 w-3" /></button>
                        <span className="px-3 text-sm">{i.qty}</span>
                        <button onClick={() => setQty(i.id, i.qty + 1)} className="p-1.5 hover:bg-secondary"><Plus className="h-3 w-3" /></button>
                      </div>
                      <span className="font-semibold">{formatINR(i.price * i.qty)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <aside className="border border-border rounded-2xl p-6 bg-surface h-fit sticky top-24">
              <h3 className="font-display text-lg mb-4">Summary</h3>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>{formatINR(total)}</span></div>
              <div className="flex justify-between text-sm mt-2"><span className="text-muted-foreground">Shipping</span><span>{total > 5000 ? "Free" : formatINR(199)}</span></div>
              <div className="border-t border-border my-4" />
              <div className="flex justify-between font-semibold"><span>Total</span><span>{formatINR(total + (total > 5000 ? 0 : 199))}</span></div>
              <Link to="/checkout" className="mt-6 block text-center bg-neon text-neon-foreground font-semibold py-3 rounded-full">Checkout</Link>
            </aside>
          </div>
        )}
      </div>
    </PageShell>
  );
}
