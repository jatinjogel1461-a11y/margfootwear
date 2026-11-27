import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuthStore } from "../lib/auth-store";
import { Logo } from "../components/Logo";
import { ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoaded = useAuthStore((state) => state.isLoaded);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Redirect away if already logged in
  useEffect(() => {
    if (isLoaded && isAuthenticated) {
      const redirectParam = new URLSearchParams(window.location.search).get("redirect");
      let target = "/";
      if (redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("//")) {
        target = redirectParam;
      }
      router.navigate({ to: target as any });
    }
  }, [isLoaded, isAuthenticated, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      const { error } = await login({
        email: data.email,
        password: data.password,
      });

      if (error) {
        let errorMsg = error.message;
        if (errorMsg.includes("Email not confirmed")) {
          errorMsg = "Please confirm your email address before logging in.";
        } else if (errorMsg.includes("Invalid login credentials")) {
          errorMsg = "Invalid email or password. Please try again.";
        }
        console.error("Login error:", error);
        toast.error(errorMsg || "Failed to log in");
        return;
      }

      toast.success("Logged in successfully");

      let target = "/";
      const redirectParam = new URLSearchParams(window.location.search).get("redirect");
      if (redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("//")) {
        target = redirectParam;
      }
      router.navigate({ to: target as any });
    } catch (err) {
      console.error("Login error:", err);
      toast.error(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-neon/5 rounded-full blur-[120px] pointer-events-none translate-x-1/2 -translate-y-1/2"></div>
      
      <div className="p-6 md:p-8 flex items-center justify-between relative z-10">
        <button 
          onClick={() => router.history.back()}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-surface border border-border text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <Logo size="sm" />
        <div className="w-10"></div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md bg-[#0e0e0d] border border-[#2a2a28] rounded-xl p-6 md:p-8 shadow-2xl">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-display font-semibold mb-2 text-white">Welcome Back</h1>
            <p className="text-sm text-white/70">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-widest text-white/60 font-medium">Email</label>
              <input
                {...register("email")}
                type="email"
                placeholder="you@example.com"
                className="w-full bg-white text-neutral-900 placeholder:text-neutral-500 border border-[#2a2a28] rounded-md px-4 py-3 text-sm focus:outline-none focus:border-[#ff6a00] focus:ring-1 focus:ring-[#ff6a00] transition-all"
              />
              {errors.email && <p className="text-xs text-[#f87171] mt-1">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] uppercase tracking-widest text-white/60 font-medium">Password</label>
                <Link to="/forgot-password" className="text-[11px] uppercase tracking-widest text-[#ff6a00] hover:text-[#ff8533] transition-colors">Forgot password?</Link>
              </div>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full bg-white text-neutral-900 placeholder:text-neutral-500 border border-[#2a2a28] rounded-md px-4 py-3 text-sm focus:outline-none focus:border-[#ff6a00] focus:ring-1 focus:ring-[#ff6a00] transition-all pr-12"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-900"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-[#f87171] mt-1">{errors.password.message}</p>}
            </div>
            
            <div className="flex items-center gap-2 pt-1">
              <input 
                type="checkbox" 
                id="remember" 
                {...register("rememberMe")}
                className="w-4 h-4 rounded-sm border border-white/40 ring-1 ring-white/40 bg-[#1a1a19] accent-[#ff6a00] cursor-pointer"
              />
              <label htmlFor="remember" className="text-sm text-white/70 cursor-pointer">Remember me for 30 days</label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#ff6a00] text-black font-medium py-3 rounded-md hover:bg-[#ff6a00]/90 transition-colors flex items-center justify-center mt-2"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "Sign In"}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-white/70">
            Don't have an account?{" "}
            <Link to="/signup" className="text-[#ff6a00] font-medium hover:text-[#ff8533] transition-colors">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
