import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { useState, useId } from "react";
import { ShieldCheck, Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { getAdminSession } from "@/lib/adminSession.fn";

export const Route = createFileRoute("/admin-login")({
  beforeLoad: async () => {
    const session = await getAdminSession();
    if (session.authenticated) {
      throw redirect({ to: "/admin" });
    }
  },
  head: () => ({
    meta: [{ title: "Admin Sign In — Marg" }],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const router = useRouter();
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const idInputId = useId();
  const pwInputId = useId();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!adminId.trim() || !password) {
      setErrorMsg("Admin ID and password are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: adminId.trim(), password }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setErrorMsg(data?.error || "Invalid credentials");
        setIsSubmitting(false);
        return;
      }

      toast.success("Signed in to Admin Dashboard");
      await router.navigate({ to: "/admin" });
    } catch {
      setErrorMsg("Unable to reach authentication service. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-neon transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Storefront
        </Link>

        <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-neon/15 border border-neon/40 text-neon">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-xl font-display font-bold">Admin Sign In</h1>
              <p className="text-xs text-muted-foreground">
                Authorized administrator access only
              </p>
            </div>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="rounded-lg border border-destructive/40 bg-destructive/10 px-3.5 py-2.5 text-xs text-destructive"
            >
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor={idInputId}
                className="block text-xs uppercase tracking-wider text-muted-foreground"
              >
                Admin ID
              </label>
              <input
                id={idInputId}
                type="text"
                autoComplete="username"
                required
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                placeholder="Enter Admin ID"
                className="w-full min-h-[44px] rounded-lg border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:outline-none focus:border-neon"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor={pwInputId}
                className="block text-xs uppercase tracking-wider text-muted-foreground"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id={pwInputId}
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full min-h-[44px] rounded-lg border border-border bg-background pl-3.5 pr-10 py-2 text-sm text-foreground focus:outline-none focus:border-neon"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[44px] rounded-full bg-neon text-neon-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
