import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { ProductCard } from "@/components/ProductCard";
import { products } from "@/lib/products";
import { motion } from "framer-motion";

export const Route = createFileRoute("/new-arrivals")({
  head: () => ({ meta: [
    { title: "New Arrivals — Marg" },
    { name: "description", content: "The latest Marg drops. Limited release performance footwear." },
    { property: "og:title", content: "New Arrivals — Marg" },
    { property: "og:description", content: "The latest Marg drops. Limited release performance footwear." },
  ] }),
  component: NewArrivals,
});

function NewArrivals() {
  const list = products.filter((p) => p.isNew).sort((a, b) => (b.releaseDate ?? "").localeCompare(a.releaseDate ?? ""));
  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-xs tracking-[0.35em] text-neon">JUST DROPPED</p>
          <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight">New Arrivals</h1>
          <p className="mt-3 text-muted-foreground max-w-xl">Freshly launched silhouettes. Limited quantities, unlimited ambition.</p>
        </motion.div>

        <div className="mt-10 grid grid-cols-2 md:grid-cols-3 gap-5">
          {list.map((p, i) => (
            <div key={p.id} className="relative">
              <ProductCard product={p} index={i} />
              {p.releaseDate && (
                <span className="absolute top-3 right-3 z-10 text-[10px] tracking-widest text-muted-foreground bg-background/80 backdrop-blur px-2 py-1 rounded">
                  {new Date(p.releaseDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
