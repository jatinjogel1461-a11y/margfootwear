import { useRouter, useRouterState } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export function BackButton() {
  const router = useRouter();
  const state = useRouterState();
  
  if (state.location.pathname === "/") return null;

  const handleBack = () => {
    // Basic history length check to fallback to home if direct link
    if (window.history.length > 2) {
      router.history.back();
    } else {
      router.navigate({ to: "/" });
    }
  };

  const pathParts = state.location.pathname.split("/").filter(Boolean);
  const currentPath = pathParts[0] ? pathParts[0].charAt(0).toUpperCase() + pathParts[0].slice(1).replace("-", " ") : "";

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-6 pb-2">
      <button 
        onClick={handleBack}
        className="group inline-flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Go back"
      >
        <div className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-secondary/40 group-hover:bg-secondary transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </div>
        <div className="flex items-center gap-2 text-sm font-medium tracking-wide">
          <span className="text-muted-foreground/50 hover:text-foreground transition-colors">Home</span>
          <span className="text-muted-foreground/30">/</span>
          <span className="text-foreground">{currentPath}</span>
        </div>
      </button>
    </div>
  );
}
