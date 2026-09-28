import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [
    { title: "The Marg Story — About" },
    { name: "description", content: "Born from a love of speed and craft. The Marg story." },
    { property: "og:title", content: "The Marg Story" },
    { property: "og:description", content: "Born from a love of speed and craft." },
  ] }),
  component: About,
});

function About() {
  return (
    <PageShell>
      <section className="relative">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_30%,rgba(255,106,0,0.2),transparent_60%)]" />
        <div className="mx-auto max-w-4xl px-6 py-24 text-center">
          <p className="text-xs tracking-[0.35em] text-neon">EST. 2026</p>
          <h1 className="mt-3 text-5xl md:text-7xl font-display font-bold tracking-tight">The Marg Story</h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            We don't make shoes. We engineer instruments of motion — built for the athletes, artists, and adventurers redefining what's possible.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid sm:grid-cols-3 gap-6">
          <Counter to={0} label="Founded" />
          <Counter to={0} label="Pro athletes" />
          <Counter to={0} label="Pairs shipped" />
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-12 space-y-12">
        {[
          { h: "The Spark", t: "Marg started in a garage in Bangalore with two pairs of running shoes, a 3D printer, and an obsession with cutting four minutes off a marathon time." },
          { h: "The Craft", t: "Every Marg shoe is engineered around three pillars: speed, durability, and aesthetic. Carbon-fiber plates, recycled superfoams, and obsessively-tuned outsoles." },
          { h: "The Movement", t: "From sub-3-hour marathoners to weekend warriors and kids racing across playgrounds — Marg is for everyone who refuses to stand still." },
        ].map((s, i) => (
          <motion.div key={s.h} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
            <h2 className="text-3xl font-display font-bold">{s.h}</h2>
            <p className="mt-3 text-lg text-muted-foreground leading-relaxed">{s.t}</p>
          </motion.div>
        ))}
      </section>
    </PageShell>
  );
}

function Counter({ to, suffix = "", label }: { to: number; suffix?: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView || to === 0) {
      setN(to);
      return;
    }
    const start = performance.now();
    const dur = 1400;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setN(Math.floor(p * to));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, to]);
  return (
    <div ref={ref} className="text-center border border-border rounded-2xl p-8">
      <div className="text-5xl font-display font-bold text-neon">{n}{suffix}</div>
      <div className="mt-2 text-xs tracking-[0.3em] text-muted-foreground">{label.toUpperCase()}</div>
    </div>
  );
}
