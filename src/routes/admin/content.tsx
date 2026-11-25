import { createFileRoute } from "@tanstack/react-router";
import { FileText, Layers, Megaphone } from "lucide-react";

export const Route = createFileRoute("/admin/content")({
  component: AdminContentPage,
});

const CONTENT_SECTIONS = [
  {
    title: "Catalog Items",
    description: "Product titles, pricing, descriptions, and 3D model assignments.",
    icon: Layers,
  },
  {
    title: "Homepage & Hero",
    description: "Featured footwear highlights, seasonal drops, and promotional copy.",
    icon: FileText,
  },
  {
    title: "Announcements",
    description: "Storewide banners, shipping notices, and release alerts.",
    icon: Megaphone,
  },
] as const;

function AdminContentPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-neon">CMS</p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-display font-bold">Content</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Frontend structure for managing storefront content and catalog metadata.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {CONTENT_SECTIONS.map((sec) => (
          <div
            key={sec.title}
            className="rounded-2xl border border-border bg-surface p-5 flex flex-col justify-between gap-4"
          >
            <div className="space-y-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-neon/10 border border-neon/30 text-neon">
                <sec.icon className="h-4 w-4" />
              </span>
              <h2 className="font-display font-semibold">{sec.title}</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">{sec.description}</p>
            </div>
            <span className="text-[11px] font-mono text-muted-foreground">
              Awaiting backend integration
            </span>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-10 text-center space-y-2">
        <p className="text-sm font-medium">Content Editor Workspace</p>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          Create, edit, and publish controls will connect here once backend CRUD endpoints are wired.
        </p>
      </div>
    </div>
  );
}
