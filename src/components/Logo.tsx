import { Link } from "@tanstack/react-router";

/**
 * LogoMark — standalone icon used for loaders or very small spaces.
 * It uses the full logo image scaled to fit.
 */
export function LogoMark({
  className = "h-6 w-6",
  glow = false,
}: {
  className?: string;
  glow?: boolean;
}) {
  return (
    <img 
      src="/images/logo.png" 
      alt="MARG Icon" 
      className={`${className} object-contain`}
      style={{
        ...(glow ? { filter: "drop-shadow(0 0 8px rgba(255,106,0,0.55))" } : {})
      }}
    />
  );
}

/**
 * Logo — full brand lockup.
 * Renders the logo.png image. On smaller screens, CSS ensures it stays readable.
 */
export function Logo({
  size = "md",
  glow = false,
}: {
  size?: "sm" | "md" | "lg";
  glow?: boolean;
}) {
  // Height scales for different navbar/footer placements
  // h-8 = 32px, h-10 = 40px
  const heightClass = size === "lg" ? "h-12 md:h-16" : size === "sm" ? "h-6 md:h-8" : "h-8 md:h-10";

  return (
    <Link to="/" className="flex items-center gap-2 group hover:opacity-90 transition-opacity">
      <img 
        src="/images/logo.png" 
        alt="MARG" 
        className={`${heightClass} w-auto object-contain transition-transform group-hover:scale-105`}
        style={{
          ...(glow ? { filter: "drop-shadow(0 0 10px rgba(255,106,0,0.4))" } : {})
        }}
      />
    </Link>
  );
}
