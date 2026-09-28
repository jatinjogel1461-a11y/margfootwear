import { useMemo, useState, useEffect } from "react";
import { products, type Product, type Category } from "@/lib/products";
import { ProductCard } from "./ProductCard";
import { motion } from "framer-motion";

type SortKey = "newest" | "price-asc" | "price-desc" | "popular";

export function CatalogPage({
  title,
  subtitle,
  filterFn,
}: {
  title: string;
  subtitle: string;
  filterFn: (p: Product) => boolean;
}) {
  const base = useMemo(() => products.filter(filterFn), [filterFn]);
  const subs = useMemo(() => Array.from(new Set(base.map((p) => p.sub))), [base]);
  const allColors = useMemo(() => {
    const m = new Map<string, string>();
    base.forEach((p) => p.colors.forEach((c) => m.set(c.name, c.hex)));
    return Array.from(m.entries());
  }, [base]);
  const allSizes = useMemo(() => Array.from(new Set(base.flatMap((p) => p.sizes))).sort((a, b) => a - b), [base]);
  const maxPrice = Math.max(...base.map((p) => p.price), 0);

  const [activeSubs, setActiveSubs] = useState<Set<string>>(new Set());
  const [activeColors, setActiveColors] = useState<Set<string>>(new Set());
  const [activeSizes, setActiveSizes] = useState<Set<number>>(new Set());
  const [priceMax, setPriceMax] = useState(maxPrice);
  
  useEffect(() => {
    setPriceMax(maxPrice);
  }, [maxPrice]);

  const [sort, setSort] = useState<SortKey>("newest");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    let list = base.filter((p) => {
      if (activeSubs.size && !activeSubs.has(p.sub)) return false;
      if (activeColors.size && !p.colors.some((c) => activeColors.has(c.name))) return false;
      if (activeSizes.size && !p.sizes.some((s) => activeSizes.has(s))) return false;
      if (p.price > priceMax) return false;
      if (q && !p.name.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      if (sort === "popular") return b.reviews - a.reviews;
      // newest
      const ad = a.releaseDate ?? "0", bd = b.releaseDate ?? "0";
      return bd.localeCompare(ad);
    });
    return list;
  }, [base, activeSubs, activeColors, activeSizes, priceMax, sort, q]);

  const toggle = <T,>(set: Set<T>, val: T, fn: (s: Set<T>) => void) => {
    const next = new Set(set);
    next.has(val) ? next.delete(val) : next.add(val);
    fn(next);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-muted-foreground">{subtitle}</p>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-64 lg:flex-shrink-0 space-y-6">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search…"
            className="w-full bg-transparent border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-neon"
          />
          <FilterGroup label="Category">
            {subs.map((s) => (
              <Chip key={s} active={activeSubs.has(s)} onClick={() => toggle(activeSubs, s, setActiveSubs)}>{s}</Chip>
            ))}
          </FilterGroup>
          <FilterGroup label={`Price: up to ₹${priceMax.toLocaleString("en-IN")}`}>
            <input
              type="range"
              min={0}
              max={maxPrice}
              step={500}
              value={priceMax}
              onChange={(e) => setPriceMax(Number(e.target.value))}
              className="w-full accent-[oklch(0.75_0.22_45)]"
            />
          </FilterGroup>
          <FilterGroup label="Size">
            <div className="grid grid-cols-4 gap-2">
              {allSizes.map((s) => (
                <button
                  key={s}
                  onClick={() => toggle(activeSizes, s, setActiveSizes)}
                  className={`text-xs py-1.5 rounded border ${activeSizes.has(s) ? "border-neon bg-neon text-neon-foreground" : "border-border hover:border-foreground"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </FilterGroup>
          <FilterGroup label="Color">
            <div className="flex flex-wrap gap-2">
              {allColors.map(([name, hex]) => (
                <button
                  key={name}
                  onClick={() => toggle(activeColors, name, setActiveColors)}
                  title={name}
                  className={`h-7 w-7 rounded-full border-2 ${activeColors.has(name) ? "border-neon" : "border-border"}`}
                  style={{ background: hex }}
                />
              ))}
            </div>
          </FilterGroup>
        </aside>

        <div className="flex-1">
          <div className="flex justify-between items-center mb-5">
            <p className="text-sm text-muted-foreground">{filtered.length} product{filtered.length === 1 ? "" : "s"}</p>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="bg-transparent border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-neon"
            >
              <option value="newest">Newest</option>
              <option value="popular">Most popular</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
            </select>
          </div>
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">No products match your filters.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              {filtered.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs tracking-[0.25em] text-muted-foreground mb-3">{label.toUpperCase()}</h4>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded-full border transition ${active ? "border-neon bg-neon text-neon-foreground" : "border-border hover:border-foreground"}`}
    >
      {children}
    </button>
  );
}

export function categoryFilter(c: Category) {
  return (p: Product) => p.category === c;
}
