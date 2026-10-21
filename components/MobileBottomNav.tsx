'use client';

import React, { useState, useEffect, useRef } from 'react';
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
      className={`fixed bottom-[72px] right-4 z-40 flex h-[52px] w-[52px] md:h-14 md:w-14 items-center justify-center rounded-full bg-gradient-to-tr from-[#1EBE5D] to-[#25D366] text-white shadow-[0_8px_24px_rgba(37,211,102,0.45),0_2px_6px_rgba(0,0,0,0.12)] border-2 border-white hover:shadow-[0_10px_28px_rgba(37,211,102,0.65)] hover:scale-108 active:scale-95 transition-all duration-300 md:bottom-6 md:right-6 cursor-pointer group ${className}`}
      title="Chat with us on WhatsApp"
    >
      {/* Soft pulse glow ring behind the button */}
      <span className="absolute -inset-1 rounded-full bg-[#25D366]/30 animate-pulse pointer-events-none -z-10" />

      {/* Online indicator live badge */}
      <span className="absolute top-0.5 right-0.5 flex h-3.5 w-3.5 items-center justify-center pointer-events-none">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 border border-white" />
      </span>

      {/* Crisp Official WhatsApp Solid Icon Vector */}
      <svg
        className="w-7 h-7 md:w-8 md:h-8 fill-white drop-shadow-xs"
        viewBox="0 0 32 32"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path d="M16 2.5C8.544 2.5 2.5 8.544 2.5 16c0 2.57.72 4.975 1.97 7.025L2.5 29.5l6.738-1.763A13.415 13.415 0 0016 29.5c7.456 0 13.5-6.044 13.5-13.5S23.456 2.5 16 2.5zm7.3 18.275c-.3.844-1.75 1.625-2.438 1.725-.631.094-1.425.131-2.3-.15-.55-.175-1.25-.4-2.125-.788-3.738-1.631-6.175-5.406-6.363-5.656-.188-.25-1.519-2.025-1.519-3.863 0-1.838.963-2.744 1.3-3.119.338-.375.738-.469 1-.469.263 0 .525.006.75.019.238.012.556-.094.869.656.325.775 1.106 2.7 1.206 2.9.1.2.169.438.038.7-.131.263-.2.425-.394.656-.194.231-.413.513-.588.688-.2.2-.413.419-.181.819.231.4 1.031 1.7 2.219 2.756 1.525 1.356 2.813 1.775 3.213 1.975.4.2.631.169.863-.1.231-.269.988-1.15 1.25-1.544.263-.394.525-.331.881-.2.356.131 2.269 1.069 2.656 1.263.388.194.65.294.75.463.1.169.1.981-.2 1.825z" />
      </svg>

      {/* Desktop Tooltip Pill on Hover */}
      <span className="hidden md:group-hover:flex absolute right-full mr-3 top-1/2 -translate-y-1/2 items-center bg-stone-900/90 text-white text-[12px] font-semibold px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap pointer-events-none transition-all">
        Chat with us on WhatsApp
        <span className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-stone-900/90" />
      </span>
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
      className="fixed bottom-[134px] right-5.5 z-40 flex h-9 w-9 items-center justify-center rounded-full bg-white text-stone-700 shadow-[0_2px_10px_rgba(0,0,0,0.15)] border border-stone-200 hover:bg-[#0B3B24] hover:text-white transition-all active:scale-90 cursor-pointer md:bottom-24 md:right-7.5"
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
  const [isBouncing, setIsBouncing] = useState(false);
  const prevCountRef = useRef(cartCount);

  // Trigger playful bounce when cart item count increases
  useEffect(() => {
    if (cartCount > prevCountRef.current) {
      setIsBouncing(true);
      const timer = setTimeout(() => setIsBouncing(false), 500);
      return () => clearTimeout(timer);
    }
    prevCountRef.current = cartCount;
  }, [cartCount]);

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
            <span
              className={`absolute -top-1.5 -right-2.5 bg-[#ed2353] text-white text-[9px] font-bold min-w-[15px] h-[15px] px-0.5 rounded-full flex items-center justify-center shadow-xs transition-transform duration-300 ${
                isBouncing ? 'scale-135 ring-2 ring-pink-300' : 'scale-100'
              }`}
            >
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
