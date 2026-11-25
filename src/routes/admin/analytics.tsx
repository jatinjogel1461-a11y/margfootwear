import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, TrendingUp, ShoppingBag, Eye } from "lucide-react";

export const Route = createFileRoute("/admin/analytics")({
  component: AdminAnalyticsPage,
});

const METRICS = [
  { label: "Page Views", value: "—", icon: Eye },
  { label: "Conversion Rate", value: "—", icon: TrendingUp },
  { label: "Orders Volume", value: "—", icon: ShoppingBag },
] as const;

function AdminAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-neon">Insights</p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-display font-bold">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Store performance layout. Connect your analytics provider or database queries to populate charts.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {METRICS.map((m) => (
          <div
            key={m.label}
            className="rounded-2xl border border-border bg-surface p-5 flex items-center justify-between gap-3"
          >
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{m.label}</p>
              <p className="mt-2 text-2xl font-display font-bold tabular-nums">{m.value}</p>
            </div>
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-neon/10 border border-neon/30 text-neon">
              <m.icon className="h-4 w-4" />
            </span>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-surface p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold">Traffic &amp; Sales Chart</h2>
          <span className="text-xs font-mono text-muted-foreground">Last 30 days</span>
        </div>
        <div className="h-64 rounded-xl border border-dashed border-border bg-background/40 flex flex-col items-center justify-center gap-2 text-center px-4">
          <BarChart3 className="h-8 w-8 text-neon/70" />
          <p className="text-sm font-medium">Chart visualization placeholder</p>
          <p className="text-xs text-muted-foreground max-w-sm">
            No fabricated data is shown. Connect your backend metrics endpoint to render real time-series charts.
          </p>
        </div>
      </div>
    </div>
  );
}
