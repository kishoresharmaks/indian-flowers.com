'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Store, Heart, ShoppingBag, User, ChevronUp } from 'lucide-react';

interface MobileBottomNavProps {
  cartCount?: number;
  wishlistCount?: number;
  onOpenCart?: () => void;
  onOpenWishlist?: () => void;
  onOpenShop?: () => void;
  customer?: any;
  phone?: string;
}

export function WhatsAppFloatingButton({
  phone = '+1 (909) 379-3678',
  className = '',
}: {
  phone?: string;
  className?: string;
}) {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    'Hello! I would like to inquire about fresh Indian flowers and wedding garlands.'
  )}`;

  return (
    <a
      href={waUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className={`fixed bottom-18 right-3.5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_4px_16px_rgba(37,211,102,0.45)] hover:bg-[#20ba59] hover:scale-105 active:scale-95 transition-all md:bottom-6 md:right-6 md:h-13 md:w-13 cursor-pointer ${className}`}
      title="Chat on WhatsApp"
    >
      <svg
        className="w-6.5 h-6.5 fill-current"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M17.472 14.382c-.301-.15-1.78-.879-2.056-.98-.276-.1-.477-.15-.678.15-.201.3-.778.98-.954 1.18-.175.2-.351.226-.652.075-.301-.15-1.272-.469-2.423-1.496-.896-.799-1.501-1.787-1.677-2.088-.176-.3-.019-.463.132-.613.136-.134.301-.35.452-.525.15-.175.2-.3.301-.5.101-.2.05-.376-.025-.526-.075-.15-.678-1.634-.93-2.239-.244-.589-.493-.509-.678-.519-.176-.01-.377-.01-.578-.01-.201 0-.527.075-.803.376s-1.055 1.03-1.055 2.511 1.08 2.912 1.231 3.113c.15.2 2.126 3.247 5.15 4.555.719.311 1.281.497 1.719.636.722.23 1.378.197 1.898.12.579-.087 1.78-.727 2.03-1.43.251-.703.251-1.306.176-1.43-.075-.125-.276-.201-.577-.351zM12.04 21.785c-1.758 0-3.483-.463-5.006-1.341l-.359-.208-3.722.977.994-3.628-.233-.371A9.816 9.816 0 012.28 12.04c0-5.385 4.38-9.765 9.765-9.765 2.609 0 5.061 1.017 6.905 2.862 1.846 1.845 2.862 4.298 2.862 6.908 0 5.386-4.38 9.74-9.772 9.74zm0-17.785a8.03 8.03 0 00-6.953 12.038l.439.699-.58 2.119 2.167-.568.678.402a8.026 8.026 0 004.249 1.207c4.437 0 8.043-3.606 8.043-8.044 0-2.148-.836-4.168-2.355-5.688A8.005 8.005 0 0012.04 4z" />
      </svg>
    </a>
  );
}

export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const checkScroll = () => {
      setVisible(window.scrollY > 300);
    };
    window.addEventListener('scroll', checkScroll, { passive: true });
    return () => window.removeEventListener('scroll', checkScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className="fixed bottom-32 right-4 z-40 flex h-9 w-9 items-center justify-center rounded-full bg-white text-stone-700 shadow-[0_2px_10px_rgba(0,0,0,0.15)] border border-stone-200 hover:bg-[#0B3B24] hover:text-white transition-all active:scale-90 cursor-pointer md:bottom-22 md:right-7"
      title="Back to top"
    >
      <ChevronUp className="w-5 h-5 stroke-[2.2]" />
    </button>
  );
}

export default function MobileBottomNav({
  cartCount = 0,
  wishlistCount = 0,
  onOpenCart,
  onOpenWishlist,
  onOpenShop,
  customer,
}: MobileBottomNavProps) {
  const router = useRouter();

  const handleShopClick = () => {
    if (onOpenShop) {
      onOpenShop();
    } else {
      router.push('/#products-section');
    }
  };

  const handleWishlistClick = () => {
    if (onOpenWishlist) {
      onOpenWishlist();
    } else {
      router.push('/?action=wishlist');
    }
  };

  const handleCartClick = () => {
    if (onOpenCart) {
      onOpenCart();
    } else {
      router.push('/?checkout=true');
    }
  };

  const handleAccountClick = () => {
    if (customer) {
      router.push('/account');
    } else {
      router.push('/login');
    }
  };

  return (
    <>
      {/* 100% Solid Opaque White Mobile Bottom Navigation Bar (z-50) */}
      <nav
        aria-label="Mobile Navigation Toolbar"
        className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-stone-200/90 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] px-2 py-1.5 flex items-center justify-around h-14"
        style={{ backgroundColor: '#ffffff', opacity: 1 }}
      >
        {/* 1. Shop */}
        <button
          type="button"
          onClick={handleShopClick}
          className="flex flex-col items-center justify-center flex-1 py-1 text-stone-700 hover:text-[#0B3B24] active:scale-95 transition-all cursor-pointer"
        >
          <Store className="w-4.5 h-4.5 stroke-[2.2]" />
          <span className="text-[10.5px] font-semibold tracking-tight mt-0.5">Shop</span>
        </button>

        {/* 2. Wishlist */}
        <button
          type="button"
          onClick={handleWishlistClick}
          className="flex flex-col items-center justify-center flex-1 py-1 text-stone-700 hover:text-[#ed2353] active:scale-95 transition-all relative cursor-pointer"
        >
          <div className="relative">
            <Heart className="w-4.5 h-4.5 stroke-[2.2]" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-[#ed2353] text-white text-[9px] font-bold min-w-[15px] h-[15px] px-0.5 rounded-full flex items-center justify-center shadow-xs">
                {wishlistCount}
              </span>
            )}
          </div>
          <span className="text-[10.5px] font-semibold tracking-tight mt-0.5">Wishlist</span>
        </button>

        {/* 3. Cart with Pink Badge */}
        <button
          type="button"
          onClick={handleCartClick}
          className="flex flex-col items-center justify-center flex-1 py-1 text-stone-700 hover:text-[#ed2353] active:scale-95 transition-all relative cursor-pointer"
        >
          <div className="relative">
            <ShoppingBag className="w-4.5 h-4.5 stroke-[2.2]" />
            <span className="absolute -top-1.5 -right-2.5 bg-[#ed2353] text-white text-[9px] font-bold min-w-[15px] h-[15px] px-0.5 rounded-full flex items-center justify-center shadow-xs">
              {cartCount}
            </span>
          </div>
          <span className="text-[10.5px] font-semibold tracking-tight mt-0.5">Cart</span>
        </button>

        {/* 4. My Account */}
        <button
          type="button"
          onClick={handleAccountClick}
          className="flex flex-col items-center justify-center flex-1 py-1 text-stone-700 hover:text-[#0B3B24] active:scale-95 transition-all cursor-pointer"
        >
          <User className="w-4.5 h-4.5 stroke-[2.2]" />
          <span className="text-[10.5px] font-semibold tracking-tight mt-0.5">
            {customer ? 'Account' : 'My account'}
          </span>
        </button>
      </nav>

      {/* Floating WhatsApp and Scroll to Top buttons */}
      <WhatsAppFloatingButton />
      <ScrollToTopButton />
    </>
  );
}
