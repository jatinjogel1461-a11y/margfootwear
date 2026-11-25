import { createFileRoute } from "@tanstack/react-router";
import { Settings, Shield, Bell } from "lucide-react";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettingsPage,
});

function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-neon">Configuration</p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-display font-bold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Administrative preferences layout. Saving changes requires backend integration.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="rounded-2xl border border-border bg-surface p-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <Settings className="h-4 w-4 text-neon" />
            <h2 className="font-display font-semibold">Store General</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Store Name</p>
              <p className="mt-1 rounded-lg border border-border bg-background/60 px-3 py-2 text-muted-foreground">
                Marg Footwear
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Currency</p>
              <p className="mt-1 rounded-lg border border-border bg-background/60 px-3 py-2 font-mono text-muted-foreground">
                INR (₹)
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <Shield className="h-4 w-4 text-neon" />
            <h2 className="font-display font-semibold">Access &amp; Security</h2>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            This route is currently a frontend UI shell. Before deploying to production, enforce
            server-side authentication and role-based authorization on all `/admin` routes and APIs.
          </p>
        </section>

        <section className="lg:col-span-2 rounded-2xl border border-border bg-surface p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <Bell className="h-4 w-4 text-neon" />
            <h2 className="font-display font-semibold">Notifications</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Notification preferences will become interactive once connected to your backend settings
            endpoint.
          </p>
        </section>
      </div>
    </div>
  );
}
