import { createFileRoute } from "@tanstack/react-router";
import { useAuthStore } from "../../lib/auth-store";
import { MapPin, Plus, Trash2, Edit2, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";

export const Route = createFileRoute("/profile/addresses")({
  component: AddressesPage,
});

function AddressesPage() {
  const { user, addAddress, removeAddress, setDefaultAddress } = useAuthStore();
  const [isAdding, setIsAdding] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  if (!user) return null;

  const onSubmit = (data: any) => {
    addAddress({
      name: data.name,
      street: data.street,
      city: data.city,
      state: data.state,
      zip: data.zip,
      country: data.country,
      isDefault: data.isDefault || false
    });
    toast.success("Address saved successfully");
    setIsAdding(false);
    reset();
  };

  const handleRemove = (id: string) => {
    if (window.confirm("Delete this address?")) {
      removeAddress(id);
      toast.success("Address deleted");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold mb-1">Addresses</h1>
          <p className="text-sm text-muted-foreground">Manage your shipping and billing addresses.</p>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-neon text-neon-foreground px-4 py-2 rounded-md font-medium text-sm hover:bg-neon/90 transition-colors"
          >
            <Plus size={16} />
            Add New Address
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-[#0e0e0d] border border-[#2a2a28] rounded-xl p-6 shadow-lg mb-6">
          <h3 className="font-medium mb-4">Add a new address</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">Full Name</label>
                <input {...register("name", { required: "Name is required" })} className="w-full bg-[#141413] border border-[#2a2a28] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon transition-all" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">Street Address</label>
                <input {...register("street", { required: "Street is required" })} className="w-full bg-[#141413] border border-[#2a2a28] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">City</label>
                <input {...register("city", { required: "City is required" })} className="w-full bg-[#141413] border border-[#2a2a28] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">State / Province</label>
                <input {...register("state", { required: "State is required" })} className="w-full bg-[#141413] border border-[#2a2a28] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">ZIP / Postal Code</label>
                <input {...register("zip", { required: "ZIP is required" })} className="w-full bg-[#141413] border border-[#2a2a28] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">Country</label>
                <input {...register("country", { required: "Country is required" })} className="w-full bg-[#141413] border border-[#2a2a28] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon transition-all" />
              </div>
              <div className="sm:col-span-2 flex items-center gap-2 pt-2">
                <input type="checkbox" id="isDefault" {...register("isDefault")} className="w-4 h-4 rounded-sm border-[#2a2a28] bg-[#141413] accent-neon" />
                <label htmlFor="isDefault" className="text-sm text-muted-foreground cursor-pointer">Set as default address</label>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t border-[#2a2a28]">
              <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
              <button type="submit" className="bg-neon text-neon-foreground px-5 py-2 rounded-md font-medium text-sm hover:bg-neon/90 transition-colors">Save Address</button>
            </div>
          </form>
        </div>
      )}

      {user.addresses.length === 0 && !isAdding ? (
        <div className="bg-[#0e0e0d] border border-[#2a2a28] rounded-xl p-12 flex flex-col items-center justify-center text-center shadow-lg">
          <div className="w-16 h-16 bg-[#141413] rounded-full flex items-center justify-center mb-4">
            <MapPin className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-1">No addresses saved</h3>
          <p className="text-sm text-muted-foreground max-w-sm">Add a shipping address to speed up your checkout process.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {user.addresses.map((address) => (
            <div key={address.id} className={`bg-[#0e0e0d] border ${address.isDefault ? 'border-neon/50 shadow-[0_0_10px_rgba(255,138,46,0.1)]' : 'border-[#2a2a28]'} rounded-xl p-5 relative group`}>
              
              {address.isDefault && (
                <div className="absolute top-4 right-4 flex items-center gap-1.5 text-neon text-xs font-medium">
                  <CheckCircle2 size={14} />
                  DEFAULT
                </div>
              )}

              <div className="mb-4 pr-20">
                <h4 className="font-semibold text-lg leading-tight mb-1">{address.name}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {address.street}<br/>
                  {address.city}, {address.state} {address.zip}<br/>
                  {address.country}
                </p>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-[#2a2a28] mt-auto">
                <button 
                  onClick={() => handleRemove(address.id)}
                  className="text-xs text-muted-foreground hover:text-[#cc4444] transition-colors flex items-center gap-1.5"
                >
                  <Trash2 size={14} /> Remove
                </button>
                
                {!address.isDefault && (
                  <button 
                    onClick={() => { setDefaultAddress(address.id); toast.success("Set as default"); }}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-auto"
                  >
                    Set as default
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
