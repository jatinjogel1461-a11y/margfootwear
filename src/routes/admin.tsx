import { createFileRoute, Link, Outlet, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { LayoutDashboard, Package, ShoppingBag, ShieldAlert, Loader2, ArrowLeft } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { useIsAdmin } from "@/lib/admin";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Admin — Marg" }],
  }),
  component: AdminLayout,
});

const ADMIN_LINKS = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { to: "/admin/products", label: "Products", icon: Package },
] as const;

function AdminLayout() {
  const router = useRouter();
  const { user, isAuthenticated, isLoaded } = useAuthStore();
  const { data: isAdmin, isLoading: checkingAdmin, isError } = useIsAdmin(user?.id);

  useEffect(() => {
    if (isLoaded && !isAuthenticated) {
      router.navigate({ to: "/login", search: { redirect: "/admin" } });
    }
  }, [isLoaded, isAuthenticated, router]);

  if (!isLoaded || (isAuthenticated && checkingAdmin)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-neon" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (isError || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full rounded-2xl border border-border bg-surface p-8 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 border border-destructive/30 flex items-center justify-center text-destructive">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-display font-bold">Access denied</h1>
          <p className="text-sm text-muted-foreground">
            You do not have administrator permissions to view this page.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full bg-neon text-neon-foreground font-semibold px-5 py-2.5 text-sm hover:opacity-90 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to store
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full flex flex-col md:flex-row gap-8 items-start">
        {/* Mobile Navigation */}
        <div className="w-full md:hidden flex overflow-x-auto pb-1 border-b border-border sticky top-16 z-20 bg-background/90 backdrop-blur-md">
          {ADMIN_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground whitespace-nowrap border-b-2 border-transparent"
              activeProps={{ className: "text-foreground border-neon font-semibold" }}
              activeOptions={{ exact: "exact" in link ? link.exact : false }}
            >
              <link.icon size={16} />
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-60 flex-shrink-0 flex-col gap-4 sticky top-24">
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="text-[11px] uppercase tracking-[0.2em] text-neon font-semibold">
              Marg Admin
            </p>
            <p className="mt-1 text-xs text-muted-foreground truncate">{user.email}</p>
          </div>

          <nav className="flex flex-col gap-1" aria-label="Admin navigation">
            {ADMIN_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-muted-foreground hover:bg-surface hover:text-foreground transition-all group"
                activeProps={{ className: "bg-surface text-foreground font-medium border border-border" }}
                activeOptions={{ exact: "exact" in link ? link.exact : false }}
              >
                <link.icon size={18} className="group-hover:text-neon transition-colors" />
                {link.label}
              </Link>
            ))}
          </nav>

          <Link
            to="/"
            className="flex items-center gap-2 px-4 py-2.5 text-xs text-muted-foreground hover:text-neon transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to store
          </Link>
        </aside>

        {/* Main Content */}
        <main className="flex-1 w-full min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
