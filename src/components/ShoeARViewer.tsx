import { useEffect, useState, type DetailedHTMLProps, type HTMLAttributes } from "react";
import { Box } from "lucide-react";

type ModelViewerAttributes = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
  src?: string;
  "ios-src"?: string;
  poster?: string;
  alt?: string;
  ar?: boolean;
  "ar-modes"?: string;
  "ar-scale"?: string;
  "camera-controls"?: boolean;
  "auto-rotate"?: boolean;
  "shadow-intensity"?: string;
};

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": ModelViewerAttributes;
    }
  }
}

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": ModelViewerAttributes;
    }
  }
}

export interface ShoeARViewerProps {
  modelUrl?: string;
  iosModelUrl?: string;
  posterUrl?: string;
  alt: string;
  className?: string;
}

export function ShoeARViewer({
  modelUrl,
  iosModelUrl,
  posterUrl = "/models/sneaker/thumbnail.webp",
  alt,
  className = "",
}: ShoeARViewerProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!modelUrl) return;
    let mounted = true;
    import("@google/model-viewer")
      .then(() => {
        if (mounted) setReady(true);
      })
      .catch(() => {
        // Fallback image stays visible if model-viewer fails to load
      });
    return () => {
      mounted = false;
    };
  }, [modelUrl]);

  // No modelUrl: hide AR button and render normal image
  if (!modelUrl || !ready) {
    return (
      <div className={`relative w-full h-full flex items-center justify-center ${className}`}>
        <img
          src={posterUrl}
          alt={alt}
          className="w-full h-full object-contain p-6"
        />
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      <model-viewer
        src={modelUrl}
        ios-src={iosModelUrl}
        poster={posterUrl}
        alt={alt}
        ar
        ar-modes="webxr scene-viewer quick-look"
        camera-controls
        auto-rotate
        shadow-intensity="1"
        ar-scale="fixed"
        style={{ width: "100%", height: "100%", backgroundColor: "transparent" }}
      >
        <button
          slot="ar-button"
          type="button"
          className="absolute bottom-3 left-3 z-10 inline-flex items-center gap-2 rounded-full bg-neon text-neon-foreground font-semibold px-4 py-2 text-xs tracking-wider shadow-[0_0_18px_rgba(255,106,0,0.35)] hover:opacity-90 transition cursor-pointer"
        >
          <Box className="h-3.5 w-3.5" />
          View in your space
        </button>
      </model-viewer>
    </div>
  );
}
