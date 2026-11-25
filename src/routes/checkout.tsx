import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { useCart, selectTotal } from "@/lib/cart-store";
import { useAuthStore } from "@/lib/auth-store";
import { formatINR } from "@/lib/products";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import confetti from "canvas-confetti";
import { LogoMark } from "@/components/Logo";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { useRouter } from "@tanstack/react-router";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [
    { title: "Checkout — Marg" },
    { name: "description", content: "Complete your Marg order." },
  ] }),
  component: Checkout,
});

const steps = ["Cart", "Address", "Payment", "Confirmation"] as const;

// ---------------------------------------------------------------------------
// Load Razorpay checkout.js once, lazily
// ---------------------------------------------------------------------------
let razorpayScriptPromise: Promise<void> | null = null;
function loadRazorpayScript(): Promise<void> {
  if (razorpayScriptPromise) return razorpayScriptPromise;
  razorpayScriptPromise = new Promise((resolve, reject) => {
    if (typeof window !== "undefined" && (window as any).Razorpay) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve();
    s.onerror = () => {
      razorpayScriptPromise = null;
      reject(new Error("Failed to load Razorpay SDK"));
    };
    document.head.appendChild(s);
  });
  return razorpayScriptPromise;
}

function Checkout() {
  const { items, clear } = useCart();
  const total = selectTotal(items);
  const shipping = total > 5000 || total <= 1 ? 0 : 199;
  const [step, setStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  const { user, isAuthenticated, isLoaded } = useAuthStore();
  const [confirmedOrderNumber, setConfirmedOrderNumber] = useState("");

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

  const paymentAmount = total + shipping;

  // Preload Razorpay script when user reaches the payment step
  useEffect(() => {
    if (step === 2) {
      loadRazorpayScript().catch(() => {});
    }
  }, [step]);

  const handlePay = useCallback(async () => {
    setIsProcessing(true);

    try {
      // 1. Get session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error("Please log in to place an order");
        router.navigate({ to: "/login", search: { redirect: "/checkout" } });
        setIsProcessing(false);
        return;
      }

      // 2. Create order on the server
      const createRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          items: items.map(i => ({
            product_id: i.productId,
            quantity: i.qty,
            size: String(i.size),
            color: i.color,
            image: "",
          })),
          address,
        }),
      });

      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({ error: "Failed to create order" }));
        toast.error(err.error || "Failed to create order");
        setIsProcessing(false);
        return;
      }

      const { razorpayOrderId, amount, currency, keyId, orderNumber } = await createRes.json();

      // 3. Load Razorpay SDK
      await loadRazorpayScript();

      // 4. Open Razorpay checkout
      const rzp = new (window as any).Razorpay({
        key: keyId,
        amount,
        currency,
        name: "Marg Footwear",
        description: `Order ${orderNumber}`,
        order_id: razorpayOrderId,
        prefill: {
          name: address.name || user?.name || "",
          email: user?.email || "",
          contact: address.phone || user?.phone || "",
        },
        theme: { color: "#ff6a00" },
        handler: async (response: any) => {
          // 5. Verify payment on the server
          try {
            const verifyRes = await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            if (!verifyRes.ok) {
              const err = await verifyRes.json().catch(() => ({ error: "Payment verification failed" }));
              toast.error(err.error || "Payment verification failed");
              setIsProcessing(false);
              return;
            }

            const { orderNumber: confirmedNum } = await verifyRes.json();
            clear();
            setConfirmedOrderNumber(confirmedNum || orderNumber);
            setStep(3);
          } catch {
            toast.error("Payment verification failed. Contact support if debited.");
          }
          setIsProcessing(false);
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            toast("Payment cancelled. You can try again.");
          },
        },
      });

      rzp.on("payment.failed", (resp: any) => {
        toast.error(resp?.error?.description || "Payment failed. Please try again.");
        setIsProcessing(false);
      });

      rzp.open();
    } catch (err: any) {
      console.error("Payment error:", err);
      toast.error(err?.message || "Something went wrong");
      setIsProcessing(false);
    }
  }, [items, address, user, router, clear]);

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
              <div>
                <h2 className="text-2xl font-display font-bold mb-5">Payment</h2>

                <div className="bg-foreground/[0.02] border border-border rounded-xl p-6 text-center space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">Pay Securely</h3>
                    <p className="text-2xl font-display font-bold mt-2 text-neon">{formatINR(paymentAmount)}</p>
                    <p className="text-xs text-muted-foreground mt-1">UPI, Cards, Net Banking, Wallets</p>
                  </div>
                </div>

                <Summary total={total} shipping={shipping} />
                <div className="mt-6 flex gap-3">
                  <button type="button" onClick={() => setStep(1)} disabled={isProcessing} className="flex-1 border border-border py-3 rounded-full disabled:opacity-50">Back</button>
                  <button
                    type="button"
                    onClick={handlePay}
                    disabled={isProcessing}
                    className="flex-1 bg-neon text-neon-foreground font-semibold py-3 rounded-full flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : "Pay Now"}
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="text-center py-10">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }} className="inline-flex">
                  <LogoMark className="h-20 w-20" glow />
                </motion.div>
                <h2 className="mt-6 text-2xl sm:text-3xl font-display font-bold">Order Confirmed!</h2>
                {confirmedOrderNumber && (
                  <p className="mt-2 text-neon font-semibold">{confirmedOrderNumber}</p>
                )}
                <p className="mt-3 text-muted-foreground">Your payment was successful. We&apos;re getting your order ready.</p>
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
