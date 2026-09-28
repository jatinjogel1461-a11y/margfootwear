import { Link, useMatchRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Logo } from "./Logo";
import { useCart, selectCount } from "@/lib/cart-store";
import { useAuthStore } from "@/lib/auth-store";
import { useWishlist } from "@/lib/wishlist-store";
import { supabase } from "@/lib/supabaseClient";
import { ShoppingBag, Search, Menu, X, User, Heart, Sun, Moon } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "./ThemeProvider";

const links = [
  { to: "/", label: "Home" },
  { to: "/men", label: "Men" },
  { to: "/women", label: "Women" },
  { to: "/kids", label: "Kids" },
  { to: "/new-arrivals", label: "New Arrivals" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function Navbar() {
  const count = useCart((s) => selectCount(s.items));
  const openCart = useCart((s) => s.open);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const matchRoute = useMatchRoute();
  const wishlistCount = useWishlist((s) => s.wishlistIds.length);
  const loadWishlist = useWishlist((s) => s.load);
  const { theme, setTheme } = useTheme();

  const [sessionUser, setSessionUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessionUser(session?.user ?? null);
      if (session?.user?.id) loadWishlist(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionUser(session?.user ?? null);
      if (session?.user?.id) {
        loadWishlist(session.user.id);
      } else {
        useWishlist.getState().load(""); // clear
      }
    });

    return () => subscription.unsubscribe();
  }, [loadWishlist]);

  const getInitial = () => {
    if (sessionUser) {
      const name = sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name;
      if (name) return name.charAt(0).toUpperCase();
      if (sessionUser.email) return sessionUser.email.charAt(0).toUpperCase();
    }
    const mockUser = useAuthStore.getState().user;
    if (mockUser) {
      if (mockUser.name) return mockUser.name.charAt(0).toUpperCase();
      if (mockUser.email) return mockUser.email.charAt(0).toUpperCase();
    }
    return "U";
  };

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <header 
      className="fixed top-4 left-4 right-4 max-w-7xl mx-auto rounded-full z-50 bg-background/80 dark:bg-black/50 backdrop-blur-xl shadow-lg dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] px-6 py-2 border border-border transition-all duration-300 ease-out"
    >
      <div className="flex items-center justify-between">
        <Logo glow size="lg" />
        <nav className="hidden lg:flex items-center gap-1">
          {links.map((l) => {
            const isActive = matchRoute({ to: l.to, fuzzy: l.to !== "/" });
            return (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => {
                  if (window.location.pathname === l.to) {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
              >
                <span className={`text-sm tracking-wide block transition-all duration-300 ${isActive ? "bg-orange-500 text-black rounded-full px-4 py-1.5 font-medium shadow-[0_0_12px_rgba(249,115,22,0.5)]" : "px-4 py-1.5 rounded-full text-gray-400 hover:bg-black/10 dark:hover:bg-white/10 hover:text-white"}`}>
                  {l.label}
                </span>
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-1">
          <button
            aria-label="Search"
            onClick={() => setSearchOpen((s) => !s)}
            className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ${searchOpen ? 'bg-neon text-neon-foreground shadow-[0_4px_12px_rgba(255,106,0,0.3)]' : 'text-muted-foreground hover:bg-black/10 dark:hover:bg-white/10 hover:text-foreground'}`}
          >
            <Search className="h-4 w-4" />
          </button>
          <Link
            to="/wishlist"
            aria-label="Wishlist"
            className="relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 text-muted-foreground hover:bg-black/10 dark:hover:bg-white/10 hover:text-foreground"
            activeProps={{ className: "!bg-neon !text-neon-foreground shadow-[0_4px_12px_rgba(255,106,0,0.3)]" }}
          >
            <Heart className="h-4 w-4" />
            {wishlistCount > 0 && (
              <span className="absolute top-0 right-0 h-4 min-w-[16px] px-1 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                {wishlistCount}
              </span>
            )}
          </Link>
          <button
            aria-label="Cart"
            onClick={openCart}
            className="relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 text-muted-foreground hover:bg-black/10 dark:hover:bg-white/10 hover:text-foreground"
          >
            <ShoppingBag className="h-4 w-4" />
            {count > 0 && (
              <span className="absolute top-0 right-0 h-4 min-w-[16px] px-1 rounded-full bg-neon text-neon-foreground text-[10px] font-bold flex items-center justify-center shadow-sm">
                {count}
              </span>
            )}
          </button>
          <button
            aria-label="Toggle theme"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 text-muted-foreground hover:bg-black/10 dark:hover:bg-white/10 hover:text-foreground"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Link
            to={sessionUser || isAuthenticated ? "/profile" : "/login"}
            aria-label="Profile"
            className="flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 text-muted-foreground hover:bg-black/10 dark:hover:bg-white/10 hover:text-foreground"
            activeProps={{ className: "!bg-neon !text-neon-foreground shadow-[0_4px_12px_rgba(255,106,0,0.3)]" }}
          >
            {(sessionUser || isAuthenticated) ? (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-neon text-neon-foreground text-xs font-bold">
                {getInitial()}
              </div>
            ) : (
              <User className="h-4 w-4" />
            )}
          </Link>
          <button
            aria-label="Menu"
            onClick={() => setMobileOpen(true)}
            className="lg:hidden flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 text-muted-foreground hover:bg-black/10 dark:hover:bg-white/10 hover:text-foreground ml-1"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border bg-background/90 dark:bg-black/40 backdrop-blur-md rounded-b-3xl -mt-6 pt-6"
          >
            <SearchBar onClose={() => setSearchOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed inset-0 w-full h-[100dvh] bg-background z-[9999] p-6 flex flex-col overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-5 border-b border-border">
              <Logo size="sm" />
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full hover:bg-secondary hover:text-neon hover:scale-110 transition-all duration-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <nav className="flex flex-col mt-4 flex-1">
              {links.map((l, i) => {
                const isPrimary = ["Home", "Men", "Women", "Kids", "New Arrivals"].includes(l.label);
                return (
                  <motion.div
                    key={l.to}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 + 0.1, ease: "easeOut" }}
                    className="border-b border-border/50 last:border-0"
                  >
                    <Link
                      to={l.to}
                      onClick={() => {
                        setMobileOpen(false);
                        if (window.location.pathname === l.to) {
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }
                      }}
                      className={`block w-full transition-all duration-300 border-l-[3px] border-transparent hover:border-neon hover:text-neon pl-4 ${
                        isPrimary ? "py-5 text-3xl font-display font-bold" : "py-4 text-xl text-muted-foreground"
                      }`}
                      activeProps={{ className: "text-neon border-neon" }}
                    >
                      {l.label}
                    </Link>
                  </motion.div>
                );
              })}
              
              {/* Mobile Profile Link */}
              <motion.div
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: links.length * 0.05 + 0.1, ease: "easeOut" }}
                className="border-b border-white/5 mt-4"
              >
                <Link
                  to={isAuthenticated ? "/profile" : "/login"}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 w-full transition-all duration-300 border-l-[3px] border-transparent hover:border-neon hover:text-neon pl-4 py-4 text-xl text-muted-foreground"
                  activeProps={{ className: "text-neon border-neon" }}
                >
                  <User className="w-5 h-5" />
                  {isAuthenticated ? "My Account" : "Sign In"}
                </Link>
              </motion.div>
            </nav>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="mt-6 pt-6 border-t border-border mb-4"
            >
              <Link
                to="/new-arrivals"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center w-full bg-neon text-neon-foreground font-semibold py-4 rounded-full text-lg hover:animate-glow-pulse transition-all shadow-[0_0_15px_rgba(255,106,0,0.2)]"
              >
                Shop Now
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

import { products } from "@/lib/products";
import { useNavigate } from "@tanstack/react-router";

function SearchBar({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState("");
  const nav = useNavigate();
  const results = q.length >= 1
    ? products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()) || p.sub.toLowerCase().includes(q.toLowerCase())).slice(0, 6)
    : [];
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4">
      <input
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search Marg…"
        className="w-full bg-transparent border-b border-border py-2 text-sm focus:outline-none focus:border-neon"
      />
      {results.length > 0 && (
        <ul className="mt-3 grid gap-1">
          {results.map((p) => (
            <li key={p.id}>
              <button
                onClick={() => { nav({ to: "/product/$id", params: { id: p.id } }); onClose(); }}
                className="w-full text-left px-3 py-3 min-h-[44px] items-center rounded hover:bg-secondary text-sm flex justify-between"
              >
                <span>{p.name}</span>
                <span className="text-muted-foreground">{p.sub}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
