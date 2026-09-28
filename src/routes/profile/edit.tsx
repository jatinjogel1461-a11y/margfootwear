import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuthStore } from "../../lib/auth-store";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/profile/edit")({
  component: EditProfilePage,
});

const editProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  phone: z.string().optional(),
});

type EditProfileFormValues = z.infer<typeof editProfileSchema>;

function EditProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, updateProfile } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.navigate({ to: "/login" });
    }
  }, [isAuthenticated, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditProfileFormValues>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
    },
  });

  const onSubmit = async (data: EditProfileFormValues) => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 600));
    
    updateProfile(data);
    toast.success("Profile updated successfully");
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
          <h1 className="text-xl font-display font-semibold">Edit Profile</h1>
        </div>

        <div className="bg-[#0e0e0d] border border-[#2a2a28] rounded-xl p-6 md:p-8 shadow-xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">Full Name</label>
              <input
                {...register("name")}
                type="text"
                className="w-full bg-[#141413] border border-[#2a2a28] rounded-md px-4 py-3 text-sm focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon transition-all"
              />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">Email</label>
              <input
                {...register("email")}
                type="email"
                className="w-full bg-[#141413] border border-[#2a2a28] rounded-md px-4 py-3 text-sm focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon transition-all"
              />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">Phone (Optional)</label>
              <input
                {...register("phone")}
                type="tel"
                placeholder="+1 (555) 000-0000"
                className="w-full bg-[#141413] border border-[#2a2a28] rounded-md px-4 py-3 text-sm focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon transition-all"
              />
              {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-neon text-neon-foreground font-medium py-3 rounded-md hover:bg-neon/90 transition-colors flex items-center justify-center mt-4"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
