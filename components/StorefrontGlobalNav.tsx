'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import MobileBottomNav from './MobileBottomNav';
import CartDrawer from './CartDrawer';
import WishlistDrawer from './WishlistDrawer';
import ItemAddedNotification, { dispatchItemAdded } from './ItemAddedNotification';
import { Product } from './ProductCard';

interface CartItem {
  product: {
    _id: string;
    name: string;
    image: string;
    price?: number;
    gst: number;
  };
  selectedVariant?: {
    name: string;
    price: number;
  };
  quantity: number;
}

export default function StorefrontGlobalNav() {
  const pathname = usePathname();
  const router = useRouter();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const [customer, setCustomer] = useState<any | null>(null);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);

  // Sync Cart from localStorage (supports both 'cart' and 'if_cart')
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

  // Sync Wishlist from localStorage
  const syncWishlist = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('if_wishlist');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setWishlistItems(parsed);
          return;
        }
      }
      setWishlistItems([]);
    } catch {
      setWishlistItems([]);
    }
  }, []);

  // Initial loads and event listeners
  useEffect(() => {
    syncCart();
    syncWishlist();

    // Fetch customer profile
    fetch('/api/customer/me')
      .then((r) => r.json())
      .then((d) => {
        if (d && d.success && d.customer) {
          setCustomer(d.customer);
        }
      })
      .catch(() => {});

    const handleCartUpdated = () => syncCart();
    const handleWishlistUpdated = () => syncWishlist();
    const handleOpenCart = () => setIsCartOpen(true);
    const handleCloseCart = () => setIsCartOpen(false);
    const handleOpenWishlist = () => setIsWishlistOpen(true);
    const handleCloseWishlist = () => setIsWishlistOpen(false);

    window.addEventListener('cart-updated', handleCartUpdated);
    window.addEventListener('wishlist-updated', handleWishlistUpdated);
    window.addEventListener('open-cart', handleOpenCart);
    window.addEventListener('close-cart', handleCloseCart);
    window.addEventListener('open-wishlist', handleOpenWishlist);
    window.addEventListener('close-wishlist', handleCloseWishlist);
    window.addEventListener('storage', handleCartUpdated);

    return () => {
      window.removeEventListener('cart-updated', handleCartUpdated);
      window.removeEventListener('wishlist-updated', handleWishlistUpdated);
      window.removeEventListener('open-cart', handleOpenCart);
      window.removeEventListener('close-cart', handleCloseCart);
      window.removeEventListener('open-wishlist', handleOpenWishlist);
      window.removeEventListener('close-wishlist', handleCloseWishlist);
      window.removeEventListener('storage', handleCartUpdated);
    };
  }, [syncCart, syncWishlist]);

  // Ensure drawers are always closed upon any route navigation
  useEffect(() => {
    setIsCartOpen(false);
    setIsWishlistOpen(false);
  }, [pathname]);

  // NEVER render on admin, installation/setup, or customer auth pages (prevents cart drawer overlaying login/register)
  if (
    !pathname ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/setup') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register')
  ) {
    return null;
  }

  const isHomePage = pathname === '/';

  // Calculate totals for CartDrawer on standalone pages
  const subtotal = cartItems.reduce((acc, item) => {
    const price = item.selectedVariant ? item.selectedVariant.price : item.product.price || 0;
    return acc + price * item.quantity;
  }, 0);

  const gstTotal = cartItems.reduce((acc, item) => {
    const price = item.selectedVariant ? item.selectedVariant.price : item.product.price || 0;
    const gstRate = item.product.gst || 0;
    return acc + (price * item.quantity * gstRate) / 100;
  }, 0);

  const grandTotal = subtotal + gstTotal;
  const cartItemCount = cartItems.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);

  const handleUpdateQuantity = (
    productId: string,
    variantName: string | undefined,
    quantity: number
  ) => {
    let nextCart: CartItem[];
    if (quantity <= 0) {
      nextCart = cartItems.filter(
        (i) => !(i.product._id === productId && i.selectedVariant?.name === variantName)
      );
    } else {
      nextCart = cartItems.map((i) => {
        if (i.product._id === productId && i.selectedVariant?.name === variantName) {
          return { ...i, quantity };
        }
        return i;
      });
    }
    setCartItems(nextCart);
    const json = JSON.stringify(nextCart);
    if (nextCart.length > 0) {
      localStorage.setItem('cart', json);
      localStorage.setItem('if_cart', json);
    } else {
      localStorage.removeItem('cart');
      localStorage.removeItem('if_cart');
    }
    window.dispatchEvent(new Event('cart-updated'));
  };

  const handleRemoveItem = (productId: string, variantName?: string) => {
    const nextCart = cartItems.filter(
      (i) => !(i.product._id === productId && i.selectedVariant?.name === variantName)
    );
    setCartItems(nextCart);
    const json = JSON.stringify(nextCart);
    if (nextCart.length > 0) {
      localStorage.setItem('cart', json);
      localStorage.setItem('if_cart', json);
    } else {
      localStorage.removeItem('cart');
      localStorage.removeItem('if_cart');
    }
    window.dispatchEvent(new Event('cart-updated'));
  };

  const handleRemoveFromWishlist = (productId: string) => {
    const nextWishlist = wishlistItems.filter((w) => w._id !== productId);
    setWishlistItems(nextWishlist);
    localStorage.setItem('if_wishlist', JSON.stringify(nextWishlist));
    window.dispatchEvent(new Event('wishlist-updated'));
  };

  const handleAddWishlistToCart = (product: Product) => {
    const itemPrice = product.price;
    const existingIndex = cartItems.findIndex(
      (i) => i.product._id === product._id && !i.selectedVariant
    );

    let nextCart: CartItem[];
    if (existingIndex > -1) {
      nextCart = cartItems.map((item, index) =>
        index === existingIndex ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      nextCart = [
        ...cartItems,
        {
          product: {
            _id: product._id,
            name: product.name,
            image: product.image,
            price: itemPrice,
            gst: product.gst || 0,
          },
          quantity: 1,
        },
      ];
    }
    setCartItems(nextCart);
    const json = JSON.stringify(nextCart);
    localStorage.setItem('cart', json);
    localStorage.setItem('if_cart', json);
    window.dispatchEvent(new Event('cart-updated'));

    // Trigger auto-dismiss notification toast
    dispatchItemAdded({
      product: {
        _id: product._id,
        name: product.name,
        image: product.image,
        price: itemPrice,
      },
      quantity: 1,
    });
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('close-cart'));
    }
    if (!customer) {
      router.push('/login?redirect=checkout');
    } else {
      router.push('/?checkout=true');
    }
  };

  const handleOpenCartClick = () => {
    if (isHomePage) {
      window.dispatchEvent(new Event('open-cart'));
    } else {
      setIsCartOpen(true);
    }
  };

  const handleOpenWishlistClick = () => {
    if (isHomePage) {
      window.dispatchEvent(new Event('open-wishlist'));
    } else {
      setIsWishlistOpen(true);
    }
  };

  const handleOpenShopClick = () => {
    if (isHomePage) {
      const el = document.getElementById('products-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      router.push('/#products-section');
    }
  };

  return (
    <>
      {/* Universal Auto-dismiss Notification Toast: "Item added to cart" */}
      <ItemAddedNotification onViewCart={handleOpenCartClick} />

      {/* 100% Solid Opaque White Bottom Toolbar on All Storefront Mobile Pages */}
      <MobileBottomNav
        cartCount={cartItemCount}
        wishlistCount={wishlistItems.length}
        onOpenCart={handleOpenCartClick}
        onOpenWishlist={handleOpenWishlistClick}
        onOpenShop={handleOpenShopClick}
        customer={customer}
      />

      {/* Standalone Pages Global Cart & Wishlist Drawers (for /about, /product, /account, /policy) */}
      {!isHomePage && (
        <>
          <CartDrawer
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            onCheckout={handleCheckout}
            items={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onRemove={handleRemoveItem}
            subtotal={subtotal}
            gstTotal={gstTotal}
            grandTotal={grandTotal}
          />

          <WishlistDrawer
            isOpen={isWishlistOpen}
            onClose={() => setIsWishlistOpen(false)}
            items={wishlistItems}
            cartProductIds={cartItems.map((c) => c.product._id)}
            onRemoveFromWishlist={handleRemoveFromWishlist}
            onAddToCart={handleAddWishlistToCart}
          />
        </>
      )}
    </>
  );
}
