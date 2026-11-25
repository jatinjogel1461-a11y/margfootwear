import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { CompareLabScene } from "@/components/CompareLabScene";
import { products, getProduct, formatINR, type Product } from "@/lib/products";
import {
  formatDimension,
  getDimensions,
  getReferenceSize,
  type DimensionUnit,
} from "@/lib/shoeDimensions";
import { useState, useEffect, useMemo } from "react";
import { ArrowLeftRight, Link2, Search } from "lucide-react";
import { toast } from "sonner";

type CompareSearch = {
  a?: string;
  b?: string;
  sa?: number;
  sb?: number;
};

const DEFAULT_A_ID = "sv-velocity-x";
const DEFAULT_B_ID = "sv-infinity-run";
const UNIT_STORAGE_KEY = "marg-dim-unit";

function resolveProduct(id: string | undefined, fallbackId: string): Product {
  return (
    (id ? getProduct(id) : undefined) ??
    getProduct(fallbackId) ??
    products[0]
  );
}

function resolveSize(product: Product, requested?: number): number {
  if (typeof requested === "number" && product.sizes.includes(requested)) {
    return requested;
  }
  const ref = getReferenceSize(product);
  if (product.sizes.includes(ref)) return ref;
  return product.sizes[Math.floor(product.sizes.length / 2)] ?? 9;
}

export const Route = createFileRoute("/compare")({
  validateSearch: (search: Record<string, unknown>): CompareSearch => ({
    a: typeof search.a === "string" ? search.a : undefined,
    b: typeof search.b === "string" ? search.b : undefined,
    sa: search.sa !== undefined && !Number.isNaN(Number(search.sa)) ? Number(search.sa) : undefined,
    sb: search.sb !== undefined && !Number.isNaN(Number(search.sb)) ? Number(search.sb) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Compare Lab — Marg" },
      { name: "description", content: "Compare any two Marg shoes side by side in 3D at true relative scale." },
    ],
  }),
  component: CompareLabPage,
});

