import { createFileRoute } from "@tanstack/react-router";
import { useAuthStore } from "../../lib/auth-store";
import { getProduct } from "../../lib/products";
import { Package, Truck, ChevronRight, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import { toast } from "sonner";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";

export const Route = createFileRoute("/profile/orders")({
  component: OrdersPage,
});

type OrderItem = {
  id: string;
  product_name: string;
  product_image_url: string;
  quantity: number;
  price: number;
};

type Order = {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  order_items: OrderItem[];
};

function OrdersPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  
  const { data: orders, isLoading, error } = useQuery({
    queryKey: ['orders', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('user_id', user?.id)
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error("Orders fetch error:", error);
        throw error;
      }
      return data as Order[];
    },
    enabled: !!user?.id,
    retry: 1,
  });

  if (!user) return null;

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    
    setCancellingId(orderId);
    const { error } = await supabase.rpc('cancel_order', { p_order_id: orderId });
    setCancellingId(null);

    if (error) {
      console.error("Cancel order error:", error);
      toast.error(error.message || "Failed to cancel order");
      return;
    }

    toast.success("Order cancelled successfully");
    queryClient.setQueryData(['orders', user?.id], (oldData: Order[] | undefined) => {
      if (!oldData) return oldData;
      return oldData.filter(o => o.id !== orderId);
    });
  };

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    switch(s) {
      case 'delivered': return "bg-green-500/10 text-green-500 border-green-500/20";
      case 'processing': return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case 'shipped': return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case 'cancelled': return "bg-red-500/10 text-red-500 border-red-500/20";
      default: return "bg-foreground/5 text-muted-foreground border-border";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div>
        <h1 className="text-2xl font-display font-semibold mb-1">My Orders</h1>
        <p className="text-sm text-muted-foreground">View and track your recent orders.</p>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-destructive p-4 border border-destructive/20 rounded-xl bg-destructive/5">
            Failed to load orders. Please try again or check if you have connected Supabase.
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="bg-foreground/[0.02] border border-border/50 rounded-xl p-12 flex flex-col items-center justify-center text-center shadow-lg">
            <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mb-4 border border-border">
              <Package className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-1">No orders yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm">When you place an order, it will appear here so you can track its status.</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-foreground/[0.02] border border-border/50 rounded-xl overflow-hidden shadow-lg">
              {/* Order Header */}
              <div className="bg-background border-b border-border/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-6 text-sm">
                  <div>
                    <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Order Placed</div>
                    <div className="font-medium">{format(new Date(order.created_at), "MMM d, yyyy")}</div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Total</div>
                    <div className="font-medium">₹{Number(order.total_amount).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Order #</div>
                    <div className="font-medium">{order.order_number}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border capitalize ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
              </div>

              {/* Order Items Summary */}
              <div className="p-4 sm:p-6">
                <div className="space-y-4">
                  {order.order_items && order.order_items.length > 0 ? (
                    <>
                      {order.order_items.slice(0, 2).map((item) => {
                        const localP = item.product_id ? getProduct(item.product_id) : null;
                        const imgUrl = (localP && localP.id) ? `/models/sneaker/thumbnail.webp` : item.product_image_url;
                        return (
                          <div key={item.id} className="flex gap-4">
                            <div className="w-20 h-20 bg-background border border-border/50 rounded-lg overflow-hidden flex-shrink-0">
                              <img src={imgUrl || "/models/sneaker/thumbnail.webp"} alt={item.product_name} className="w-full h-full object-cover p-2" />
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                              <h4 className="font-medium text-sm sm:text-base truncate">{localP?.name || item.product_name}</h4>
                              <p className="text-muted-foreground text-xs mt-1">Qty: {item.quantity} | ₹{Number(item.price).toFixed(2)}</p>
                            </div>
                          </div>
                        );
                      })}
                      {order.order_items.length > 2 && (
                        <p className="text-sm text-muted-foreground pt-2">
                          + {order.order_items.length - 2} more item(s)
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground italic">No items found for this order.</div>
                  )}
                </div>
              </div>

              {/* Order Actions */}
              <div className="border-t border-border/50 p-4 flex flex-wrap gap-3">
                {order.status !== 'cancelled' && order.status !== 'delivered' && (
                  <button className="flex items-center justify-center gap-2 bg-neon text-neon-foreground hover:opacity-90 px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 sm:flex-none">
                    <Truck size={16} />
                    Track Order
                  </button>
                )}

                {order.status === 'pending' && (
                  <button 
                    onClick={() => handleCancelOrder(order.id)}
                    disabled={cancellingId === order.id}
                    className="flex items-center justify-center gap-2 bg-background text-foreground hover:bg-red-500/10 border border-border hover:border-red-500 hover:text-red-500 px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 sm:flex-none disabled:opacity-50"
                  >
                    {cancellingId === order.id ? <Loader2 size={16} className="animate-spin" /> : "Cancel Order"}
                  </button>
                )}
                
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="flex items-center justify-center gap-2 bg-background text-foreground hover:bg-foreground/5 border border-border hover:border-neon px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 sm:flex-none group">
                      View Details
                      <ChevronRight size={16} className="text-muted-foreground group-hover:text-neon" />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl bg-background border-border">
                    <DialogHeader>
                      <DialogTitle className="text-xl">Order Details</DialogTitle>
                    </DialogHeader>
                    <div className="mt-4 space-y-6">
                      <div className="flex flex-wrap justify-between gap-4 p-4 bg-foreground/5 rounded-lg border border-border/50">
                         <div>
                           <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Order Number</p>
                           <p className="font-medium">{order.order_number}</p>
                         </div>
                         <div>
                           <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Date</p>
                           <p className="font-medium">{format(new Date(order.created_at), "PPP")}</p>
                         </div>
                         <div>
                           <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total</p>
                           <p className="font-medium">₹{Number(order.total_amount).toFixed(2)}</p>
                         </div>
                         <div>
                           <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Status</p>
                           <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border capitalize ${getStatusColor(order.status)}`}>
                             {order.status}
                           </span>
                         </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-3">Items ({order.order_items?.length || 0})</h4>
                        <div className="space-y-3">
                          {order.order_items && order.order_items.map(item => {
                            const localP = item.product_id ? getProduct(item.product_id) : null;
                            const imgUrl = (localP && localP.id) ? `/models/sneaker/thumbnail.webp` : item.product_image_url;
                            return (
                              <div key={item.id} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                                 <div className="flex gap-3 items-center">
                                   <div className="w-12 h-12 bg-background border border-border/50 rounded-md overflow-hidden p-1">
                                      <img src={imgUrl || "/models/sneaker/thumbnail.webp"} alt={item.product_name} className="w-full h-full object-cover" />
                                   </div>
                                   <div>
                                     <p className="font-medium text-sm">{localP?.name || item.product_name}</p>
                                     <p className="text-xs text-muted-foreground">Qty: {item.quantity} x ₹{Number(item.price).toFixed(2)}</p>
                                   </div>
                                 </div>
                                 <div className="font-medium text-sm">
                                    ₹{(Number(item.price) * item.quantity).toFixed(2)}
                                 </div>
                              </div>
                            );
                          })}
                          {(!order.order_items || order.order_items.length === 0) && (
                            <div className="text-sm text-muted-foreground py-4">No items found for this order.</div>
                          )}
                        </div>
                      </div>

                      {order.status === 'pending' && (
                        <div className="pt-4 border-t border-border/50 flex justify-end">
                          <button 
                            onClick={() => handleCancelOrder(order.id)}
                            disabled={cancellingId === order.id}
                            className="flex items-center justify-center gap-2 bg-background text-foreground hover:bg-red-500/10 border border-border hover:border-red-500 hover:text-red-500 px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                          >
                            {cancellingId === order.id ? <Loader2 size={16} className="animate-spin" /> : "Cancel Order"}
                          </button>
                        </div>
                      )}
                      
                    </div>
                  </DialogContent>
                </Dialog>

              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
