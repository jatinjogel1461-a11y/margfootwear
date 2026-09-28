import { Link } from "@tanstack/react-router";
import { formatINR, type Product } from "@/lib/products";
import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";
import { useWishlist } from "@/lib/wishlist-store";
import { useAuthStore } from "@/lib/auth-store";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { Shoe3D } from "./Shoe3D";

export function ProductCard({
  product,
  index = 0,
}: {
  product: Product;
  index?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const onMove = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ x: -y * 8, y: x * 8 });
  };
  const reset = () => setTilt({ x: 0, y: 0 });

  const router = useRouter();
  const { user } = useAuthStore();
  const { isWishlisted, toggle, pending } = useWishlist();
  const wishlisted = isWishlisted(product.id);
  const isPending = pending[product.id];

  const onWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error("Please log in to save items");
      router.navigate({ to: "/login", search: { redirect: window.location.pathname } });
      return;
    }
    toggle(product.id, user.id);
  };

  const c0 = product.colors[0]?.hex ?? "#ff6a00";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.04, 0.4) }}
    >
      <Link
        to="/product/$id"
        params={{ id: product.id }}
        className="block group"
      >
        <div
          ref={ref}
          onMouseMove={onMove}
          onMouseLeave={reset}
          style={{
            transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            transition: "transform 0.2s ease-out",
          }}
          className="relative aspect-square rounded-2xl overflow-hidden border border-border bg-surface"
        >
          {/* Gradient background behind the shoe */}
          <div
            className="absolute inset-0 opacity-90"
            style={{
              background: `radial-gradient(circle at 30% 30%, ${c0}33, transparent 60%), linear-gradient(135deg, #1a1a1a, #0a0a0a)`,
            }}
          />
          
          {/* 3D Model with static image fallback */}
          <div className="absolute inset-0 p-2 transition-transform duration-500 group-hover:scale-110">
            <Shoe3D
              slug={product.id}
              color={c0}
              interactive={false}
              showAutoRotateToggle={false}
              enableZoom={false}
              unmountOutOfView={true}
              fallbackNode={
                <div className="absolute inset-0 flex items-center justify-center p-6 pointer-events-none">
                  <img 
                    src="/models/sneaker/thumbnail.webp" 
                    alt={product.name}
                    loading="lazy"
                    className="w-full h-full object-contain drop-shadow-2xl"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = `<div class="w-full h-full opacity-20" style="background: ${c0}; mask: url('data:image/svg+xml;utf8,<svg viewBox=\\'0 0 100 100\\' xmlns=\\'http://www.w3.org/2000/svg\\'><path d=\\'M20,60 Q40,30 80,40 Q90,70 70,80 Q30,90 20,60\\' fill=\\'black\\'/></svg>') center/contain no-repeat; -webkit-mask: url('data:image/svg+xml;utf8,<svg viewBox=\\'0 0 100 100\\' xmlns=\\'http://www.w3.org/2000/svg\\'><path d=\\'M20,60 Q40,30 80,40 Q90,70 70,80 Q30,90 20,60\\' fill=\\'black\\'/></svg>') center/contain no-repeat;"></div>`;
                    }}
                  />
                </div>
              }
            />
          </div>
          {product.isNew && (
            <span className="absolute top-3 left-3 bg-neon text-neon-foreground text-[10px] tracking-widest font-bold px-2 py-1 rounded z-10">
              NEW
            </span>
          )}
          
          <button
            onClick={onWishlistClick}
            disabled={isPending}
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            className="absolute top-3 right-3 bg-background/50 backdrop-blur-sm border border-border p-2 rounded-full z-10 transition-all hover:bg-background group/btn"
          >
            <AnimatePresence>
              {wishlisted && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="absolute inset-0 border-2 border-neon rounded-full"
                />
              )}
            </AnimatePresence>
            <motion.div
              animate={wishlisted ? { scale: [1, 1.3, 0.9, 1] } : { scale: [1, 0.9, 1] }}
              transition={{ duration: 0.4 }}
            >
              <Heart 
                size={16} 
                className={`transition-all duration-300 ${wishlisted ? "fill-neon text-neon" : "text-muted-foreground group-hover/btn:text-foreground"}`} 
              />
            </motion.div>
          </button>
        </div>
        <div className="mt-3 flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {product.sub}
            </p>
            <h3 className="text-sm font-medium group-hover:text-neon transition">
              {product.name}
            </h3>
          </div>
          <span className="text-sm font-semibold">{formatINR(product.price)}</span>
        </div>
      </Link>
    </motion.div>
  );
}