function ProductPicker({
  label,
  accentClass,
  product,
  size,
  onProductChange,
  onSizeChange,
}: {
  label: string;
  accentClass: string;
  product: Product;
  size: number;
  onProductChange: (id: string) => void;
  onSizeChange: (s: number) => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.sub.toLowerCase().includes(q),
    );
  }, [query]);

  // Ensure current product is always present in the select options
  const options = useMemo(() => {
    if (filtered.some((p) => p.id === product.id)) return filtered;
    return [product, ...filtered];
  }, [filtered, product]);

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className={`text-xs font-mono font-semibold tracking-wider uppercase ${accentClass}`}>
          {label}
        </span>
        <Link
          to="/product/$id"
          params={{ id: product.id }}
          className="text-xs text-muted-foreground hover:text-neon underline underline-offset-2"
        >
          View product ({formatINR(product.price)})
        </Link>
      </div>

      {/* Search filter */}
      <div className="relative">
        <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search shoes..."
          aria-label={`Search ${label} shoes`}
          className="w-full min-h-[38px] rounded-lg border border-border bg-background pl-8 pr-3 py-1.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-neon"
        />
      </div>

      {/* Product select + UK size select */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_110px] gap-2.5">
        <select
          value={product.id}
          onChange={(e) => onProductChange(e.target.value)}
          aria-label={`Select ${label} shoe`}
          className="w-full min-h-[42px] rounded-lg border border-border bg-background px-3 py-2 text-xs sm:text-sm text-foreground focus:outline-none focus:border-neon"
        >
          {options.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.category} · {p.sub})
            </option>
          ))}
        </select>

        <select
          value={size}
          onChange={(e) => onSizeChange(Number(e.target.value))}
          aria-label={`Select UK size for ${label}`}
          className="w-full min-h-[42px] rounded-lg border border-border bg-background px-3 py-2 text-xs sm:text-sm font-mono text-foreground focus:outline-none focus:border-neon"
        >
          {product.sizes.map((s) => (
            <option key={s} value={s}>
              UK {s}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function CompareLabPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const productA = resolveProduct(search.a, DEFAULT_A_ID);
  const productB = resolveProduct(search.b, DEFAULT_B_ID);
  const sizeA = resolveSize(productA, search.sa);
  const sizeB = resolveSize(productB, search.sb);

  const [unit, setUnit] = useState<DimensionUnit>("mm");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(UNIT_STORAGE_KEY);
      if (saved === "mm" || saved === "cm" || saved === "in") {
        setUnit(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleUnitChange = (u: DimensionUnit) => {
    setUnit(u);
    try {
      window.localStorage.setItem(UNIT_STORAGE_KEY, u);
    } catch {
      // ignore
    }
  };

  const updateSearch = (patch: Partial<CompareSearch>) => {
    navigate({
      search: {
        a: patch.a ?? productA.id,
        b: patch.b ?? productB.id,
        sa: patch.sa ?? sizeA,
        sb: patch.sb ?? sizeB,
      },
      replace: true,
    });
  };

  const handleSwap = () => {
    navigate({
      search: {
        a: productB.id,
        b: productA.id,
        sa: sizeB,
        sb: sizeA,
      },
      replace: true,
    });
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Comparison link copied!");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const dimsA = getDimensions(productA, sizeA);
  const dimsB = getDimensions(productB, sizeB);

  const diffLen = Math.round((dimsB.length - dimsA.length) * 10) / 10;
  const diffWid = Math.round((dimsB.width - dimsA.width) * 10) / 10;
  const diffHei = Math.round((dimsB.height - dimsA.height) * 10) / 10;

  const formatSignedDelta = (deltaMm: number, posWord: string, negWord: string, sameWord: string) => {
    if (Math.abs(deltaMm) < 0.5) return sameWord;
    const absStr = formatDimension(Math.abs(deltaMm), unit);
    return `${absStr} ${deltaMm > 0 ? posWord : negWord}`;
  };

  const summarySentence = `B is ${formatSignedDelta(diffLen, "longer", "shorter", "the same length")}, ${formatSignedDelta(diffWid, "wider", "narrower", "the same width")}, ${formatSignedDelta(diffHei, "taller", "lower", "the same height")}.`;

  let verdict = `Same fit if you wear UK ${sizeA} in A and UK ${sizeB} in B.`;
  if (Math.abs(diffLen) > 3) {
    const stepsDiff = diffLen / 8.47;
    if (stepsDiff > 0.35) {
      verdict =
        stepsDiff < 0.75
          ? "B runs slightly longer — consider half a size down in B."
          : `B runs noticeably longer — go ~${Math.round(stepsDiff)} size down in B for a similar length.`;
    } else if (stepsDiff < -0.35) {
      verdict =
        stepsDiff > -0.75
          ? "Go half a size up in B for a similar fit."
          : `B runs shorter — go ~${Math.round(Math.abs(stepsDiff))} size up in B for a similar length.`;
    }
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 md:py-10 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.3em] text-neon uppercase">Compare Lab</p>
            <h1 className="mt-1 text-3xl md:text-4xl font-display font-bold">
              Side-by-Side 3D Fit &amp; Scale
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              True relative scale comparison across models and UK sizes (dimensions approx.).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSwap}
              aria-label="Swap Shoe A and Shoe B"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-full border border-border bg-surface text-xs font-medium hover:border-neon hover:text-neon transition focus:outline-none focus-visible:ring-2 focus-visible:ring-neon"
            >
              <ArrowLeftRight className="h-3.5 w-3.5" /> Swap
            </button>
            <button
              type="button"
              onClick={handleCopyLink}
              aria-label="Copy comparison URL"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-full bg-neon text-neon-foreground text-xs font-semibold hover:opacity-90 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-neon"
            >
              <Link2 className="h-3.5 w-3.5" /> Copy link
            </button>
          </div>
        </div>

        {/* Two product pickers (stack on mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ProductPicker
            label="Shoe A"
            accentClass="text-neon"
            product={productA}
            size={sizeA}
            onProductChange={(id) => {
              const p = resolveProduct(id, DEFAULT_A_ID);
              updateSearch({ a: p.id, sa: resolveSize(p) });
            }}
            onSizeChange={(sa) => updateSearch({ sa })}
          />
          <ProductPicker
            label="Shoe B"
            accentClass="text-sky-400"
            product={productB}
            size={sizeB}
            onProductChange={(id) => {
              const p = resolveProduct(id, DEFAULT_B_ID);
              updateSearch({ b: p.id, sb: resolveSize(p) });
            }}
            onSizeChange={(sb) => updateSearch({ sb })}
          />
        </div>

        {/* Shared 3D Comparison Scene */}
        <div className="relative h-[340px] sm:h-[420px] md:h-[460px] w-full rounded-3xl border border-border bg-surface overflow-hidden">
          <CompareLabScene
            productA={productA}
            productB={productB}
            sizeA={sizeA}
            sizeB={sizeB}
            dimsA={dimsA}
            dimsB={dimsB}
          />
        </div>

        {/* Difference Table */}
        <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-display font-semibold">Dimension Difference</h2>
              <p className="text-xs text-muted-foreground">Approximate external dimensions</p>
            </div>

            <div
              className="inline-flex items-center rounded-full border border-border bg-background p-0.5"
              role="group"
              aria-label="Dimension unit"
            >
              {(["mm", "cm", "in"] as DimensionUnit[]).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => handleUnitChange(u)}
                  aria-pressed={unit === u}
                  className={`px-3 py-1 text-xs font-mono rounded-full transition ${
                    unit === u
                      ? "bg-neon text-neon-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-2.5 pr-4">Axis</th>
                  <th className="py-2.5 px-4 text-neon">A · {productA.name} (UK {sizeA})</th>
                  <th className="py-2.5 px-4 text-sky-400">B · {productB.name} (UK {sizeB})</th>
                  <th className="py-2.5 pl-4 text-right">Delta (B − A)</th>
                </tr>
              </thead>
              <tbody className="font-mono divide-y divide-border/60">
                {(
                  [
                    { label: "Length", a: dimsA.length, b: dimsB.length, d: diffLen },
                    { label: "Width", a: dimsA.width, b: dimsB.width, d: diffWid },
                    { label: "Height", a: dimsA.height, b: dimsB.height, d: diffHei },
                  ] as const
                ).map((row) => (
                  <tr key={row.label}>
                    <td className="py-3 pr-4 font-sans font-medium text-foreground">{row.label}</td>
                    <td className="py-3 px-4">{formatDimension(row.a, unit)}</td>
                    <td className="py-3 px-4">{formatDimension(row.b, unit)}</td>
                    <td className="py-3 pl-4 text-right font-semibold">
                      {row.d > 0 ? `+${formatDimension(row.d, unit)}` : row.d < 0 ? `-${formatDimension(Math.abs(row.d), unit)}` : formatDimension(0, unit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Plain summary + Fit verdict */}
          <div className="rounded-xl border border-neon/30 bg-neon/5 p-3.5 space-y-1">
            <p className="text-sm text-foreground">{summarySentence}</p>
            <p className="text-xs sm:text-sm font-semibold text-neon">{verdict}</p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
