import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { Loader2, Search, Package } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { formatINR } from "@/lib/products";
import type { AdminOrder } from "@/lib/admin";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrdersPage,
});

const STATUS_FILTERS = ["all", "pending", "processing", "shipped", "delivered", "cancelled"] as const;
const STATUS_OPTIONS = ["processing", "shipped", "delivered", "cancelled"] as const;

function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { data: orders, isLoading, error } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items (*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AdminOrder[];
    },
  });

  useEffect(() => {
    if (error) {
      toast.error("Failed to load orders");
    }
  }, [error]);

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return (orders ?? []).filter((o) => {
      if (statusFilter !== "all" && o.status.toLowerCase() !== statusFilter) return false;
      if (!q) return true;
      return (
        o.id.toLowerCase().includes(q) ||
        o.order_number.toLowerCase().includes(q) ||
        (o.shipping_address?.name ?? "").toLowerCase().includes(q)
      );
    });
  }, [orders, statusFilter, searchQuery]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    const { error: updateErr } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);
    setUpdatingId(null);

    if (updateErr) {
      toast.error(updateErr.message || "Failed to update order status");
      return;
    }

    toast.success(`Order updated to ${newStatus}`);
    queryClient.setQueryData<AdminOrder[]>(["admin", "orders"], (old) =>
      (old ?? []).map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
    );
    queryClient.invalidateQueries({ queryKey: ["admin", "orders", "overview"] });
    if (selectedOrder?.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Orders</h1>
        <p className="text-sm text-muted-foreground">Manage customer orders and fulfillment status.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order ID or order #..."
            aria-label="Search orders by ID"
            className="w-full min-h-[40px] rounded-lg border border-border bg-surface pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-neon"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter orders by status"
          className="min-h-[40px] rounded-lg border border-border bg-surface px-3 py-2 text-sm capitalize focus:outline-none focus:border-neon"
        >
          {STATUS_FILTERS.map((s) => (
            <option key={s} value={s} className="capitalize">
              {s === "all" ? "All statuses" : s}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-neon" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-12 text-center space-y-2">
          <Package className="w-8 h-8 mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No matching orders found.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-surface overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                <th className="py-3 px-4">Order</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className="hover:bg-background/60 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4 font-mono">
                    <div className="font-medium text-foreground">{order.order_number}</div>
                    <div className="text-[11px] text-muted-foreground truncate max-w-[140px]">
                      {order.id}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {order.shipping_address?.name || "—"}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                    {format(new Date(order.created_at), "MMM d, yyyy")}
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold whitespace-nowrap">
                    {formatINR(Number(order.total_amount || 0))}
                  </td>
                  <td
                    className="py-3 px-4 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <select
                      value={order.status.toLowerCase()}
                      disabled={updatingId === order.id}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      aria-label={`Status for ${order.order_number}`}
                      className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs capitalize focus:outline-none focus:border-neon disabled:opacity-50"
                    >
                      {order.status.toLowerCase() === "pending" && (
                        <option value="pending" disabled>
                          pending
                        </option>
                      )}
                      {STATUS_OPTIONS.map((st) => (
                        <option key={st} value={st} className="capitalize">
                          {st}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Order Detail Dialog */}
      <Dialog open={Boolean(selectedOrder)} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl bg-background border-border max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              Order {selectedOrder?.order_number}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-5 text-sm">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl border border-border bg-surface p-4">
                <div>
                  <p className="text-[11px] uppercase text-muted-foreground">Status</p>
                  <p className="font-medium capitalize mt-0.5">{selectedOrder.status}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase text-muted-foreground">Date</p>
                  <p className="font-medium mt-0.5">
                    {format(new Date(selectedOrder.created_at), "PPP")}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase text-muted-foreground">Total</p>
                  <p className="font-mono font-semibold text-neon mt-0.5">
                    {formatINR(Number(selectedOrder.total_amount || 0))}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase text-muted-foreground">Payment</p>
                  <p className="font-medium uppercase mt-0.5">
                    {selectedOrder.payment_method || "—"}
                  </p>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="rounded-xl border border-border bg-surface p-4 space-y-1">
                <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                  Shipping Address
                </h3>
                {selectedOrder.shipping_address ? (
                  <>
                    <p className="font-medium">{selectedOrder.shipping_address.name}</p>
                    <p className="text-muted-foreground">{selectedOrder.shipping_address.phone}</p>
                    <p className="text-muted-foreground">
                      {selectedOrder.shipping_address.address},{" "}
                      {selectedOrder.shipping_address.city} —{" "}
                      {selectedOrder.shipping_address.pincode}
                    </p>
                  </>
                ) : (
                  <p className="text-muted-foreground italic">No shipping address recorded.</p>
                )}
              </div>

              {/* Order Items */}
              <div>
                <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                  Items ({selectedOrder.order_items?.length ?? 0})
                </h3>
                <div className="divide-y divide-border rounded-xl border border-border bg-surface">
                  {(selectedOrder.order_items ?? []).map((item) => (
                    <div key={item.id} className="p-3.5 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Size {item.size || "—"} · {item.color || "—"} · Qty {item.quantity}
                        </p>
                      </div>
                      <p className="font-mono font-semibold">
                        {formatINR(Number(item.price) * item.quantity)}
                      </p>
                    </div>
                  ))}
                  {(!selectedOrder.order_items || selectedOrder.order_items.length === 0) && (
                    <p className="p-4 text-xs text-muted-foreground italic">No items found.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
