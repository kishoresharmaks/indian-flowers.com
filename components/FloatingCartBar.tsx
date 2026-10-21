'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

interface FloatingCartBarProps {
  cartItemCount: number;
  cartGrandTotal: number;
  onOpenCart: () => void;
  isCartOpen?: boolean;
  isCheckoutOpen?: boolean;
  isMobileMenuOpen?: boolean;
}

export default function FloatingCartBar({
  cartItemCount,
  cartGrandTotal,
  onOpenCart,
  isCartOpen = false,
  isCheckoutOpen = false,
  isMobileMenuOpen = false,
}: FloatingCartBarProps) {
  const [badgeBouncing, setBadgeBouncing] = useState(false);
  const [showFlowerBurst, setShowFlowerBurst] = useState(false);
  const prevCountRef = useRef(cartItemCount);

  const [delayedHide, setDelayedHide] = useState(isMobileMenuOpen);

  // Smoothly sync delayed hide with mobile drawer animation (300ms)
  useEffect(() => {
    if (isMobileMenuOpen) {
      setDelayedHide(true);
    } else {
      const timer = setTimeout(() => setDelayedHide(false), 320);
      return () => clearTimeout(timer);
    }
  }, [isMobileMenuOpen]);

  // Trigger bounce and flower pop animation when an item is added
  useEffect(() => {
    if (cartItemCount > prevCountRef.current) {
      setBadgeBouncing(true);
      setShowFlowerBurst(true);

      const bounceTimer = setTimeout(() => setBadgeBouncing(false), 700);
      const burstTimer = setTimeout(() => setShowFlowerBurst(false), 1400);

      prevCountRef.current = cartItemCount;
      return () => {
        clearTimeout(bounceTimer);
        clearTimeout(burstTimer);
      };
    }
    prevCountRef.current = cartItemCount;
  }, [cartItemCount]);

  if (cartItemCount <= 0 || isCartOpen || isCheckoutOpen || isMobileMenuOpen || delayedHide) {
    return null;
  }

  return (
    <>
      {/* Inline Keyframes for Floating, Badge Bounce, and Flower Pop Animations */}
      <style jsx global>{`
        @keyframes cartIdleFloat {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-3px);
          }
        }
        @keyframes badgeScaleBounce {
          0% {
            transform: scale(1);
          }
          30% {
            transform: scale(1.42);
          }
          60% {
            transform: scale(0.88);
          }
          80% {
            transform: scale(1.12);
          }
          100% {
            transform: scale(1);
          }
        }
        @keyframes flowerParticle1 {
          0% {
            opacity: 0;
            transform: translate(0, 10px) scale(0.3) rotate(0deg);
          }
          40% {
            opacity: 1;
            transform: translate(-14px, -26px) scale(1.15) rotate(-20deg);
          }
          75% {
            opacity: 0.9;
            transform: translate(-10px, -18px) scale(1) rotate(-10deg);
          }
          100% {
            opacity: 0;
            transform: translate(-4px, 6px) scale(0.4) rotate(0deg);
          }
        }
        @keyframes flowerParticle2 {
          0% {
            opacity: 0;
            transform: translate(0, 10px) scale(0.3) rotate(0deg);
          }
          40% {
            opacity: 1;
            transform: translate(2px, -34px) scale(1.25) rotate(25deg);
          }
          75% {
            opacity: 0.9;
            transform: translate(1px, -24px) scale(1) rotate(15deg);
          }
          100% {
            opacity: 0;
            transform: translate(0px, 6px) scale(0.4) rotate(0deg);
          }
        }
        @keyframes flowerParticle3 {
          0% {
            opacity: 0;
            transform: translate(0, 10px) scale(0.3) rotate(0deg);
          }
          40% {
            opacity: 1;
            transform: translate(18px, -24px) scale(1.1) rotate(35deg);
          }
          75% {
            opacity: 0.9;
            transform: translate(14px, -16px) scale(0.95) rotate(20deg);
          }
          100% {
            opacity: 0;
            transform: translate(8px, 6px) scale(0.4) rotate(0deg);
          }
        }
      `}</style>

      {/* Floating Cart Pill Wrapper with Subtle Idle Float (Moves up/down 3px, positioned above mobile toolbar) */}
      <aside
        aria-label="Floating shopping cart summary"
        className="fixed inset-x-4 bottom-[calc(4rem+env(safe-area-inset-bottom))] sm:inset-x-auto sm:right-6 sm:bottom-6 z-36 flex justify-center pointer-events-none"
      >
        <div
          className="pointer-events-auto [animation:cartIdleFloat_3s_ease-in-out_infinite] motion-reduce:[animation:none]"
        >
          <button
            onClick={onOpenCart}
            aria-label={`View shopping cart with ${cartItemCount} items, total ${formatCurrency(cartGrandTotal)}`}
            className={`group relative flex items-center justify-between sm:justify-center gap-3.5 sm:gap-4 bg-[#0B3B24] hover:bg-[#072718] active:bg-[#051e12] text-white pl-3.5 pr-5 py-2.5 sm:pl-4 sm:pr-6 sm:py-3 rounded-full shadow-[0_12px_32px_rgba(11,59,36,0.38)] border border-white/20 transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] motion-reduce:transform-none select-none ${
              showFlowerBurst
                ? 'ring-2 ring-amber-300/80 shadow-[0_0_28px_rgba(245,158,11,0.55)] border-amber-300/50'
                : 'hover:shadow-[0_0_24px_rgba(52,211,153,0.45)] hover:border-emerald-400/50'
            }`}
          >
            {/* Basket Asset Container with Flowers & Dynamic Count Badge */}
            <div className="relative flex-shrink-0 flex items-center justify-center -my-1.5 -ml-1">
              {/* Floral Basket SVG provided by user */}
              <img
                src="/indian-flowers-floral-basket.svg"
                alt="Floral Cart Basket"
                className="w-11 h-11 sm:w-12 sm:h-12 object-contain select-none pointer-events-none transition-transform duration-300 group-hover:rotate-[-3deg] motion-reduce:transform-none"
                draggable={false}
              />

              {/* Dynamic Coral-Red Count Badge with Bounce Animation */}
              <span
                className={`absolute -top-1 -right-1 min-w-[21px] h-[21px] px-1 rounded-full bg-[#E0533C] text-white text-[11px] font-bold flex items-center justify-center shadow-[0_2px_8px_rgba(224,83,60,0.6)] border-2 border-[#0B3B24] transition-all duration-200 select-none ${
                  badgeBouncing
                    ? '[animation:badgeScaleBounce_0.6s_cubic-bezier(0.34,1.56,0.64,1)]'
                    : 'scale-100'
                } motion-reduce:[animation:none]`}
              >
                {cartItemCount}
              </span>

              {/* Add to Cart Floating Flower Particles (State 3 Animation) */}
              {showFlowerBurst && (
                <div
                  aria-hidden="true"
                  className="absolute -top-3 left-1/2 -translate-x-1/2 pointer-events-none z-50 w-16 h-16 flex items-center justify-center motion-reduce:hidden"
                >
                  {/* Left Orange Flower */}
                  <div className="absolute [animation:flowerParticle1_1.2s_ease-out_forwards]">
                    <svg className="w-5 h-5 text-amber-500 fill-current drop-shadow-sm" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="4" fill="#F59E0B" />
                      <circle cx="12" cy="6" r="3" fill="#FB923C" />
                      <circle cx="12" cy="18" r="3" fill="#FB923C" />
                      <circle cx="6" cy="12" r="3" fill="#FB923C" />
                      <circle cx="18" cy="12" r="3" fill="#FB923C" />
                    </svg>
                  </div>

                  {/* Center Coral-Pink Flower */}
                  <div className="absolute [animation:flowerParticle2_1.3s_ease-out_forwards]">
                    <svg className="w-6 h-6 text-rose-500 fill-current drop-shadow-sm" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="3.5" fill="#FDE047" />
                      <circle cx="12" cy="5.5" r="3.5" fill="#F43F5E" />
                      <circle cx="12" cy="18.5" r="3.5" fill="#F43F5E" />
                      <circle cx="5.5" cy="12" r="3.5" fill="#F43F5E" />
                      <circle cx="18.5" cy="12" r="3.5" fill="#F43F5E" />
                    </svg>
                  </div>

                  {/* Right Golden Daisy Flower */}
                  <div className="absolute [animation:flowerParticle3_1.2s_ease-out_forwards]">
                    <svg className="w-5 h-5 text-yellow-400 fill-current drop-shadow-sm" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="3.5" fill="#EA580C" />
                      <circle cx="12" cy="6" r="3" fill="#FACC15" />
                      <circle cx="12" cy="18" r="3" fill="#FACC15" />
                      <circle cx="6" cy="12" r="3" fill="#FACC15" />
                      <circle cx="18" cy="12" r="3" fill="#FACC15" />
                    </svg>
                  </div>
                </div>
              )}
            </div>

            {/* Cart Amount Text */}
            <span className="text-sm sm:text-[15px] font-bold tracking-tight text-white whitespace-nowrap">
              View cart ({formatCurrency(cartGrandTotal)})
            </span>

            {/* Right Arrow Icon */}
            <ArrowRight className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-white/90 group-hover:text-white group-hover:translate-x-1 transition-all duration-200 flex-shrink-0" />
          </button>
        </div>
      </aside>
    </>
  );
}
