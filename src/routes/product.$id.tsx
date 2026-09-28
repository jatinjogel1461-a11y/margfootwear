import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { Shoe3D } from "@/components/Shoe3D";
import { getProduct, products, formatINR, type Product } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";
import { useState } from "react";
import { motion } from "framer-motion";
import { Star, ShoppingBag, Zap } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/product/$id")({
  loader: ({ params }): { product: Product } => {
    const p = getProduct(params.id);
    if (!p) throw notFound();
    return { product: p };
  },
  head: ({ loaderData }) => ({
    meta: loaderData ? [
      { title: `${loaderData.product.name} — Marg` },
      { name: "description", content: loaderData.product.description },
      { property: "og:title", content: `${loaderData.product.name} — Marg` },
      { property: "og:description", content: loaderData.product.description },
    ] : [],
  }),
  notFoundComponent: () => (
    <PageShell>
      <div className="max-w-md mx-auto text-center py-32">
        <h1 className="text-4xl font-display font-bold">Not Found</h1>
        <Link to="/men" className="mt-4 inline-block text-neon">Back to shop</Link>
      </div>
    </PageShell>
  ),
  errorComponent: () => (
    <PageShell><div className="py-32 text-center">Something went wrong.</div></PageShell>
  ),
  component: ProductPage,
});

function ProductPage() {
  const { product } = Route.useLoaderData();
  const [colorIdx, setColorIdx] = useState(0);
  const [size, setSize] = useState(product.sizes[Math.floor(product.sizes.length / 2)]);
  const [qty, setQty] = useState(1);
  const add = useCart((s) => s.add);
  const nav = useNavigate();
  const color = product.colors[colorIdx];

  const related = products.filter((p) => p.id !== product.id && p.category === product.category).slice(0, 4);

  const onAdd = (buyNow = false) => {
    add({
      productId: product.id,
      name: product.name,
      price: product.price,
      color: color.name,
      colorHex: color.hex,
      size,
      qty,
    });
    if (buyNow) nav({ to: "/checkout" });
  };

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 md:py-10 grid lg:grid-cols-2 gap-6 md:gap-10">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative aspect-square rounded-3xl border border-border bg-surface overflow-hidden">
          <Shoe3D color={color.hex} slug={product.id} showAutoRotateToggle />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <p className="text-xs tracking-[0.3em] text-neon">{product.sub.toUpperCase()}</p>
          <h1 className="mt-2 text-4xl md:text-5xl font-display font-bold">{product.name}</h1>
          <div className="mt-3 flex items-center gap-2">
            <div className="flex">
              {[1,2,3,4,5].map((s) => (
                <Star key={s} className={`h-4 w-4 ${s <= Math.round(product.rating) ? "fill-neon text-neon" : "text-muted-foreground"}`} />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">{product.rating} ({product.reviews} reviews)</span>
          </div>

          <p className="mt-6 text-3xl font-bold">{formatINR(product.price * qty)}</p>

          <p className="mt-5 text-muted-foreground leading-relaxed">{product.description}</p>

          <div className="mt-7">
            <h4 className="text-xs tracking-[0.25em] text-muted-foreground mb-3">COLOR · {color.name.toUpperCase()}</h4>
            <div className="flex gap-2">
              {product.colors.map((c: { name: string; hex: string }, i: number) => (
                <button
                  key={c.name}
                  onClick={() => setColorIdx(i)}
                  title={c.name}
                  className={`h-11 w-11 rounded-full border-2 transition ${i === colorIdx ? "border-neon scale-110" : "border-border"}`}
                  style={{ background: c.hex }}
                />
              ))}
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-xs tracking-[0.25em] text-muted-foreground mb-3">SIZE (UK)</h4>
            <div className="grid grid-cols-6 gap-2">
              {product.sizes.map((s: number) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`py-2.5 min-h-[44px] rounded-md border text-sm ${size === s ? "border-neon bg-neon text-neon-foreground" : "border-border hover:border-foreground"}`}
                >{s}</button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center border border-border rounded-md">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-secondary">−</button>
              <span className="px-4 text-sm w-10 text-center">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="px-3 py-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-secondary">+</button>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => onAdd(false)}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-foreground text-background font-semibold px-6 py-3.5 min-h-[48px] rounded-full hover:opacity-90"
            >
              <ShoppingBag className="h-4 w-4" /> Add to Cart
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => onAdd(true)}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-neon text-neon-foreground font-semibold px-6 py-3.5 min-h-[48px] rounded-full hover:animate-glow-pulse"
            >
              <Zap className="h-4 w-4" /> Buy Now
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Reviews */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12 md:py-16 border-t border-border">
        <h2 className="text-2xl md:text-3xl font-display font-bold mb-6">Reviews</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { name: "Vikram J.", rating: 5, text: "Absolutely incredible fit and feel. Worth every rupee." },
            { name: "Sneha P.", rating: 5, text: "These are now my daily driver. Cushioning is unreal." },
            { name: "Arjun R.", rating: 4, text: "Great looking shoe — sizing runs slightly large." },
          ].map((r, i) => (
            <div key={i} className="border border-border rounded-2xl p-5 bg-surface">
              <div className="flex items-center gap-2 mb-2">
                {[1,2,3,4,5].map((s) => (
                  <Star key={s} className={`h-3.5 w-3.5 ${s <= r.rating ? "fill-neon text-neon" : "text-muted-foreground"}`} />
                ))}
                <span className="text-xs text-muted-foreground ml-1">{r.name}</span>
              </div>
              <p className="text-sm">{r.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Related */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <h2 className="text-2xl md:text-3xl font-display font-bold mb-6">You may also like</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {related.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      </section>
    </PageShell>
  );
}
