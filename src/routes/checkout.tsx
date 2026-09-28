import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { useCart, selectTotal } from "@/lib/cart-store";
import { useAuthStore } from "@/lib/auth-store";
import { formatINR } from "@/lib/products";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import confetti from "canvas-confetti";
import { LogoMark } from "@/components/Logo";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { useRouter } from "@tanstack/react-router";
import { QRCodeSVG } from "qrcode.react";
import { PAYMENT_CONFIG } from "@/config/payment";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [
    { title: "Checkout — Marg" },
    { name: "description", content: "Complete your Marg order." },
  ] }),
  component: Checkout,
});

const steps = ["Cart", "Address", "Payment", "Confirmation"] as const;

function Checkout() {
  const { items, clear } = useCart();
  const total = selectTotal(items);
  const shipping = total > 5000 || total === 0 ? 0 : 199;
  const [step, setStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  const { user, isAuthenticated, isLoaded } = useAuthStore();
  
  useEffect(() => {
    if (isLoaded && !isAuthenticated) {
      toast.error("Please log in to checkout");
      router.navigate({ to: "/login", search: { redirect: "/checkout" } });
    }
  }, [isLoaded, isAuthenticated, router]);
  
  const [address, setAddress] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    pincode: ''
  });

  const [utr, setUtr] = useState("");
  const [orderNumber] = useState("ORD-" + Math.random().toString(36).substr(2, 9).toUpperCase());
  
  const paymentAmount = total + shipping;
  const upiLink = `upi://pay?pa=${PAYMENT_CONFIG.UPI_ID}&pn=${PAYMENT_CONFIG.PAYEE_NAME}&am=${paymentAmount}&cu=INR&tn=${orderNumber}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(PAYMENT_CONFIG.UPI_ID);
    toast.success("UPI ID copied to clipboard!");
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please log in to place an order");
      router.navigate({ to: "/login", search: { redirect: "/checkout" } });
      return;
    }

    setIsProcessing(true);
    
    // Note: In a real app, payment processing and total validation should happen securely on the backend.
    const finalTotal = total + shipping;

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        total_amount: finalTotal,
        status: 'pending',
        order_number: orderNumber,
        shipping_address: address,
        payment_method: 'upi_qr',
        payment_reference: utr
      })
      .select()
      .single();

    if (orderError) {
      console.error("Order creation failed:", orderError);
      toast.error("Failed to place order: " + orderError.message);
      setIsProcessing(false);
      return;
    }

    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.productId,
      product_name: item.name,
      product_image_url: item.image || '',
      quantity: item.qty,
      price: item.price,
      size: item.size,
      color: item.color
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error("Order items creation failed:", itemsError);
      // Delete the order if items failed so we don't leave a ghost order
      await supabase.from('orders').delete().eq('id', order.id);
      
      toast.error("Failed to save order items: " + itemsError.message);
      setIsProcessing(false);
      return;
    }

    clear();
    setStep(3);
    setIsProcessing(false);
  };

  useEffect(() => {
    if (step === 3) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ["#ff6a00", "#ffb347", "#ffffff"] });
    }
  }, [step]);

  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="flex items-center justify-between mb-10">
          {steps.map((s, i) => (
            <div key={s} className="flex-1 flex items-center">
              <div className={`flex items-center gap-2 ${i <= step ? "text-foreground" : "text-muted-foreground"}`}>
                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${i < step ? "bg-neon text-neon-foreground" : i === step ? "border-2 border-neon" : "border border-border"}`}>
                  {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <span className="text-xs tracking-wider hidden sm:inline">{s.toUpperCase()}</span>
              </div>
              {i < steps.length - 1 && <div className={`flex-1 h-px mx-2 ${i < step ? "bg-neon" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
            {step === 0 && (
              <div>
                <h2 className="text-2xl font-display font-bold mb-5">Review Bag</h2>
                {items.length === 0 ? (
                  <p className="text-muted-foreground">Your bag is empty. <Link to="/men" className="text-neon">Continue shopping</Link></p>
                ) : (
                  <>
                    <div className="space-y-3">
                      {items.map((i) => (
                        <div key={i.id} className="flex justify-between text-sm border border-border rounded-lg p-3">
                          <span>{i.name} × {i.qty}</span>
                          <span className="font-semibold">{formatINR(i.price * i.qty)}</span>
                        </div>
                      ))}
                    </div>
                    <Summary total={total} shipping={shipping} />
                    <button disabled={items.length === 0} onClick={() => setStep(1)} className="mt-6 w-full bg-neon text-neon-foreground font-semibold py-3 rounded-full disabled:opacity-50">Continue to Address</button>
                  </>
                )}
              </div>
            )}

            {step === 1 && (
              <form onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
                <h2 className="text-2xl font-display font-bold mb-5">Shipping Address</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Input label="Full name" required value={address.name} onChange={(e) => setAddress({...address, name: e.target.value})} />
                  <Input label="Phone" required type="tel" value={address.phone} onChange={(e) => setAddress({...address, phone: e.target.value})} />
                  <Input label="Address" required className="sm:col-span-2" value={address.address} onChange={(e) => setAddress({...address, address: e.target.value})} />
                  <Input label="City" required value={address.city} onChange={(e) => setAddress({...address, city: e.target.value})} />
                  <Input label="PIN code" required value={address.pincode} onChange={(e) => setAddress({...address, pincode: e.target.value})} />
                </div>
                <div className="mt-6 flex gap-3">
                  <button type="button" onClick={() => setStep(0)} className="flex-1 border border-border py-3 rounded-full">Back</button>
                  <button type="submit" className="flex-1 bg-neon text-neon-foreground font-semibold py-3 rounded-full">Continue to Payment</button>
                </div>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handlePayment}>
                <h2 className="text-2xl font-display font-bold mb-5">Payment</h2>
                
                <div className="bg-foreground/[0.02] border border-border rounded-xl p-6 text-center space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold">Scan & Pay</h3>
                    <p className="text-2xl font-display font-bold mt-2 text-neon">{formatINR(paymentAmount)}</p>
                  </div>
                  
                  <div className="flex justify-center bg-white p-4 rounded-xl mx-auto w-fit">
                    <QRCodeSVG value={upiLink} size={200} />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <span className="text-muted-foreground">UPI ID:</span>
                      <span className="font-medium">{PAYMENT_CONFIG.UPI_ID}</span>
                      <button 
                        type="button" 
                        onClick={handleCopyUpi}
                        className="text-xs bg-foreground/10 hover:bg-foreground/20 px-2 py-1 rounded transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                    
                    <a 
                      href={upiLink}
                      className="inline-block sm:hidden w-full bg-border text-foreground hover:bg-border/80 font-semibold py-2.5 rounded-full text-sm"
                    >
                      Pay with UPI App
                    </a>
                  </div>
                </div>

                <div className="mt-6">
                  <Input 
                    label="UPI Transaction ID (UTR)" 
                    required 
                    placeholder="e.g. 301234567890" 
                    pattern="\d{12}"
                    maxLength={12}
                    minLength={12}
                    title="Please enter the 12-digit UTR reference number"
                    value={utr}
                    onChange={(e) => setUtr(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">Enter the 12-digit reference number after paying.</p>
                </div>

                <Summary total={total} shipping={shipping} />
                <div className="mt-6 flex gap-3">
                  <button type="button" onClick={() => setStep(1)} disabled={isProcessing} className="flex-1 border border-border py-3 rounded-full disabled:opacity-50">Back</button>
                  <button type="submit" disabled={isProcessing || utr.length !== 12} className="flex-1 bg-neon text-neon-foreground font-semibold py-3 rounded-full flex items-center justify-center gap-2 disabled:opacity-50">
                    {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : "I have paid"}
                  </button>
                </div>
              </form>
            )}

            {step === 3 && (
              <div className="text-center py-10">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }} className="inline-flex">
                  <LogoMark className="h-20 w-20" glow />
                </motion.div>
                <h2 className="mt-6 text-2xl sm:text-3xl font-display font-bold">Payment verification pending.</h2>
                <p className="mt-3 text-muted-foreground">We will confirm your order once we receive your payment.</p>
                <Link to="/profile/orders" className="mt-8 inline-block bg-neon text-neon-foreground font-semibold px-7 py-3 rounded-full">View My Orders</Link>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </PageShell>
  );
}

function Summary({ total, shipping }: { total: number; shipping: number }) {
  return (
    <div className="mt-5 border-t border-border pt-4 text-sm space-y-1">
      <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatINR(total)}</span></div>
      <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{shipping === 0 ? "Free" : formatINR(shipping)}</span></div>
      <div className="flex justify-between font-semibold pt-2 text-base"><span>Total</span><span>{formatINR(total + shipping)}</span></div>
    </div>
  );
}

function Input({ label, className = "", ...props }: { label: string; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs tracking-widest text-muted-foreground">{label.toUpperCase()}</span>
      <input {...props} className="mt-1 w-full min-h-[44px] bg-transparent border border-border rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-neon" />
    </label>
  );
}
