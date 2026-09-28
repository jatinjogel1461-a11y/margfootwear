import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { Instagram, Twitter, Facebook, Youtube } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-6 py-14 grid gap-10 md:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-4 text-sm text-muted-foreground max-w-xs">
            Engineered for athletes. Designed for the streets. Step into power.
          </p>
        </div>
        <div>
          <h4 className="text-xs tracking-[0.25em] text-muted-foreground mb-4">SHOP</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/men" className="hover:text-neon">Men</Link></li>
            <li><Link to="/women" className="hover:text-neon">Women</Link></li>
            <li><Link to="/kids" className="hover:text-neon">Kids</Link></li>
            <li><Link to="/new-arrivals" className="hover:text-neon">New Arrivals</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs tracking-[0.25em] text-muted-foreground mb-4">COMPANY</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/about" className="hover:text-neon">About</Link></li>
            <li><Link to="/contact" className="hover:text-neon">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs tracking-[0.25em] text-muted-foreground mb-4">CONNECT</h4>
          <div className="flex gap-4 text-muted-foreground">
            <a href="#" aria-label="Instagram" className="hover:text-neon transition-colors"><Instagram className="h-5 w-5" /></a>
            <a href="#" aria-label="Twitter" className="hover:text-neon transition-colors"><Twitter className="h-5 w-5" /></a>
            <a href="#" aria-label="Facebook" className="hover:text-neon transition-colors"><Facebook className="h-5 w-5" /></a>
            <a href="#" aria-label="YouTube" className="hover:text-neon transition-colors"><Youtube className="h-5 w-5" /></a>
          </div>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © Marg 2026 · Step Into Power
      </div>
    </footer>
  );
}
