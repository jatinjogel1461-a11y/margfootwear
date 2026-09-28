import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Preloader() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Hide after 2.2 seconds to ensure content is loaded
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed inset-0 z-[99999] bg-[#050505] flex flex-col items-center justify-center pointer-events-none"
        >
          {/* 3D Scene */}
          <div className="relative w-32 h-32 perspective-600 flex items-center justify-center">
            
            {/* Outer Subtle Depth Layer */}
            <div className="absolute inset-0 flex items-center justify-center preserve-3d animate-spin-y-reverse opacity-30">
              <svg width="80" height="92" viewBox="0 0 80 92" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polygon points="40,2 78,24 78,68 40,90 2,68 2,24" stroke="#ff8a2e" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
            </div>

            {/* Main Primary Shape */}
            <div className="absolute inset-0 flex items-center justify-center preserve-3d animate-spin-y">
              <svg width="60" height="70" viewBox="0 0 80 92" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polygon points="40,2 78,24 78,68 40,90 2,68 2,24" stroke="#ff8a2e" strokeWidth="2" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          
          {/* Text and Dots */}
          <div className="mt-8 flex flex-col items-center gap-2">
            <span className="text-[#8a8a86] font-display font-medium text-[11px] uppercase tracking-[0.25em]">
              MARG
            </span>
            <div className="flex gap-1.5 mt-1">
              <div className="w-1 h-1 bg-[#8a8a86] rounded-full animate-pulse-dot" style={{ animationDelay: "0ms" }}></div>
              <div className="w-1 h-1 bg-[#8a8a86] rounded-full animate-pulse-dot" style={{ animationDelay: "200ms" }}></div>
              <div className="w-1 h-1 bg-[#8a8a86] rounded-full animate-pulse-dot" style={{ animationDelay: "400ms" }}></div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
