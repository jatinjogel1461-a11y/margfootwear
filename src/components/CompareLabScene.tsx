import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import { LogoMark } from "./Logo";
import type { Product } from "../lib/products";
import type { ShoeDimensions } from "../lib/shoeDimensions";

const CompareLabViewer = lazy(() => import("./CompareLabViewer"));

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

class SceneErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-sm text-muted-foreground">
          Unable to load 3D comparison viewer on this device. Use the dimension table below to compare specs.
        </div>
      );
    }
    return this.props.children;
  }
}

export function CompareLabScene(props: {
  productA: Product;
  productB: Product;
  sizeA: number;
  sizeB: number;
  dimsA: ShoeDimensions;
  dimsB: ShoeDimensions;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative w-full h-full">
      {mounted ? (
        <SceneErrorBoundary>
          <Suspense fallback={<Loader />}>
            <CompareLabViewer {...props} />
          </Suspense>
        </SceneErrorBoundary>
      ) : (
        <Loader />
      )}
    </div>
  );
}
