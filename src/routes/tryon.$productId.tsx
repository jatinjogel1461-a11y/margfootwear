import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { getProduct, formatINR, type Product } from "@/lib/products";
import { FootTryOnViewer } from "@/components/FootTryOnViewer";

export const Route = createFileRoute("/tryon/$productId")({
  loader: ({ params }): { product: Product } => {
    const p = getProduct(params.productId);
    if (!p) throw notFound();
    return { product: p };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `Try On ${loaderData.product.name} — Marg` },
          {
            name: "description",
            content: `Virtual foot try-on for ${loaderData.product.name}`,
          },
        ]
      : [],
  }),
  notFoundComponent: () => (
    <div className="min-h-dvh bg-background text-foreground flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-3xl font-display font-bold">Product Not Found</h1>
      <Link to="/men" className="mt-4 text-neon hover:underline">
        Back to shop
      </Link>
    </div>
  ),
  component: TryOnPage,
});

function TryOnPage() {
  const { product } = Route.useLoaderData();

  return (
    <div className="min-h-dvh flex flex-col bg-black text-foreground">
      {/* Compact top bar */}
      <header className="h-16 shrink-0 border-b border-border bg-surface/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4 z-30">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/product/$id"
            params={{ id: product.id }}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:border-neon hover:text-neon transition shrink-0"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-display font-bold truncate">
              {product.name}
            </h1>
            <p className="text-[11px] text-muted-foreground">
              {formatINR(product.price)} ·{" "}
              {product.modelUrl ? "3D Foot Try-On" : "2D PNG Try-On"}
            </p>
          </div>
        </div>
      </header>

      {/* Full-viewport try-on canvas */}
      <main className="flex-1 relative">
        <FootTryOnViewer
          productName={product.name}
          modelUrl={product.modelUrl}
          modelRotation={product.modelRotation}
          accentColor={product.colors[0]?.hex}
        />
      </main>
    </div>
  );
}
