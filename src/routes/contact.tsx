import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { motion } from "framer-motion";
import { Mail, MapPin, Phone, Instagram, Twitter, Youtube } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [
    { title: "Contact — Marg" },
    { name: "description", content: "Get in touch with Marg. We're here to help." },
    { property: "og:title", content: "Contact Marg" },
    { property: "og:description", content: "Get in touch with Marg. We're here to help." },
  ] }),
  component: Contact,
});

function Contact() {
  const [sent, setSent] = useState(false);
  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-xs tracking-[0.35em] text-neon">CONTACT</p>
          <h1 className="mt-2 text-5xl md:text-7xl font-display font-bold tracking-tight">Talk to us.</h1>
          <p className="mt-4 text-muted-foreground max-w-xl">Questions about sizing, orders, or partnerships? We respond within one business day.</p>
        </motion.div>

        <div className="mt-12 grid lg:grid-cols-2 gap-10">
          <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="space-y-4">
            <Field label="Name" required />
            <Field label="Email" type="email" required />
            <Field label="Subject" />
            <div>
              <span className="text-xs tracking-widest text-muted-foreground">MESSAGE</span>
              <textarea required rows={5} className="mt-1 w-full bg-transparent border border-border rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-neon" />
            </div>
            <button className="bg-neon text-neon-foreground font-semibold px-7 py-3 rounded-full">
              {sent ? "Sent ✓" : "Send message"}
            </button>
          </form>

          <div className="space-y-6">
            <InfoBlock icon={MapPin} title="Flagship Store">
              42 Brigade Road,<br /> Bangalore 560001, India
              <div className="mt-4 aspect-video rounded-xl bg-gradient-to-br from-secondary to-surface border border-border flex items-center justify-center text-sm text-muted-foreground">
                Store locator — map placeholder
              </div>
            </InfoBlock>
            <InfoBlock icon={Mail} title="Email">
              <a href="mailto:jatinjogel1465@gmail.com" className="hover:text-neon transition-colors">
                jatinjogel1465@gmail.com
              </a>
            </InfoBlock>
            <InfoBlock icon={Phone} title="Phone">
              <a href="tel:+918200865586" className="hover:text-neon transition-colors">
                +91 82008 65586
              </a>
            </InfoBlock>
            <div>
              <h4 className="text-xs tracking-[0.25em] text-muted-foreground mb-3">FOLLOW</h4>
              <div className="flex gap-3">
                <a href="#" aria-label="Instagram" className="p-3 border border-border rounded-full hover:border-neon hover:text-neon transition"><Instagram className="h-4 w-4" /></a>
                <a href="#" aria-label="Twitter" className="p-3 border border-border rounded-full hover:border-neon hover:text-neon transition"><Twitter className="h-4 w-4" /></a>
                <a href="#" aria-label="YouTube" className="p-3 border border-border rounded-full hover:border-neon hover:text-neon transition"><Youtube className="h-4 w-4" /></a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-xs tracking-widest text-muted-foreground">{label.toUpperCase()}</span>
      <input {...props} className="mt-1 w-full bg-transparent border border-border rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-neon" />
    </label>
  );
}

function InfoBlock({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <div className="border border-border rounded-2xl p-5 bg-surface">
      <div className="flex items-center gap-2 text-neon"><Icon className="h-4 w-4" /><h4 className="text-sm tracking-wider">{title}</h4></div>
      <div className="mt-2 text-sm text-muted-foreground">{children}</div>
    </div>
  );
}
