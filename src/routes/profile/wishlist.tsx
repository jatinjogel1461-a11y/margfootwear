import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuthStore } from "../../lib/auth-store";
import { useWishlist } from "../../lib/wishlist-store";
import { supabase } from "../../lib/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { ProductCard } from "../../components/ProductCard";
import { getProduct } from "../../lib/products";

export const Route = createFileRoute("/profile/wishlist")({
  component: WishlistPage,
});

function WishlistPage() {
  const { user } = useAuthStore();
  
  const { data: wishlistProducts, isLoading } = useQuery({
    queryKey: ['wishlist-page', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wishlist')
        .select(`
          created_at,
          product_id
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error("Wishlist query error:", error);
        throw error;
      }
      
      return data.map((item: any) => {
        return getProduct(item.product_id);
      }).filter(Boolean);
    },
    enabled: !!user?.id
  });

  if (!user) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div>
        <h1 className="text-2xl font-display font-semibold mb-1">Wishlist</h1>
        <p className="text-sm text-muted-foreground">Your saved items for later.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse bg-[#1a1a18] rounded-2xl aspect-square" />
          ))}
        </div>
      ) : !wishlistProducts || wishlistProducts.length === 0 ? (
        <div className="bg-[#0e0e0d] border border-[#2a2a28] rounded-xl p-12 flex flex-col items-center justify-center text-center shadow-lg">
          <div className="w-16 h-16 bg-[#141413] rounded-full flex items-center justify-center mb-4">
            <Heart className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-1">Your wishlist is empty</h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">Save your favorite styles here so you can easily find them later.</p>
          <Link to="/new-arrivals" className="bg-neon text-neon-foreground px-6 py-3 rounded-full font-medium hover:bg-neon/90 transition-colors">
            Browse shoes
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {wishlistProducts.map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

    </div>
  );
}
