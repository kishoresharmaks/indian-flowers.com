'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard, { Product, ProductVariant } from '@/components/ProductCard';
import FloatingCartBar from '@/components/FloatingCartBar';
import { dispatchItemAdded } from '@/components/ItemAddedNotification';
import { ChevronRight, ArrowUpDown, Filter, Sparkles, ShoppingBag } from 'lucide-react';

interface Props {
  categorySlug: string;
  categoryName: string;
  categoryDescription?: string;
  initialProducts: Product[];
  initialNextCursor?: string | null;
  initialHasMore?: boolean;
  initialTotalCount?: number;
}

export default function CategoryClientPage({
  categorySlug,
  categoryName,
  categoryDescription,
  initialProducts = [],
  initialNextCursor = null,
  initialHasMore = false,
  initialTotalCount = 0,
}: Props) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [hasMore, setHasMore] = useState<boolean>(initialHasMore);
  const [totalCount, setTotalCount] = useState<number>(initialTotalCount || initialProducts.length);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isChangingSort, setIsChangingSort] = useState(false);
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'name'>('featured');
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);

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

  // Handle Add to Cart
  const handleAddToCart = (targetProduct: Product, variant?: ProductVariant) => {
    try {
      const raw = localStorage.getItem('cart') || localStorage.getItem('if_cart');
      const currentCart = raw ? JSON.parse(raw) : [];
      const itemPrice = variant ? variant.price : targetProduct.price;

      const existingIndex = currentCart.findIndex(
        (i: any) =>
          i.product._id === targetProduct._id &&
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
              _id: targetProduct._id,
              name: targetProduct.name,
              image: targetProduct.image,
              price: itemPrice,
              gst: targetProduct.gst || 0,
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
          _id: targetProduct._id,
          name: targetProduct.name,
          image: targetProduct.image,
          price: itemPrice,
        },
        variant: variant ? { name: variant.name, price: variant.price } : undefined,
        quantity: 1,
      });
    } catch (err) {
      console.error('Failed to add to cart:', err);
    }
  };

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

  // Cursor-Based Sort Switching
  const handleSortChange = async (newSort: 'featured' | 'price-asc' | 'price-desc' | 'name') => {
    setSortBy(newSort);
    setIsChangingSort(true);
    try {
      const res = await fetch(
        `/api/products?categorySlug=${encodeURIComponent(categorySlug)}&sortBy=${newSort}&limit=16&paginate=true`
      );
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setProducts(data.data);
        setNextCursor(data.nextCursor || null);
        setHasMore(!!data.hasMore);
        if (typeof data.totalCount === 'number') {
          setTotalCount(data.totalCount);
        }
      }
    } catch (err) {
      console.error('Failed to change sort order:', err);
    } finally {
      setIsChangingSort(false);
    }
  };

  // Cursor-Based "Load More" Stream
  const handleLoadMore = async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const res = await fetch(
        `/api/products?categorySlug=${encodeURIComponent(categorySlug)}&sortBy=${sortBy}&cursor=${encodeURIComponent(nextCursor)}&limit=16&paginate=true`
      );
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setProducts((prev) => [...prev, ...data.data]);
        setNextCursor(data.nextCursor || null);
        setHasMore(!!data.hasMore);
        if (typeof data.totalCount === 'number') {
          setTotalCount(data.totalCount);
        }
      }
    } catch (err) {
      console.error('Failed to load more products:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const cartItemCount = cartItems.reduce(
    (sum, item) => sum + (Number(item.quantity) || 1),
    0
  );

  const cartGrandTotal = cartItems.reduce(
    (sum, item) => sum + (Number(item.product?.price || item.selectedVariant?.price || 0) * (Number(item.quantity) || 1)),
    0
  );

  const progressPercent = Math.min(100, Math.round((products.length / Math.max(1, totalCount)) * 100));

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col justify-between selection:bg-[#0B3B24] selection:text-white">
      <Header
        cartItemCount={cartItemCount}
        wishlistCount={wishlist.length}
        onCartClick={() => window.dispatchEvent(new Event('open-cart'))}
        onWishlistClick={() => window.dispatchEvent(new Event('open-wishlist'))}
        onTrackClick={() => router.push('/?action=track')}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center space-x-2 text-xs sm:text-sm text-stone-500">
            <li>
              <Link href="/" className="hover:text-[#0B3B24] transition-colors">
                Home
              </Link>
            </li>
            <li>
              <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
            </li>
            <li>
              <Link href="/shop" className="hover:text-[#0B3B24] transition-colors">
                Collections
              </Link>
            </li>
            <li>
              <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
            </li>
            <li className="font-semibold text-[#0B3B24] truncate max-w-[200px] sm:max-w-none">
              {categoryName}
            </li>
          </ol>
        </nav>

        {/* Hero Header */}
        <div className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#0B3B24] via-[#134633] to-[#1C563F] text-white p-6 sm:p-10 lg:p-12 mb-8 sm:mb-12 overflow-hidden shadow-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(200,90,120,0.15),transparent_50%)] pointer-events-none" />
          <div className="relative z-10 max-w-3xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-white/10 text-emerald-200 border border-white/10 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Fresh Indian Floral Collection
            </span>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-3">
              {categoryName}
            </h1>
            <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed font-normal">
              {categoryDescription ||
                `Explore our handcrafted collection of authentic ${categoryName.toLowerCase()}. Shipped fresh via priority cold-chain delivery nationwide across the United States.`}
            </p>
            <div className="mt-4 flex items-center gap-4 text-xs sm:text-sm text-emerald-200/80">
              <span>{totalCount} {totalCount === 1 ? 'Product Available' : 'Products Available'}</span>
              <span>•</span>
              <span>100% Guaranteed Freshness</span>
              <span>•</span>
              <span>USD ($) Direct Pricing</span>
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-stone-200">
          <div>
            <div className="text-sm text-stone-600 font-medium">
              Showing <span className="font-semibold text-stone-900">{products.length}</span> of <span className="font-semibold text-stone-900">{totalCount}</span> handcrafted designs
            </div>
            <div className="w-48 sm:w-64 bg-stone-200 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div
                className="bg-gradient-to-r from-[#0B3B24] to-[#2F6B4F] h-full transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label htmlFor="sort-select" className="text-xs font-semibold text-stone-500 uppercase tracking-wider flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" />
              Sort:
            </label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value as any)}
              disabled={isChangingSort}
              className="text-xs sm:text-sm font-medium bg-white border border-stone-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0B3B24] text-stone-800 disabled:opacity-50"
            >
              <option value="featured">Featured / Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name">Product Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        {products.length > 0 ? (
          <>
            <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 transition-opacity duration-200 ${isChangingSort ? 'opacity-50' : 'opacity-100'}`}>
              {products.map((prod) => (
                <ProductCard
                  key={prod._id}
                  product={prod}
                  isWishlisted={wishlist.some((w) => w._id === prod._id)}
                  onToggleWishlist={handleToggleWishlist}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="mt-10 sm:mt-14 text-center flex flex-col items-center">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#0B3B24] to-[#1C563F] hover:from-[#134633] hover:to-[#2F6B4F] text-white font-bold text-sm transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-2.5 cursor-pointer border border-emerald-400/20"
                >
                  {isLoadingMore ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Loading Handcrafted Flowers...</span>
                    </>
                  ) : (
                    <>
                      <span>Load More Products</span>
                      <span className="text-xs bg-white/20 text-emerald-100 px-2 py-0.5 rounded-full font-semibold">
                        {Math.max(0, totalCount - products.length)} more
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}

            {!hasMore && products.length > 0 && (
              <div className="mt-12 text-center text-xs sm:text-sm text-stone-500 font-medium py-3 px-4 rounded-xl bg-stone-100/70 border border-stone-200/60 max-w-md mx-auto">
                🌿 You have viewed all {totalCount} handcrafted arrangements in {categoryName}.
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center max-w-lg mx-auto my-12 shadow-sm">
            <div className="w-16 h-16 mx-auto mb-4 bg-emerald-50 text-[#0B3B24] rounded-full flex items-center justify-center">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-stone-900 mb-2">
              Fresh Inventory Arriving Soon
            </h3>
            <p className="text-sm text-stone-500 mb-6">
              We are currently handcrafting new arrangements for {categoryName}. Check back shortly or browse our other festive collections.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-[#0B3B24] text-white text-sm font-semibold hover:bg-[#1C563F] transition-all"
            >
              Browse All Collections
            </Link>
          </div>
        )}
      </main>

      <FloatingCartBar
        cartItemCount={cartItemCount}
        cartGrandTotal={cartGrandTotal}
        onOpenCart={() => window.dispatchEvent(new Event('open-cart'))}
      />
      <Footer />
    </div>
  );
}
