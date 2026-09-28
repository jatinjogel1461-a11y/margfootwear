import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuthStore } from "../lib/auth-store";
import { Logo } from "../components/Logo";
import { ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  phone: z.string().min(10, "Phone number must be valid.").optional().or(z.literal("")),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[0-9]/, "Password must contain at least one number.")
    .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character."),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

function SignupPage() {
  const router = useRouter();
  const signup = useAuthStore((state) => state.signup);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormValues) => {
    setIsSubmitting(true);
    
    const { data: signUpData, error } = await signup({
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: data.password,
    });

    if (error) {
      toast.error(error.message || "Failed to create account");
      setIsSubmitting(false);
      return;
    }

    if (signUpData?.session === null) {
      toast.success("Account created. Please check your email to confirm your account.");
    } else {
      toast.success("Account created successfully!");
    }
    
    setIsSubmitting(false);
    router.navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-neon/5 rounded-full blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
      
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

      <div className="flex-1 flex items-center justify-center p-4 relative z-10 py-12">
        <div className="w-full max-w-md bg-[#0e0e0d] border border-[#2a2a28] rounded-xl p-6 md:p-8 shadow-2xl">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-display font-semibold mb-2">Create Account</h1>
            <p className="text-sm text-muted-foreground">Join the next generation of footwear</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">Full Name</label>
              <input
                {...register("name")}
                type="text"
                placeholder="John Doe"
                className="w-full bg-[#141413] border border-[#2a2a28] rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon transition-all"
              />
              {errors.name && <p className="text-xs text-[#cc4444]">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">Email</label>
              <input
                {...register("email")}
                type="email"
                placeholder="you@example.com"
                className="w-full bg-[#141413] border border-[#2a2a28] rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon transition-all"
              />
              {errors.email && <p className="text-xs text-[#cc4444]">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">Phone Number (Optional)</label>
              <input
                {...register("phone")}
                type="tel"
                placeholder="+1 (555) 000-0000"
                className="w-full bg-[#141413] border border-[#2a2a28] rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon transition-all"
              />
              {errors.phone && <p className="text-xs text-[#cc4444]">{errors.phone.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">Password</label>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full bg-[#141413] border border-[#2a2a28] rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon transition-all pr-12"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-[#cc4444]">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">Confirm Password</label>
              <div className="relative">
                <input
                  {...register("confirmPassword")}
                  type={showConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full bg-[#141413] border border-[#2a2a28] rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon transition-all pr-12"
                />
                <button 
                  type="button" 
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-xs text-[#cc4444]">{errors.confirmPassword.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-neon text-neon-foreground font-medium py-3 rounded-md hover:bg-neon/90 transition-colors flex items-center justify-center mt-4"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "Create Account"}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-foreground font-medium hover:text-neon transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
