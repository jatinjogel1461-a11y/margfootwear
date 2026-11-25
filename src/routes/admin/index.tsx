import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, Activity, BarChart3, ArrowUpRight, Info } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboardPage,
});

const OVERVIEW_CARDS = [
  {
    title: "Total Users",
    value: "—",
    subtitle: "Connect auth/users API to load count",
    icon: Users,
  },
  {
    title: "Recent Activity",
    value: "—",
    subtitle: "Events & audit log stream placeholder",
    icon: Activity,
  },
  {
    title: "Store Statistics",
    value: "—",
    subtitle: "Orders, conversion & revenue metrics",
    icon: BarChart3,
  },
] as const;

const QUICK_SECTIONS = [
  {
    to: "/admin/users",
    title: "Users",
    description: "Inspect user directory structure, roles, and account status.",
  },
  {
    to: "/admin/content",
    title: "Content",
    description: "Manage catalog entries, featured banners, and editorial blocks.",
  },
  {
    to: "/admin/analytics",
    title: "Analytics",
    description: "View traffic, engagement, and performance breakdown layouts.",
  },
  {
    to: "/admin/settings",
    title: "Settings",
    description: "Review store configuration, notifications, and access notes.",
  },
] as const;

function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-neon">Overview</p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-display font-bold">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Isolated administrative interface for Marg Footwear.
          </p>
        </div>
      </div>

      {/* Frontend-only Notice */}
      <div className="rounded-xl border border-neon/30 bg-neon/5 p-4 flex items-start gap-3 text-sm">
        <Info className="h-4 w-4 text-neon mt-0.5 flex-shrink-0" />
        <p className="text-muted-foreground">
          This is the frontend dashboard structure. Live metrics and management actions require
          connecting your backend endpoints and role-based access rules.
        </p>
      </div>

      {/* Overview Cards: Total Users, Activity, Statistics */}
      <section aria-label="Overview metrics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {OVERVIEW_CARDS.map((card) => (
          <div
            key={card.title}
            className="rounded-2xl border border-border bg-surface p-5 flex flex-col justify-between gap-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  {card.title}
                </p>
                <p className="mt-2 text-3xl font-display font-bold tabular-nums">{card.value}</p>
              </div>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-neon/10 border border-neon/30 text-neon">
                <card.icon className="h-5 w-5" />
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{card.subtitle}</p>
          </div>
        ))}
      </section>

      {/* Activity Placeholder + Quick Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 rounded-2xl border border-border bg-surface p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold">Activity Feed</h2>
            <span className="text-[11px] font-mono text-muted-foreground">No live feed connected</span>
          </div>
          <div className="rounded-xl border border-dashed border-border bg-background/40 p-8 text-center text-sm text-muted-foreground">
            Recent user signups, order events, and content updates will appear here once connected to
            your backend.
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5 space-y-3">
          <h2 className="font-display font-semibold">Sections</h2>
          <div className="space-y-2">
            {QUICK_SECTIONS.map((sec) => (
              <Link
                key={sec.to}
                to={sec.to}
                className="group block rounded-xl border border-border bg-background/50 p-3 hover:border-neon/60 transition"
              >
                <div className="flex items-center justify-between text-sm font-medium">
                  <span className="group-hover:text-neon transition-colors">{sec.title}</span>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-neon transition-colors" />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{sec.description}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
