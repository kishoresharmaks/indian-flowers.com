'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductDetail from '@/components/ProductDetail';
import { dispatchItemAdded } from '@/components/ItemAddedNotification';
import { openProductShareModal } from '@/components/ProductShareModal';
import { Product, ProductVariant } from '@/components/ProductCard';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function ProductClientRedirect({
  id,
  initialProduct,
  initialRelatedProducts = [],
}: {
  id: string;
  initialProduct?: Product | null;
  initialRelatedProducts?: Product[];
}) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(initialProduct || null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>(initialRelatedProducts || []);
  const [loading, setLoading] = useState<boolean>(!initialProduct);
  const [error, setError] = useState<string | null>(null);

  // Synchronized Wishlist & Cart states
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<any[]>([]);

  // Sync Wishlist from localStorage
  const syncWishlist = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('if_wishlist') || localStorage.getItem('wishlist');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setWishlist(parsed);
          return;
        }
      }
      setWishlist([]);
    } catch {
      setWishlist([]);
    }
  }, []);

  // Sync Cart from localStorage
  const syncCart = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('cart') || localStorage.getItem('if_cart');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setCartItems(parsed);
          return;
        }
      }
      setCartItems([]);
    } catch {
      setCartItems([]);
    }
  }, []);

  // Initialize and register event listeners
  useEffect(() => {
    syncWishlist();
    syncCart();

    const handleWishlistUpdated = () => syncWishlist();
    const handleCartUpdated = () => syncCart();

    window.addEventListener('wishlist-updated', handleWishlistUpdated);
    window.addEventListener('cart-updated', handleCartUpdated);
    window.addEventListener('storage', handleWishlistUpdated);
    window.addEventListener('storage', handleCartUpdated);

    return () => {
      window.removeEventListener('wishlist-updated', handleWishlistUpdated);
      window.removeEventListener('cart-updated', handleCartUpdated);
      window.removeEventListener('storage', handleWishlistUpdated);
      window.removeEventListener('storage', handleCartUpdated);
    };
  }, [syncWishlist, syncCart]);

  // Product fetching fallback if not hydrated by SSR
  useEffect(() => {
    if (initialProduct) {
      setProduct(initialProduct);
      setLoading(false);
      return;
    }

    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) throw new Error('Product not found');
        const data = await res.json();
        const fetchedProduct = data.data || data;
        setProduct(fetchedProduct);

        // Fetch related products if needed
        if (fetchedProduct && fetchedProduct.category && (!initialRelatedProducts || initialRelatedProducts.length === 0)) {
          try {
            const relRes = await fetch(`/api/products?category=${encodeURIComponent(fetchedProduct.category)}`);
            if (relRes.ok) {
              const relData = await relRes.json();
              const items = (relData.data || relData || []).filter(
                (p: any) => p._id !== fetchedProduct._id
              );
              setRelatedProducts(items.slice(0, 4));
            }
          } catch {}
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, initialProduct, initialRelatedProducts]);

  // Handle Wishlist Toggle
  const handleToggleWishlist = (targetProduct: Product) => {
    setWishlist((prev) => {
      const exists = prev.some((p) => p._id === targetProduct._id);
      const next = exists
        ? prev.filter((p) => p._id !== targetProduct._id)
        : [...prev, targetProduct];

      try {
        const json = JSON.stringify(next);
        localStorage.setItem('if_wishlist', json);
        localStorage.setItem('wishlist', json);
        window.dispatchEvent(new Event('wishlist-updated'));
      } catch (err) {
        console.error('Failed to persist wishlist:', err);
      }
      return next;
    });
  };

  // Handle Add to Cart for current product
  const handleAddToCart = (variant?: ProductVariant, quantity: number = 1) => {
    if (!product) return;
    try {
      const raw = localStorage.getItem('cart') || localStorage.getItem('if_cart');
      const currentCart = raw ? JSON.parse(raw) : [];
      const itemPrice = variant ? variant.price : product.price;

      const existingIndex = currentCart.findIndex(
        (i: any) =>
          i.product._id === product._id &&
          (variant ? i.selectedVariant?.name === variant.name : !i.selectedVariant)
      );

      let nextCart;
      if (existingIndex > -1) {
        nextCart = currentCart.map((item: any, idx: number) =>
          idx === existingIndex ? { ...item, quantity: item.quantity + quantity } : item
        );
      } else {
        nextCart = [
          ...currentCart,
          {
            product: {
              _id: product._id,
              name: product.name,
              image: product.image,
              price: itemPrice,
              gst: product.gst || 0,
            },
            selectedVariant: variant ? { name: variant.name, price: variant.price } : undefined,
            quantity,
          },
        ];
      }
      const json = JSON.stringify(nextCart);
      localStorage.setItem('cart', json);
      localStorage.setItem('if_cart', json);
      setCartItems(nextCart);
      window.dispatchEvent(new Event('cart-updated'));
      dispatchItemAdded({
        product: {
          _id: product._id,
          name: product.name,
          image: product.image,
          price: itemPrice,
        },
        variant: variant ? { name: variant.name, price: variant.price } : undefined,
        quantity,
      });
    } catch (err) {
      console.error('Failed to add to cart:', err);
    }
  };

  // Handle Add to Cart for Related Products
  const handleAddRelatedToCart = (relProduct: Product, variant?: ProductVariant) => {
    try {
      const raw = localStorage.getItem('cart') || localStorage.getItem('if_cart');
      const currentCart = raw ? JSON.parse(raw) : [];
      const itemPrice = variant ? variant.price : relProduct.price;

      const existingIndex = currentCart.findIndex(
        (i: any) =>
          i.product._id === relProduct._id &&
          (variant ? i.selectedVariant?.name === variant.name : !i.selectedVariant)
      );

      let nextCart;
      if (existingIndex > -1) {
        nextCart = currentCart.map((item: any, idx: number) =>
          idx === existingIndex ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        nextCart = [
          ...currentCart,
          {
            product: {
              _id: relProduct._id,
              name: relProduct.name,
              image: relProduct.image,
              price: itemPrice,
              gst: relProduct.gst || 0,
            },
            selectedVariant: variant ? { name: variant.name, price: variant.price } : undefined,
            quantity: 1,
          },
        ];
      }
      const json = JSON.stringify(nextCart);
      localStorage.setItem('cart', json);
      localStorage.setItem('if_cart', json);
      setCartItems(nextCart);
      window.dispatchEvent(new Event('cart-updated'));
      dispatchItemAdded({
        product: {
          _id: relProduct._id,
          name: relProduct.name,
          image: relProduct.image,
          price: itemPrice,
        },
        variant: variant ? { name: variant.name, price: variant.price } : undefined,
        quantity: 1,
      });
    } catch (err) {
      console.error('Failed to add related product to cart:', err);
    }
  };

  // Handle Share Modal
  const handleShare = () => {
    if (product) {
      openProductShareModal(product);
    }
  };

  // Header Actions
  const handleOpenCart = () => {
    window.dispatchEvent(new Event('open-cart'));
  };

  const handleOpenWishlist = () => {
    window.dispatchEvent(new Event('open-wishlist'));
  };

  const handleTrack = () => {
    router.push('/?action=track');
  };

  const cartItemCount = cartItems.reduce(
    (sum, item) => sum + (Number(item.quantity) || 1),
    0
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col justify-between">
        <Header
          cartItemCount={cartItemCount}
          wishlistCount={wishlist.length}
          onCartClick={handleOpenCart}
          onWishlistClick={handleOpenWishlist}
          onTrackClick={handleTrack}
        />
        <div className="flex-1 flex flex-col items-center justify-center py-24 space-y-4">
          <div className="w-10 h-10 border-3 border-[#0B3B24] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-widest">
            Preparing Fresh Floral Details...
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col justify-between">
        <Header
          cartItemCount={cartItemCount}
          wishlistCount={wishlist.length}
          onCartClick={handleOpenCart}
          onWishlistClick={handleOpenWishlist}
          onTrackClick={handleTrack}
        />
        <div className="flex-1 flex flex-col items-center justify-center space-y-5 p-8 text-center max-w-md mx-auto my-12">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 shadow-xs">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight font-jakarta">
              Flower Not Found
            </h1>
            <p className="text-xs text-stone-500 leading-relaxed font-jakarta">
              {error || 'This floral product is currently unavailable, out of season, or moved.'}
            </p>
          </div>
          <Link
            href="/#products-section"
            className="px-6 py-3 rounded-xl bg-[#0B3B24] hover:bg-[#134633] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5"
          >
            <span>Explore All Fresh Flowers</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const isCurrentWishlisted = wishlist.some((w) => w._id === product._id);

  return (
    <div className="min-h-[100dvh] flex flex-col justify-between bg-[#FAF9F6] text-gray-900">
      <Header
        cartItemCount={cartItemCount}
        wishlistCount={wishlist.length}
        onCartClick={handleOpenCart}
        onWishlistClick={handleOpenWishlist}
        onTrackClick={handleTrack}
      />
      <main className="flex-1">
        <ProductDetail
          product={product}
          isWishlisted={isCurrentWishlisted}
          onToggleWishlist={handleToggleWishlist}
          onAddToCart={handleAddToCart}
          onShare={handleShare}
          loading={loading}
          relatedProducts={relatedProducts}
          onRelatedProductAddToCart={handleAddRelatedToCart}
          onRelatedProductClick={(prod) => router.push(`/product/${prod._id}`)}
        />
      </main>
      <Footer />
    </div>
  );
}
