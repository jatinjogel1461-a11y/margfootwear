import { createFileRoute, Link, Outlet, redirect, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  Settings,
  Menu,
  X,
  ArrowLeft,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { getAdminSession } from "@/lib/adminSession.fn";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const session = await getAdminSession();
    if (!session.authenticated) {
      throw redirect({ to: "/admin-login" });
    }
    return { adminId: session.adminId };
  },
  head: () => ({
    meta: [{ title: "Admin Dashboard — Marg" }],
  }),
  component: AdminLayout,
});

const SIDEBAR_ITEMS = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/users", label: "Users", icon: Users, exact: false },
  { to: "/admin/content", label: "Content", icon: FileText, exact: false },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3, exact: false },
  { to: "/admin/settings", label: "Settings", icon: Settings, exact: false },
] as const;

function AdminLayout() {
  const router = useRouter();
  const { adminId } = Route.useRouteContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      toast.success("Signed out of Admin Dashboard");
      await router.navigate({ to: "/admin-login" });
    } catch {
      toast.error("Failed to sign out");
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/95 backdrop-blur-md px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-neon/15 border border-neon/40 text-neon">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <span className="font-display font-bold tracking-tight">Marg Admin</span>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen((v) => !v)}
          aria-label={mobileMenuOpen ? "Close admin menu" : "Open admin menu"}
          aria-expanded={mobileMenuOpen}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface text-foreground hover:border-neon transition"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-surface px-4 py-3 space-y-1">
          <nav aria-label="Mobile admin navigation" className="flex flex-col gap-1">
            {SIDEBAR_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                activeOptions={{ exact: item.exact }}
                activeProps={{
                  className: "bg-neon/15 text-neon border-neon/40 font-semibold",
                }}
                className="flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-background/60 transition"
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
          <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-neon transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Storefront
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-1.5 px-3 py-2 text-xs text-destructive hover:opacity-80 transition disabled:opacity-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              Log Out
            </button>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-shrink-0 flex-col border-r border-border bg-surface/60 sticky top-0 h-screen">
        <div className="p-5 border-b border-border flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-neon/15 border border-neon/40 text-neon">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="font-display font-bold leading-none">Marg Admin</p>
            <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground truncate">
              {adminId || "Control Panel"}
            </p>
          </div>
        </div>

        <nav aria-label="Admin navigation" className="flex-1 p-3 space-y-1 overflow-y-auto">
          {SIDEBAR_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.exact }}
              activeProps={{
                className:
                  "bg-neon/15 text-neon border-neon/40 font-semibold shadow-[0_0_14px_rgba(255,106,0,0.12)]",
              }}
              className="flex items-center gap-3 rounded-xl border border-transparent px-3.5 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-background/60 transition"
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-border space-y-3">
          <div className="rounded-lg border border-border bg-background/60 px-3 py-2 text-[11px] text-muted-foreground">
            Frontend UI shell · Backend integration pending
          </div>
          <div className="flex items-center justify-between gap-2">
            <Link
              to="/"
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-neon transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Storefront
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              aria-label="Log out of admin dashboard"
              className="inline-flex items-center gap-1.5 text-xs text-destructive hover:opacity-80 transition disabled:opacity-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              Log Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
        <Outlet />
      </main>
    </div>
  );
}
