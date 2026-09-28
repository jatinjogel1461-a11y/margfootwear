import { create } from 'zustand';
import { supabase } from './supabaseClient';

export interface Address {
  id: string;
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault: boolean;
}

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  date: string;
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  total: number;
  items: OrderItem[];
}

export interface WishlistItem {
  productId: string;
  name: string;
  price: number;
  image: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'upi';
  label: string;
  isDefault: boolean;
}

export interface UserPreferences {
  preferredCategory: string | null;
  shoeSize: number | null;
  genderPreference: 'Men' | 'Women' | 'Kids' | null;
  notifications: {
    orderUpdates: boolean;
    newArrivals: boolean;
    promotional: boolean;
    smsAlerts: boolean;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  password?: string;
  memberSince: string;
  preferences: UserPreferences;
  addresses: Address[];
  orders: Order[];
  wishlist: WishlistItem[];
  paymentMethods: PaymentMethod[];
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoaded: boolean;
  
  login: (credentials: { email: string; password: string }) => Promise<{ error: Error | null }>;
  signup: (credentials: { name: string; email: string; password: string; phone?: string }) => Promise<{ data: any; error: Error | null }>;
  logout: () => Promise<void>;
  deleteAccount: () => void;
  
  updateProfile: (data: Partial<User>) => void;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  updatePassword: (newPassword: string) => void;
  
  addAddress: (address: Omit<Address, 'id'>) => void;
  removeAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  
  toggleWishlist: (item: WishlistItem) => void;
  
  addPaymentMethod: (pm: Omit<PaymentMethod, 'id'>) => void;
  removePaymentMethod: (id: string) => void;
  setDefaultPaymentMethod: (id: string) => void;
}

const buildUserObj = (session: any): User => {
  const meta = session.user.user_metadata || {};
  const email = session.user.email || "";
  return {
    id: session.user.id,
    name: meta.name || email.split("@")[0],
    email: email,
    phone: meta.phone || "",
    memberSince: session.user.created_at,
    preferences: {
      preferredCategory: null,
      shoeSize: null,
      genderPreference: null,
      notifications: {
        orderUpdates: true,
        newArrivals: true,
        promotional: false,
        smsAlerts: false
      },
    },
    addresses: [],
    orders: [],
    wishlist: [],
    paymentMethods: [],
  };
};

export const useAuthStore = create<AuthState>((set, get) => {
  if (typeof window !== 'undefined') {
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({
        user: session ? buildUserObj(session) : null,
        isAuthenticated: !!session,
        isLoaded: true
      });
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({
        user: session ? buildUserObj(session) : null,
        isAuthenticated: !!session,
      });
    });
  }

  return {
    user: null,
    isAuthenticated: false,
    isLoaded: false,
    
    login: async ({ email, password }) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    },
    signup: async ({ name, email, password, phone }) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, phone }
        }
      });
      return { data, error };
    },
    logout: async () => {
      await supabase.auth.signOut();
    },
    deleteAccount: () => set({ user: null, isAuthenticated: false }),
    
    updateProfile: (data) => set((state) => ({
      user: state.user ? { ...state.user, ...data } : null
    })),
    
    updatePreferences: (prefs) => set((state) => ({
      user: state.user 
        ? { ...state.user, preferences: { ...state.user.preferences, ...prefs } } 
        : null
    })),

    updatePassword: (newPassword) => set((state) => ({
      user: state.user ? { ...state.user, password: newPassword } : null
    })),
    
    addAddress: (address) => set((state) => {
      if (!state.user) return state;
      const newAddress = { ...address, id: "add_" + Math.random().toString(36).substr(2, 9) };
      const addresses = [...state.user.addresses];
      if (addresses.length === 0 || newAddress.isDefault) {
        newAddress.isDefault = true;
        addresses.forEach(a => a.isDefault = false);
      }
      return { user: { ...state.user, addresses: [...addresses, newAddress] } };
    }),
    
    removeAddress: (id) => set((state) => {
      if (!state.user) return state;
      return { user: { ...state.user, addresses: state.user.addresses.filter(a => a.id !== id) } };
    }),
    
    setDefaultAddress: (id) => set((state) => {
      if (!state.user) return state;
      return {
        user: {
          ...state.user,
          addresses: state.user.addresses.map(a => ({ ...a, isDefault: a.id === id }))
        }
      };
    }),
    
    toggleWishlist: (item) => set((state) => {
      if (!state.user) return state;
      const exists = state.user.wishlist.some(w => w.productId === item.productId);
      if (exists) {
        return { user: { ...state.user, wishlist: state.user.wishlist.filter(w => w.productId !== item.productId) } };
      } else {
        return { user: { ...state.user, wishlist: [...state.user.wishlist, item] } };
      }
    }),
    
    addPaymentMethod: (pm) => set((state) => {
      if (!state.user) return state;
      const newPm = { ...pm, id: "pm_" + Math.random().toString(36).substr(2, 9) };
      const methods = [...state.user.paymentMethods];
      if (methods.length === 0 || newPm.isDefault) {
        newPm.isDefault = true;
        methods.forEach(m => m.isDefault = false);
      }
      return { user: { ...state.user, paymentMethods: [...methods, newPm] } };
    }),
    
    removePaymentMethod: (id) => set((state) => {
      if (!state.user) return state;
      return { user: { ...state.user, paymentMethods: state.user.paymentMethods.filter(m => m.id !== id) } };
    }),
    
    setDefaultPaymentMethod: (id) => set((state) => {
      if (!state.user) return state;
      return {
        user: {
          ...state.user,
          paymentMethods: state.user.paymentMethods.map(m => ({ ...m, isDefault: m.id === id }))
        }
      };
    })
  };
});
