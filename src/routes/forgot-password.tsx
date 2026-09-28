import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Logo } from "../components/Logo";
import { ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

const forgotSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
});

type ForgotFormValues = z.infer<typeof forgotSchema>;

function ForgotPasswordPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotFormValues) => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsSubmitting(false);
    setIsSent(true);
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
          
          {!isSent ? (
            <>
              <div className="mb-8 text-center">
                <h1 className="text-2xl font-display font-semibold mb-2">Reset Password</h1>
                <p className="text-sm text-muted-foreground">Enter your email and we'll send you a reset link.</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">Email</label>
                  <input
                    {...register("email")}
                    type="email"
                    placeholder="you@example.com"
                    className="w-full bg-[#141413] border border-[#2a2a28] rounded-md px-4 py-3 text-sm focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon transition-all"
                  />
                  {errors.email && <p className="text-xs text-[#cc4444] mt-1">{errors.email.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-neon text-neon-foreground font-medium py-3 rounded-md hover:bg-neon/90 transition-colors flex items-center justify-center mt-2"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "Send Reset Link"}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-neon/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-neon" />
              </div>
              <h2 className="text-2xl font-display font-semibold mb-3">Check Your Email</h2>
              <p className="text-sm text-muted-foreground mb-8">
                We've sent a password reset link to your email address. Please check your inbox.
              </p>
              <button
                onClick={() => router.navigate({ to: "/login" })}
                className="text-neon hover:underline font-medium text-sm"
              >
                Return to Login
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
