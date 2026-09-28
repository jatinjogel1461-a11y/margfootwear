import { lazy, Suspense, useRef, useState, useEffect } from "react";
import { useInView } from "framer-motion";
import { LogoMark } from "./Logo";
import { getShoeVariant } from "../lib/shoeModels";

// Lazy load the heavy Three.js viewer component
const Shoe3DViewer = lazy(() => import("./Shoe3DViewer"));

function Loader() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
      <LogoMark className="h-10 w-10 animate-spin-slow" glow />
      <div className="text-xs tracking-[0.3em] text-muted-foreground whitespace-nowrap">
        LOADING 3D...
      </div>
    </div>
  );
}

export function Shoe3D({
  color = "#ff6a00",
  slug,
  className = "",
  interactive = true,
  showAutoRotateToggle = false,
  enableZoom = true,
  unmountOutOfView = false,
  fallbackNode,
}: {
  color?: string;
  slug?: string;
  className?: string;
  interactive?: boolean;
  showAutoRotateToggle?: boolean;
  enableZoom?: boolean;
  unmountOutOfView?: boolean;
  fallbackNode?: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Only render or animate when the shoe is within 200px of the viewport
  const isInView = useInView(ref, { margin: "200px" });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { model: modelUrl, variant } = getShoeVariant(slug);
  const shouldRender = mounted && (!unmountOutOfView || isInView);

  return (
    <div ref={ref} className={`relative w-full h-full ${className}`}>
      {shouldRender ? (
        <Suspense fallback={fallbackNode || <Loader />}>
          <Shoe3DViewer
            color={color}
            interactive={interactive}
            showAutoRotateToggle={showAutoRotateToggle}
            inView={isInView}
            enableZoom={enableZoom}
            modelUrl={modelUrl}
            variant={variant}
          />
        </Suspense>
      ) : (
        mounted && unmountOutOfView ? (fallbackNode || <Loader />) : null
      )}
    </div>
  );
}
