import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useAuthStore } from "../../lib/auth-store";
import { Bell, ShoppingBag, Trash2 } from "lucide-react";
import { Switch } from "../../components/ui/switch";
import { toast } from "sonner";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/profile/")({
  component: ProfileOverview,
});

const CATEGORIES = ["Running", "Casual", "Training", "Lifestyle", "Sports"];
const SHOE_SIZES = [7, 8, 9, 10, 11, 12];
const GENDERS = ["Men", "Women", "Kids"];

function ProfileOverview() {
  const router = useRouter();
  const { user, updatePreferences, deleteAccount } = useAuthStore();
  
  if (!user) return null;

  const [prefs, setPrefs] = useState(user.preferences);

  useEffect(() => {
    setPrefs(user.preferences);
  }, [user]);

  const handleToggle = (key: keyof typeof prefs.notifications, checked: boolean) => {
    const newNotifs = { ...prefs.notifications, [key]: checked };
    setPrefs({ ...prefs, notifications: newNotifs });
    updatePreferences({ notifications: newNotifs });
    toast.success("Notification preferences saved");
  };

  const handlePrefUpdate = (key: keyof typeof prefs, value: any) => {
    const newVal = prefs[key] === value ? null : value;
    setPrefs({ ...prefs, [key]: newVal });
    updatePreferences({ [key]: newVal });
    toast.success("Preferences updated");
  };

  const handleDeleteAccount = () => {
    if (window.confirm("DANGER: Are you absolutely sure you want to delete your account? This action cannot be undone.")) {
      deleteAccount();
      toast.success("Account deleted");
      router.navigate({ to: "/" });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div>
        <h1 className="text-2xl font-display font-semibold mb-1">Overview</h1>
        <p className="text-sm text-muted-foreground">Manage your shopping experience and notifications.</p>
      </div>

      {/* Shopping Preferences */}
      <section className="space-y-3">
        <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium px-1">Shopping Preferences</h2>
        <div className="bg-[#0e0e0d] border border-[#2a2a28] rounded-xl p-5 shadow-lg space-y-6">
          
          <div>
            <div className="flex items-center gap-2 mb-3 text-sm">
              <ShoppingBag size={16} className="text-muted-foreground" />
              <span className="font-medium">Preferred Section</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {GENDERS.map(g => (
                <button
                  key={g}
                  onClick={() => handlePrefUpdate("genderPreference", g)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                    prefs.genderPreference === g 
                      ? "bg-neon text-neon-foreground" 
                      : "bg-[#1a1a18] text-muted-foreground border border-[#333] hover:border-neon hover:text-foreground"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-3 text-sm font-medium">Style Interest</div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => handlePrefUpdate("preferredCategory", cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                    prefs.preferredCategory === cat 
                      ? "bg-neon text-neon-foreground" 
                      : "bg-[#1a1a18] text-muted-foreground border border-[#333] hover:border-neon hover:text-foreground"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-3 text-sm font-medium">Shoe Size (US)</div>
            <div className="flex flex-wrap gap-2">
              {SHOE_SIZES.map(size => (
                <button
                  key={size}
                  onClick={() => handlePrefUpdate("shoeSize", size)}
                  className={`w-10 h-10 rounded-md text-sm font-medium flex items-center justify-center transition-all ${
                    prefs.shoeSize === size 
                      ? "bg-neon text-neon-foreground" 
                      : "bg-[#1a1a18] text-muted-foreground border border-[#333] hover:border-neon hover:text-foreground"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section className="space-y-3">
        <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium px-1">Notifications</h2>
        <div className="bg-[#0e0e0d] border border-[#2a2a28] rounded-xl p-5 shadow-lg space-y-4">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell size={18} className="text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Order Updates</div>
                <div className="text-xs text-muted-foreground">Shipping and delivery status via Email</div>
              </div>
            </div>
            <Switch 
              checked={prefs.notifications.orderUpdates} 
              onCheckedChange={(c) => handleToggle('orderUpdates', c)} 
              className="data-[state=checked]:bg-neon"
            />
          </div>
          <div className="h-[1px] bg-[#2a2a28] w-full"></div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell size={18} className="text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">SMS Alerts</div>
                <div className="text-xs text-muted-foreground">Order updates via SMS</div>
              </div>
            </div>
            <Switch 
              checked={prefs.notifications.smsAlerts} 
              onCheckedChange={(c) => handleToggle('smsAlerts', c)} 
              className="data-[state=checked]:bg-neon"
            />
          </div>
          <div className="h-[1px] bg-[#2a2a28] w-full"></div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell size={18} className="text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">New Arrivals</div>
                <div className="text-xs text-muted-foreground">Be the first to know about drops</div>
              </div>
            </div>
            <Switch 
              checked={prefs.notifications.newArrivals} 
              onCheckedChange={(c) => handleToggle('newArrivals', c)} 
              className="data-[state=checked]:bg-neon"
            />
          </div>
          <div className="h-[1px] bg-[#2a2a28] w-full"></div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell size={18} className="text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Promotions</div>
                <div className="text-xs text-muted-foreground">Special offers and sales</div>
              </div>
            </div>
            <Switch 
              checked={prefs.notifications.promotional} 
              onCheckedChange={(c) => handleToggle('promotional', c)} 
              className="data-[state=checked]:bg-neon"
            />
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="space-y-3 pt-6">
        <h2 className="text-[11px] uppercase tracking-widest text-[#cc4444] font-medium px-1">Danger Zone</h2>
        <div className="bg-[#0e0e0d] border border-[#2a2a28] rounded-xl p-5 shadow-lg border-l-4 border-l-[#cc4444]/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium">Delete Account</div>
              <div className="text-xs text-muted-foreground mt-1 max-w-[300px]">
                Permanently remove your account and all associated data. This action cannot be undone.
              </div>
            </div>
            <button
              onClick={handleDeleteAccount}
              className="flex items-center gap-2 bg-[#cc4444]/10 text-[#cc4444] hover:bg-[#cc4444]/20 hover:text-[#ff5555] px-4 py-2 rounded-md text-sm font-medium transition-colors border border-[#cc4444]/20"
            >
              <Trash2 size={16} />
              Delete Account
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
