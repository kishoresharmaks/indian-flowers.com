'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import BrandLogo from '@/components/BrandLogo';
import { formatCurrency } from '@/lib/currency';
import {
  CheckCircle2,
  Clock,
  PackageCheck,
  Truck,
  Calendar,
  MapPin,
  ArrowRight,
  ShoppingBag,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Phone,
  Mail,
  User,
} from 'lucide-react';

interface OrderItem {
  productId: string;
  name: string;
  variantName?: string;
  price: number;
  quantity: number;
  image?: string;
}

interface OrderData {
  orderId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  shippingAddress: string;
  deliveryDate?: string;
  acknowledgedDeliveryTimeframe?: string;
  deliveryMode?: {
    name: string;
    type: string;
    price: number;
    description?: string;
  } | null;
  items: OrderItem[];
  totalAmount: number;
  shippingFee?: number;
  taxAmount?: number;
  discountAmount?: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
}

function sanitizeImageUrl(url?: string): string {
  if (!url) return '';
  // If the image points to local /uploads/ or /wp-content/, convert to relative path so it loads via the current protocol & host
  if (url.includes('/uploads/')) {
    return '/uploads/' + url.split('/uploads/')[1];
  }
  if (url.includes('/wp-content/')) {
    return '/wp-content/' + url.split('/wp-content/')[1];
  }
  // If http:// on an https page, upgrade to https
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && url.startsWith('http://')) {
    return url.replace(/^http:\/\//, 'https://');
  }
  return url;
}

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session_id');

  const [status, setStatus] = useState<'polling' | 'confirmed' | 'pending_webhook' | 'no_session'>('polling');
  const [order, setOrder] = useState<OrderData | null>(null);
  const [attempts, setAttempts] = useState<number>(0);
  const maxAttempts = 8;
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Trigger celebration confetti
  const fireConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0B3B24', '#C85A78', '#E6CA65', '#2F6B4F', '#F4F8F4'],
      });
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#0B3B24', '#C85A78', '#2F6B4F'],
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#0B3B24', '#C85A78', '#E6CA65'],
        });
      }, 300);
    } catch {
      // Graceful fallback if canvas is restricted
    }
  };

  // Clear cart upon successful payment verification
  const clearLocalCart = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('cart');
        localStorage.removeItem('if_cart');
        window.dispatchEvent(new Event('cart-updated'));
      } catch (err) {
        console.error('Failed to clear cart storage:', err);
      }
    }
  };

  useEffect(() => {
    if (!sessionId) {
      setStatus('no_session');
      return;
    }

    let isMounted = true;
    let currentAttempt = 0;

    const pollOrderStatus = async () => {
      try {
        currentAttempt += 1;
        setAttempts(currentAttempt);

        const res = await fetch(`/api/orders/by-session/${encodeURIComponent(sessionId)}?t=${Date.now()}`);
        const data = await res.json();

        if (!isMounted) return;

        if (data.success && data.order) {
          setOrder(data.order);
          setStatus('confirmed');
          clearLocalCart();
          fireConfetti();
          return;
        }

        // If webhook hasn't processed within max attempts, show reassuring pending confirmation UI
        if (currentAttempt >= maxAttempts) {
          setStatus('pending_webhook');
          clearLocalCart();
          return;
        }

        // Retry after 1.2 seconds
        pollTimerRef.current = setTimeout(pollOrderStatus, 1200);
      } catch (err) {
        console.error('Error during order status polling:', err);
        if (currentAttempt >= maxAttempts) {
          if (isMounted) {
            setStatus('pending_webhook');
            clearLocalCart();
          }
        } else {
          pollTimerRef.current = setTimeout(pollOrderStatus, 1500);
        }
      }
    };

    pollOrderStatus();

    return () => {
      isMounted = false;
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [sessionId]);

  if (status === 'no_session') {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex flex-col justify-center items-center px-4 py-12">
        <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-sm border border-stone-200 max-w-md w-full text-center">
          <div className="w-14 h-14 bg-rose-50 text-[#C85A78] rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-stone-900 mb-2">No Active Order Session</h2>
          <p className="text-sm text-stone-600 mb-6 leading-relaxed">
            We couldn’t find an active checkout session. If you recently placed an order, you can view your order history in your account.
          </p>
          <div className="space-y-3">
            <Link
              href="/"
              className="block w-full py-3 px-4 bg-[#0B3B24] hover:bg-[#134633] text-white rounded-xl font-semibold text-sm transition-colors text-center"
            >
              Return to Store
            </Link>
            <Link
              href="/account"
              className="block w-full py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl font-semibold text-sm transition-colors text-center"
            >
              Go to My Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6F0] text-stone-800 flex flex-col font-sans">
      {/* Brand Header */}
      <header className="bg-white border-b border-stone-200 py-4 px-4 sm:px-8 sticky top-0 z-20 shadow-2xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <BrandLogo size="md" />
          <div className="hidden sm:flex items-center gap-4 text-xs font-medium text-stone-600">
            <span className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              Verified Stripe Payment
            </span>
          </div>
        </div>
      </header>

      {/* Main Order Status Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 sm:py-12">
        {status === 'polling' && (
          <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-stone-200 text-center max-w-lg mx-auto">
            <div className="relative w-16 h-16 mx-auto mb-6">
              <div className="w-16 h-16 rounded-full border-4 border-stone-100 border-t-[#0B3B24] animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Clock className="w-6 h-6 text-[#0B3B24]" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-stone-900 mb-2">Finalizing Your Order</h1>
            <p className="text-sm text-stone-600 mb-4 leading-relaxed">
              We received your payment through Stripe and are confirming your fresh floral reservation...
            </p>
            <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden max-w-xs mx-auto">
              <div
                className="bg-[#0B3B24] h-1.5 transition-all duration-500 rounded-full"
                style={{ width: `${Math.min(100, (attempts / maxAttempts) * 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-stone-400 mt-3 font-mono">
              Verifying payment authorization (Attempt {attempts} of {maxAttempts})
            </p>
          </div>
        )}

        {status === 'confirmed' && order && (
          <div className="space-y-6 animate-fadeIn">
            {/* Confirmation Banner */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-emerald-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-40 h-40 bg-emerald-50 rounded-full pointer-events-none -z-0" />
              
              <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 border-b border-stone-100 pb-6 mb-6">
                <div className="w-16 h-16 bg-emerald-100 text-[#0B3B24] rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                  <CheckCircle2 className="w-9 h-9 text-[#0B3B24]" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#C85A78]">
                      Order Confirmed
                    </span>
                    <span className="text-[11px] bg-stone-100 text-stone-700 px-2.5 py-0.5 rounded-full font-mono font-medium">
                      #{order.orderId}
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B3B24] tracking-tight">
                    Thank You, {order.customerName}!
                  </h1>
                  <p className="text-xs sm:text-sm text-stone-600">
                    Your fresh Indian flowers order has been confirmed. A receipt has been sent to your email.
                  </p>
                </div>
              </div>

              {/* Delivery & Logistics Highlight */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#FAF6F0] rounded-2xl p-4 sm:p-5 border border-stone-200/80">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white text-[#0B3B24] border border-stone-200 flex items-center justify-center shrink-0 mt-0.5">
                    <Calendar className="w-5 h-5 text-[#0B3B24]" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wide">
                      Target Delivery Date
                    </h3>
                    <p className="text-sm font-semibold text-[#0B3B24] mt-0.5">
                      {order.deliveryDate || 'Guaranteed Fresh Delivery'}
                    </p>
                    {order.acknowledgedDeliveryTimeframe && (
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        {order.acknowledgedDeliveryTimeframe}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white text-[#0B3B24] border border-stone-200 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-5 h-5 text-[#0B3B24]" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wide">
                      Delivery Address
                    </h3>
                    <p className="text-xs text-stone-700 mt-0.5 leading-relaxed font-medium">
                      {order.shippingAddress}
                    </p>
                    {order.deliveryMode?.name && (
                      <p className="text-[11px] text-emerald-800 font-semibold mt-0.5 flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5" />
                        {order.deliveryMode.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items Breakdown */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-stone-200 space-y-6">
              <h2 className="text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#0B3B24]" />
                Order Summary ({order.items.length} {order.items.length === 1 ? 'item' : 'items'})
              </h2>

              <div className="divide-y divide-stone-100">
                {order.items.map((item, idx) => (
                  <div key={idx} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                      {item.image ? (
                        <img
                          src={sanitizeImageUrl(item.image)}
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded-xl border border-stone-200 shrink-0"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        style={{ display: item.image ? 'none' : 'flex' }}
                        className="w-12 h-12 rounded-xl bg-[#FAF6F0] border border-stone-200 items-center justify-center shrink-0 text-[#0B3B24] font-bold text-xs"
                      >
                        IF
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-semibold text-stone-900 truncate">
                          {item.name}
                        </h4>
                        {item.variantName && (
                          <p className="text-[11px] text-stone-500 font-medium">
                            Option: {item.variantName}
                          </p>
                        )}
                        <p className="text-[11px] text-stone-500">
                          Qty: {item.quantity} × {formatCurrency(item.price)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs sm:text-sm font-bold text-stone-900">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Calculation Summary */}
              <div className="bg-[#FAF6F0] rounded-2xl p-4 sm:p-5 border border-stone-200/80 space-y-2 text-xs">
                {order.shippingFee !== undefined && order.shippingFee > 0 && (
                  <div className="flex justify-between text-stone-600">
                    <span>Shipping & Handling:</span>
                    <span className="font-semibold text-stone-900">{formatCurrency(order.shippingFee)}</span>
                  </div>
                )}
                {order.taxAmount !== undefined && order.taxAmount > 0 && (
                  <div className="flex justify-between text-stone-600">
                    <span>Sales Tax (Authoritative):</span>
                    <span className="font-semibold text-stone-900">{formatCurrency(order.taxAmount)}</span>
                  </div>
                )}
                {order.discountAmount !== undefined && order.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-800 font-medium">
                    <span>Loyalty Points Discount:</span>
                    <span className="font-semibold">-{formatCurrency(order.discountAmount)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-stone-200 flex justify-between items-baseline text-sm sm:text-base font-extrabold text-[#0B3B24]">
                  <span>Total Paid:</span>
                  <span>{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Next Steps & Navigation Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="/account"
                className="flex-1 py-3.5 px-6 rounded-2xl bg-[#0B3B24] hover:bg-[#134633] text-white font-semibold text-sm transition-colors text-center flex items-center justify-center gap-2 shadow-xs"
              >
                <User className="w-4 h-4" />
                View Order in Account
              </Link>
              <Link
                href="/"
                className="flex-1 py-3.5 px-6 rounded-2xl bg-white hover:bg-stone-50 text-stone-800 border border-stone-200 font-semibold text-sm transition-colors text-center flex items-center justify-center gap-2"
              >
                Continue Shopping
                <ArrowRight className="w-4 h-4 text-stone-500" />
              </Link>
            </div>
          </div>
        )}

        {status === 'pending_webhook' && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-stone-200 space-y-6 text-center max-w-xl mx-auto">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <PackageCheck className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold text-[#0B3B24]">
                Payment Authorized & Finalizing
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-md mx-auto">
                Stripe has successfully processed your payment. Our fulfillment system is currently completing your order creation.
              </p>
            </div>

            <div className="bg-[#FAF6F0] rounded-2xl p-4 text-left border border-stone-200/80 space-y-1.5 text-xs text-stone-700">
              <div className="flex justify-between items-center py-0.5">
                <span className="font-medium text-stone-500">Stripe Session:</span>
                <span className="font-mono font-semibold text-stone-800 text-[11px] truncate max-w-[200px]">
                  {sessionId}
                </span>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="font-medium text-stone-500">Payment Status:</span>
                <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px]">
                  Paid / Authorized
                </span>
              </div>
              <p className="text-[11px] text-stone-500 pt-2 border-t border-stone-200/60 leading-normal">
                Your order is safe! A full email receipt will arrive shortly. You can also monitor your live status anytime in your customer account.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="/account"
                className="flex-1 py-3 px-5 rounded-2xl bg-[#0B3B24] hover:bg-[#134633] text-white font-semibold text-xs uppercase tracking-wider transition-colors"
              >
                Track in Account
              </Link>
              <Link
                href="/"
                className="flex-1 py-3 px-5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs uppercase tracking-wider transition-colors"
              >
                Return to Store
              </Link>
            </div>
          </div>
        )}

        {/* 24/7 California Customer Care Help Box */}
        <div className="mt-8 bg-white/80 backdrop-blur-xs rounded-2xl p-4 sm:p-5 border border-stone-200/60 text-xs text-stone-600 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <HelpCircle className="w-5 h-5 text-[#C85A78] shrink-0" />
            <div>
              <p className="font-semibold text-stone-800">Need help with your wedding or pooja delivery?</p>
              <p className="text-[11px] text-stone-500">Our California floral dispatch specialists are available 24/7.</p>
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0 text-[11px] font-semibold text-[#0B3B24]">
            <a href="tel:+15105795199" className="flex items-center gap-1 hover:underline">
              <Phone className="w-3.5 h-3.5" />
              +1 (510) 579-5199
            </a>
            <a href="mailto:support@indian-flowers.com" className="flex items-center gap-1 hover:underline">
              <Mail className="w-3.5 h-3.5" />
              Email Care
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF6F0] flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-4 border-stone-200 border-t-[#0B3B24] animate-spin" />
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}
