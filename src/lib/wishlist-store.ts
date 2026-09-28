import { create } from 'zustand';
import { supabase } from './supabaseClient';
import { toast } from 'sonner';

interface WishlistState {
  wishlistIds: string[];
  isLoaded: boolean;
  pending: Record<string, boolean>;
  isWishlisted: (productId: string) => boolean;
  load: (userId: string) => Promise<void>;
  toggle: (productId: string, userId: string) => Promise<void>;
}

export const useWishlist = create<WishlistState>((set, get) => ({
  wishlistIds: [],
  isLoaded: false,
  pending: {},
  isWishlisted: (productId) => get().wishlistIds.includes(productId),
  
  load: async (userId) => {
    if (!userId) {
      set({ wishlistIds: [], isLoaded: false });
      return;
    }
    const { data, error } = await supabase
      .from('wishlist')
      .select('product_id')
      .eq('user_id', userId);
      
    if (error) {
      console.error("Failed to load wishlist", error);
      return;
    }
    set({ wishlistIds: data.map(row => row.product_id), isLoaded: true });
  },
  
  toggle: async (productId, userId) => {
    if (!userId) return;
    if (get().pending[productId]) return;
    
    const isCurrentlyWishlisted = get().wishlistIds.includes(productId);
    
    // Optimistic UI update
    set((state) => ({
      pending: { ...state.pending, [productId]: true },
      wishlistIds: isCurrentlyWishlisted 
        ? state.wishlistIds.filter(id => id !== productId)
        : [productId, ...state.wishlistIds] // Add to start
    }));
    
    let error = null;
    
    if (isCurrentlyWishlisted) {
      const res = await supabase.from('wishlist').delete().match({ user_id: userId, product_id: productId });
      error = res.error;
    } else {
      const res = await supabase.from('wishlist').insert({ user_id: userId, product_id: productId });
      error = res.error;
    }
    
    if (error) {
      toast.error(error.message || "Failed to update wishlist");
      // Revert optimistic update
      set((state) => ({
        wishlistIds: isCurrentlyWishlisted 
          ? [productId, ...state.wishlistIds]
          : state.wishlistIds.filter(id => id !== productId)
      }));
    }
    
    set((state) => {
      const newPending = { ...state.pending };
      delete newPending[productId];
      return { pending: newPending };
    });
  }
}));
