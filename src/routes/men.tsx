import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { CatalogPage, categoryFilter } from "@/components/CatalogPage";

export const Route = createFileRoute("/men")({
  head: () => ({ meta: [
    { title: "Men's Shoes — Marg" },
    { name: "description", content: "Shop Marg men's running, sports, casual, and training shoes." },
    { property: "og:title", content: "Men's Shoes — Marg" },
    { property: "og:description", content: "Shop Marg men's running, sports, casual, and training shoes." },
  ] }),
  component: () => (
    <PageShell>
      <CatalogPage title="Men" subtitle="Built to perform. Designed to dominate." filterFn={categoryFilter("men")} />
    </PageShell>
  ),
});
