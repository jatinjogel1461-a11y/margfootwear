import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format, isToday } from "date-fns";
import { Loader2, ShoppingBag, Calendar, IndianRupee, Clock, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { formatINR } from "@/lib/products";
import type { AdminOrder } from "@/lib/admin";

export const Route = createFileRoute("/admin/")({
  component: AdminOverviewPage,
});

function AdminOverviewPage() {
  const { data: orders, isLoading, error } = useQuery({
    queryKey: ["admin", "orders", "overview"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, user_id, order_number, status, total_amount, shipping_address, payment_method, payment_reference, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AdminOrder[];
    },
  });

  useEffect(() => {
    if (error) {
      toast.error("Failed to load overview metrics");
    }
  }, [error]);

  const list = orders ?? [];
  const totalOrders = list.length;
  const ordersToday = list.filter((o) => isToday(new Date(o.created_at))).length;
  const totalRevenue = list
    .filter((o) => o.status.toLowerCase() !== "cancelled")
    .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  const processingCount = list.filter((o) => o.status.toLowerCase() === "processing").length;
  const latestFive = list.slice(0, 5);

  const cards = [
    { label: "Total Orders", value: String(totalOrders), icon: ShoppingBag },
    { label: "Orders Today", value: String(ordersToday), icon: Calendar },
    { label: "Total Revenue", value: formatINR(Math.round(totalRevenue)), icon: IndianRupee },
    { label: "Processing", value: String(processingCount), icon: Clock },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Overview</h1>
        <p className="text-sm text-muted-foreground">Store performance and latest orders.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-neon" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((c) => (
              <div
                key={c.label}
                className="rounded-xl border border-border bg-surface p-5 flex items-start justify-between gap-3"
              >
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{c.label}</p>
                  <p className="mt-2 text-2xl font-display font-bold tabular-nums">{c.value}</p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-neon/10 border border-neon/30 flex items-center justify-center text-neon">
                  <c.icon className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-2">
              <h2 className="font-display font-semibold">Latest Orders</h2>
              <Link
                to="/admin/orders"
                className="inline-flex items-center gap-1 text-xs text-neon hover:underline"
              >
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {latestFive.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">No orders yet.</div>
            ) : (
              <div className="divide-y divide-border">
                {latestFive.map((order) => (
                  <div
                    key={order.id}
                    className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-mono font-medium">{order.order_number}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {order.shipping_address?.name || "Customer"} ·{" "}
                        {format(new Date(order.created_at), "MMM d, yyyy")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-semibold">
                        {formatINR(Number(order.total_amount || 0))}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs border border-border capitalize bg-background">
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
