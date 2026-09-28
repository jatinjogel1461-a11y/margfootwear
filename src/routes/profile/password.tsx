import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuthStore } from "../../lib/auth-store";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/profile/password")({
  component: ChangePasswordPage,
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[0-9]/, "Password must contain at least one number.")
    .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character."),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New passwords do not match",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

function ChangePasswordPage() {
  const router = useRouter();
  const { user, isAuthenticated, updatePassword } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.navigate({ to: "/login" });
    }
  }, [isAuthenticated, router]);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmit = async (data: PasswordFormValues) => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 600));
    
    // Simple mock verification (since it's frontend only)
    if (user?.password && data.currentPassword !== user.password) {
      setError("currentPassword", { message: "Incorrect current password" });
      setIsSubmitting(false);
      return;
    }
    
    updatePassword(data.newPassword);
    toast.success("Password changed successfully");
    setIsSubmitting(false);
    router.navigate({ to: "/profile" });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background pt-20 pb-12 px-4 relative overflow-hidden">
      
      <div className="max-w-md mx-auto relative z-10">
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => router.history.back()}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-surface border border-border text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-xl font-display font-semibold">Change Password</h1>
        </div>

        <div className="bg-[#0e0e0d] border border-[#2a2a28] rounded-xl p-6 md:p-8 shadow-xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">Current Password</label>
              <input
                {...register("currentPassword")}
                type="password"
                placeholder="••••••••"
                className="w-full bg-[#141413] border border-[#2a2a28] rounded-md px-4 py-3 text-sm focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon transition-all"
              />
              {errors.currentPassword && <p className="text-xs text-destructive mt-1">{errors.currentPassword.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">New Password</label>
              <input
                {...register("newPassword")}
                type="password"
                placeholder="••••••••"
                className="w-full bg-[#141413] border border-[#2a2a28] rounded-md px-4 py-3 text-sm focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon transition-all"
              />
              {errors.newPassword && <p className="text-xs text-destructive mt-1">{errors.newPassword.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">Confirm New Password</label>
              <input
                {...register("confirmPassword")}
                type="password"
                placeholder="••••••••"
                className="w-full bg-[#141413] border border-[#2a2a28] rounded-md px-4 py-3 text-sm focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon transition-all"
              />
              {errors.confirmPassword && <p className="text-xs text-destructive mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-neon text-neon-foreground font-medium py-3 rounded-md hover:bg-neon/90 transition-colors flex items-center justify-center mt-4"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
