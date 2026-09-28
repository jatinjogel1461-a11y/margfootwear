import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { Shoe3D } from "@/components/Shoe3D";
import { ProductCard } from "@/components/ProductCard";
import { products, formatINR } from "@/lib/products";
import { motion } from "framer-motion";
import { ArrowRight, Truck, Shield, Recycle, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Marg Footwear — Step Into Power" },
      { name: "description", content: "Premium footwear with a fully interactive 3D shopping experience." },
      { property: "og:title", content: "Marg Footwear — Step Into Power" },
      { property: "og:description", content: "Premium footwear with a fully interactive 3D shopping experience." },
    ],
  }),
  component: Home,
});

function Home() {
  const newArrivals = products.filter((p) => p.isNew).slice(0, 4);
  const featured = products.slice(0, 6);

  return (
    <PageShell>
      {/* Hero */}
      <section className="relative min-h-[92vh]">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          {/* Hero Premium Glow */}
          <div 
            className="absolute inset-0" 
            style={{ 
              background: "radial-gradient(ellipse at top right, rgba(40,20,10,0.4) 0%, transparent 60%)" 
            }} 
          />
          
          {/* Animated Tech Grid */}
          <motion.div 
            animate={{ y: [0, 40] }}
            transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
            className="absolute inset-0 -top-[40px] opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: "linear-gradient(rgba(255, 255, 255, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.2) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
              maskImage: "linear-gradient(to bottom, black 40%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, black 40%, transparent 100%)",
            }}
          />

          {/* Vignette */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.8) 100%)" }} />

          {/* Bottom fade to match next section */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 pointer-events-none" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 grid lg:grid-cols-2 gap-6 md:gap-10 items-center min-h-[92vh] py-12 md:py-16">
          <div>
            <motion.span
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="inline-block text-xs tracking-[0.35em] text-neon"
            >
              FW26 · DROP 01
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7 }}
              className="mt-3 text-5xl md:text-6xl lg:text-7xl font-display font-bold tracking-tighter leading-tight pb-2 text-gradient-neon"
            >
              Marg Footwear
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.7 }}
              className="mt-4 text-xl md:text-2xl text-muted-foreground"
            >
              Step Into Power.
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
              className="mt-6 max-w-md text-muted-foreground"
            >
              The next generation of performance footwear. Engineered with carbon-plated speed and street-ready design.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
              className="mt-8 flex flex-wrap gap-3"
            >
              <Link
                to="/new-arrivals"
                className="group inline-flex items-center gap-2 bg-neon text-neon-foreground font-semibold px-7 py-3.5 rounded-full hover:animate-glow-pulse transition"
              >
                Shop Now <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" />
              </Link>
              <Link to="/men" className="inline-flex items-center gap-2 border border-border px-7 py-3.5 rounded-full hover:border-foreground transition">
                Explore Collection
              </Link>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, duration: 0.8 }}
            className="relative h-[320px] md:h-[420px] lg:h-[560px]"
          >
            {/* Ambient Glow Behind Shoe */}
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] -z-10 rounded-full pointer-events-none" 
              style={{ 
                background: "radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 70%)",
                filter: "blur(80px)"
              }} 
            />
            
            <Shoe3D color="#ff6a00" slug="sv-velocity-x" enableZoom={false} />
            <p className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.3em] text-muted-foreground">DRAG TO ROTATE</p>
          </motion.div>
        </div>
      </section>

      {/* Trending Now */}
      <section className="bg-foreground/[0.02] border-y border-border/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 md:py-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-10 gap-4">
          <SectionHeader eyebrow="HOT RIGHT NOW" title="Trending Now" inline />
          <Link to="/new-arrivals" className="hidden md:flex text-sm font-medium text-muted-foreground hover:text-neon items-center gap-1.5 transition-colors">
            Shop All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        
        {/* Mobile: Horizontal scroll, Desktop: Grid */}
        <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-6 md:pb-0 md:grid md:grid-cols-4 md:gap-5 -mx-4 px-4 sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {newArrivals.map((p, i) => (
            <div key={p.id} className="w-[65vw] sm:w-[280px] md:w-auto shrink-0 snap-start">
              <ProductCard product={p} index={i} />
            </div>
          ))}
        </div>
        
          <div className="mt-4 flex justify-center md:hidden">
            <Link to="/new-arrivals" className="inline-flex w-full justify-center items-center gap-2 border border-border px-7 py-3.5 rounded-full hover:border-foreground transition-colors font-medium">
              Shop All
            </Link>
          </div>
        </div>
      </section>

      {/* Brand highlights */}
      <section className="relative mx-auto max-w-7xl px-4 sm:px-6 py-10 md:py-16 overflow-hidden">
        {/* Section Ambient Glow */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[800px] h-[600px] -z-10 rounded-full pointer-events-none opacity-50" style={{ background: "radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 60%)", filter: "blur(100px)" }} />
        
        <SectionHeader eyebrow="WHY MARG FOOTWEAR" title="Crafted without compromise." />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-8 md:mt-10">
          {[
            { icon: Sparkles, t: "Carbon-Plated Speed", d: "Race-day performance in every silhouette." },
            { icon: Truck, t: "Free Delivery", d: "Free shipping across India on orders over ₹5,000." },
            { icon: Shield, t: "2-Year Warranty", d: "Premium materials, built to outlast." },
            { icon: Recycle, t: "Made Responsibly", d: "Recycled foams and traceable supply chain." },
          ].map((f, i) => (
            <motion.div
              key={f.t}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="border border-border rounded-2xl p-6 hover:border-neon transition"
            >
              <f.icon className="h-6 w-6 text-neon" />
              <h4 className="mt-4 font-semibold">{f.t}</h4>
              <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-10 md:py-16">
        <SectionHeader eyebrow="FEATURED" title="Most loved this season." />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-8 md:mt-10">
          {featured.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative bg-foreground/[0.02] border-y border-border/50 overflow-hidden">
        {/* Section Ambient Glow */}
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[800px] h-[800px] -z-10 rounded-full pointer-events-none opacity-40" style={{ background: "radial-gradient(circle, rgba(249,115,22,0.1) 0%, transparent 60%)", filter: "blur(100px)" }} />
        {/* Vignette for Testimonials */}
        <div className="absolute inset-0 pointer-events-none -z-10" style={{ background: "radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.6) 100%)" }} />
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 md:py-24">
          <SectionHeader eyebrow="FROM THE COMMUNITY" title="Athletes choose Marg Footwear." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8 md:mt-10">
          {[
            { q: "The Velocity X cut my marathon PB by four minutes. Insane energy return.", a: "— Aarav K., Mumbai" },
            { q: "Best lifestyle shoe I own. The fit is incredible and the colors are next level.", a: "— Priya S., Bangalore" },
            { q: "Bought the Rocket Kids for my son. He refuses to wear anything else.", a: "— Raj M., Delhi" },
          ].map((t, i) => (
            <motion.blockquote
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="border border-border rounded-2xl p-6 bg-surface"
            >
              <p className="text-lg leading-relaxed">"{t.q}"</p>
              <footer className="mt-4 text-sm text-muted-foreground">{t.a}</footer>
            </motion.blockquote>
          ))}
        </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 py-10 md:py-16 pb-20 md:pb-24 text-center">
        <h2 className="text-3xl md:text-5xl font-display font-bold leading-tight pb-2">Join the Marg Footwear drop list.</h2>
        <p className="mt-3 text-muted-foreground">Early access to limited drops, exclusive colorways, and athlete stories.</p>
        <form onSubmit={(e) => e.preventDefault()} className="mt-7 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input type="email" placeholder="you@example.com" required className="flex-1 min-h-[48px] bg-surface border border-border rounded-full px-5 py-3 text-sm focus:outline-none focus:border-neon" />
          <button className="bg-neon text-neon-foreground font-semibold px-7 py-3 min-h-[48px] rounded-full">Sign Up · {formatINR(0).replace("₹0", "Free")}</button>
        </form>
      </section>
    </PageShell>
  );
}

function SectionHeader({ eyebrow, title, inline = false }: { eyebrow: string; title: string; inline?: boolean }) {
  return (
    <div className={inline ? "" : "text-center"}>
      <p className="text-xs tracking-[0.35em] text-neon leading-normal pb-1">{eyebrow}</p>
      <h2 className="mt-2 text-3xl md:text-5xl font-display font-bold tracking-tight leading-tight pb-2">{title}</h2>
    </div>
  );
}
