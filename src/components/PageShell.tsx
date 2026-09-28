import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { CartDrawer } from "./CartDrawer";
import { BackButton } from "./BackButton";

export function PageShell({ children, hideFooter = false }: { children: ReactNode; hideFooter?: boolean }) {
  return (
    <div className="min-h-screen flex flex-col text-foreground">
      <Navbar />
      <motion.main
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
        className="flex-1 pt-16"
      >
        <BackButton />
        {children}
      </motion.main>
      {!hideFooter && <Footer />}
      <CartDrawer />
    </div>
  );
}
