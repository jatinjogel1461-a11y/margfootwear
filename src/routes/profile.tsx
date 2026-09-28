import { createFileRoute, Link, Outlet, useRouter } from "@tanstack/react-router";
import { useAuthStore } from "../lib/auth-store";
import { User, Package, Heart, MapPin, CreditCard, Settings, LogOut, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  component: ProfileLayout,
});

const NAV_LINKS = [
  { to: "/profile", label: "Overview", icon: User, exact: true },
  { to: "/profile/orders", label: "My Orders", icon: Package },
  { to: "/profile/wishlist", label: "Wishlist", icon: Heart },
  { to: "/profile/addresses", label: "Addresses", icon: MapPin },
  { to: "/profile/payment", label: "Payment Methods", icon: CreditCard },
  { to: "/profile/edit", label: "Settings", icon: Settings },
];

function ProfileLayout() {
  const router = useRouter();
  const { user, isAuthenticated, isLoaded, logout } = useAuthStore();

  useEffect(() => {
    if (isLoaded && !isAuthenticated) {
      router.navigate({ to: "/login" });
    }
  }, [isLoaded, isAuthenticated, router]);

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-neon" />
      </div>
    );
  }

  const initials = user.name.substring(0, 2).toUpperCase();
  const memberSinceYear = new Date(user.memberSince).getFullYear();

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to log out?")) {
      await logout();
      toast.success("Logged out successfully");
      router.navigate({ to: "/login" });
    }
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-12">
      <div className="max-w-[1000px] mx-auto px-4 md:px-6 w-full flex flex-col md:flex-row gap-8 items-start">
        
        {/* Mobile Navigation (Top Tabs) */}
        <div className="w-full md:hidden flex overflow-x-auto pb-2 scrollbar-hide border-b border-[#2a2a28] sticky top-16 z-20 bg-background/80 backdrop-blur-md">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground whitespace-nowrap transition-colors border-b-2 border-transparent"
              activeProps={{ className: "text-foreground border-neon font-semibold" }}
              activeOptions={{ exact: link.exact }}
            >
              <link.icon size={16} />
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-64 flex-shrink-0 flex-col gap-6 sticky top-24">
          
          {/* User Info Card */}
          <div className="bg-[#0e0e0d] border border-[#2a2a28] rounded-xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 flex-shrink-0 rounded-full bg-gradient-to-tr from-neon to-[#5e2b00] flex items-center justify-center text-sm font-bold shadow-[0_0_15px_rgba(255,138,46,0.2)]">
              {initials}
            </div>
            <div className="min-w-0">
              <h2 className="font-display font-semibold truncate">{user.name}</h2>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">Member since {memberSinceYear}</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-muted-foreground hover:bg-[#141413] hover:text-foreground transition-all group"
                activeProps={{ className: "bg-[#141413] text-foreground font-medium" }}
                activeOptions={{ exact: link.exact }}
              >
                <link.icon size={18} className="group-hover:text-neon transition-colors" />
                {link.label}
              </Link>
            ))}
          </nav>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 mt-4 text-sm text-[#cc4444] hover:bg-[#141413] rounded-lg transition-all text-left"
          >
            <LogOut size={18} />
            Log Out
          </button>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 w-full min-w-0">
          <Outlet />
        </main>

      </div>
    </div>
  );
}
