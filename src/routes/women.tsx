import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { CatalogPage, categoryFilter } from "@/components/CatalogPage";

export const Route = createFileRoute("/women")({
  head: () => ({ meta: [
    { title: "Women's Shoes — Marg" },
    { name: "description", content: "Shop Marg women's running, lifestyle, sports, and casual shoes." },
    { property: "og:title", content: "Women's Shoes — Marg" },
    { property: "og:description", content: "Shop Marg women's running, lifestyle, sports, and casual shoes." },
  ] }),
  component: () => (
    <PageShell>
      <CatalogPage title="Women" subtitle="Engineered for power. Tuned for grace." filterFn={categoryFilter("women")} />
    </PageShell>
  ),
});
