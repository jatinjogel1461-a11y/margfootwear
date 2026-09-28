import { createFileRoute } from "@tanstack/react-router";
import { useAuthStore } from "../../lib/auth-store";
import { CreditCard, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";

export const Route = createFileRoute("/profile/payment")({
  component: PaymentMethodsPage,
});

function PaymentMethodsPage() {
  const { user, addPaymentMethod, removePaymentMethod, setDefaultPaymentMethod } = useAuthStore();
  const [isAdding, setIsAdding] = useState(false);

  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: { type: 'card', label: '', isDefault: false }
  });

  const paymentType = watch("type");

  if (!user) return null;

  const onSubmit = (data: any) => {
    let label = data.label;
    if (data.type === 'card') {
      // Simulate masking the card
      const last4 = label.slice(-4) || 'XXXX';
      label = `•••• ${last4}`;
    }
    
    addPaymentMethod({
      type: data.type,
      label,
      isDefault: data.isDefault
    });
    toast.success("Payment method saved");
    setIsAdding(false);
    reset();
  };

  const handleRemove = (id: string) => {
    if (window.confirm("Delete this payment method?")) {
      removePaymentMethod(id);
      toast.success("Payment method deleted");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold mb-1">Payment Methods</h1>
          <p className="text-sm text-muted-foreground">Manage your saved cards and UPI IDs.</p>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-neon text-neon-foreground px-4 py-2 rounded-md font-medium text-sm hover:bg-neon/90 transition-colors"
          >
            <Plus size={16} />
            Add Method
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-[#0e0e0d] border border-[#2a2a28] rounded-xl p-6 shadow-lg mb-6">
          <h3 className="font-medium mb-4">Add Payment Method</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">Method Type</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value="card" {...register("type")} className="accent-neon" />
                  <span className="text-sm">Credit / Debit Card</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value="upi" {...register("type")} className="accent-neon" />
                  <span className="text-sm">UPI ID</span>
                </label>
              </div>
            </div>

            {paymentType === 'card' ? (
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">Card Number</label>
                <input 
                  {...register("label", { required: "Card number is required", minLength: 16, maxLength: 16 })} 
                  placeholder="0000 0000 0000 0000"
                  className="w-full bg-[#141413] border border-[#2a2a28] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon transition-all" 
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">UPI ID</label>
                <input 
                  {...register("label", { required: "UPI ID is required" })} 
                  placeholder="username@bank"
                  className="w-full bg-[#141413] border border-[#2a2a28] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon transition-all" 
                />
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" id="isDefaultPm" {...register("isDefault")} className="w-4 h-4 rounded-sm border-[#2a2a28] bg-[#141413] accent-neon" />
              <label htmlFor="isDefaultPm" className="text-sm text-muted-foreground cursor-pointer">Set as default payment method</label>
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t border-[#2a2a28]">
              <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
              <button type="submit" className="bg-neon text-neon-foreground px-5 py-2 rounded-md font-medium text-sm hover:bg-neon/90 transition-colors">Save Method</button>
            </div>
          </form>
        </div>
      )}

      {user.paymentMethods.length === 0 && !isAdding ? (
        <div className="bg-[#0e0e0d] border border-[#2a2a28] rounded-xl p-12 flex flex-col items-center justify-center text-center shadow-lg">
          <div className="w-16 h-16 bg-[#141413] rounded-full flex items-center justify-center mb-4">
            <CreditCard className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-1">No payment methods</h3>
          <p className="text-sm text-muted-foreground max-w-sm">Save your payment details for faster checkout securely.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {user.paymentMethods.map((method) => (
            <div key={method.id} className={`bg-[#0e0e0d] border ${method.isDefault ? 'border-neon/50 shadow-[0_0_10px_rgba(255,138,46,0.1)]' : 'border-[#2a2a28]'} rounded-xl p-5 relative group flex items-center gap-4`}>
              
              <div className="w-12 h-8 bg-[#1a1a18] rounded-md border border-[#333] flex items-center justify-center flex-shrink-0">
                {method.type === 'card' ? (
                  <CreditCard size={18} className="text-muted-foreground" />
                ) : (
                  <span className="text-[10px] font-bold text-muted-foreground">UPI</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{method.label}</div>
                {method.isDefault && (
                  <div className="text-[10px] text-neon uppercase tracking-wider font-medium mt-0.5 flex items-center gap-1">
                    <CheckCircle2 size={12} /> Default
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {!method.isDefault && (
                  <button 
                    onClick={() => { setDefaultPaymentMethod(method.id); toast.success("Set as default"); }}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors mr-2"
                  >
                    Set Default
                  </button>
                )}
                <button 
                  onClick={() => handleRemove(method.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#1a1a18] text-muted-foreground hover:text-[#cc4444] transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
