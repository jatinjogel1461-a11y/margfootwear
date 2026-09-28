import { createFileRoute, Link } from '@tanstack/react-router'
import { Heart } from 'lucide-react'
import { useWishlist } from '@/lib/wishlist-store'
import { getProduct } from '@/lib/products'
import { ProductCard } from '@/components/ProductCard'
import { useAuthStore } from '@/lib/auth-store'

export const Route = createFileRoute('/wishlist')({
  component: Wishlist,
})

function Wishlist() {
  const { wishlistIds, isLoaded } = useWishlist();
  const { isAuthenticated } = useAuthStore();
  
  // Temporary console.log
  console.log("Saved slugs:", wishlistIds);
  const mappedProducts = wishlistIds.map(id => getProduct(id)).filter(Boolean);
  console.log("Mapped products count:", mappedProducts.length);

  return (
    <div className="min-h-[80vh] px-4 pt-28 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold mb-2">My Wishlist</h1>
        <p className="text-muted-foreground">Your favorite sneakers, saved for later.</p>
      </div>

      {!isLoaded && isAuthenticated ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse bg-surface border border-border rounded-2xl aspect-square" />
          ))}
        </div>
      ) : mappedProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-surface/50 rounded-3xl border border-border">
          <div className="h-20 w-20 bg-secondary/50 rounded-full flex items-center justify-center mb-6">
            <Heart className="h-10 w-10 text-muted-foreground opacity-50" />
          </div>
          <h2 className="text-2xl font-display font-bold mb-4">Your wishlist is empty</h2>
          <p className="text-muted-foreground max-w-md mb-8">
            You haven't saved any items yet. Keep exploring to find your perfect pair of sneakers.
          </p>
          <Link 
            to="/new-arrivals" 
            className="bg-neon text-neon-foreground px-8 py-3 rounded-full font-semibold hover:opacity-90 transition-opacity"
          >
            Explore Collection
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 pb-20">
          {mappedProducts.map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
