'use client';

import React, { useState, useEffect } from 'react';
import ProductGrid, { Product, ProductVariant } from './ProductGrid';
import POSCart, { POSCartItem } from './POSCart';
import PaymentPanel from './PaymentPanel';
import POSReceipt from './POSReceipt';
import { RefreshCw, Play, X, Maximize2, Minimize2, Store, Clock, UserCheck, ShieldCheck, Monitor, Smartphone, AlertTriangle, ChevronRight } from 'lucide-react';

interface POSCounterProps {
  products: Product[];
  categories: { _id: string; name: string }[];
  onRefreshProducts: () => void;
  cashierName?: string;
  cashierId?: string;
}

export default function POSCounter({
  products,
  categories,
  onRefreshProducts,
  cashierName = 'Admin Cashier',
  cashierId = 'admin',
}: POSCounterProps) {
  // Fullscreen Mode & Screen Size State
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [showMobileWarning, setShowMobileWarning] = useState(false);

  // Screen Size Detection for Mobile Warning Popup
  useEffect(() => {
    const checkMobileScreen = () => {
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        setShowMobileWarning(true);
      } else {
        setShowMobileWarning(false);
      }
    };
    checkMobileScreen();
    window.addEventListener('resize', checkMobileScreen);
    return () => window.removeEventListener('resize', checkMobileScreen);
  }, []);

  // Live Clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Cart State
  const [cartItems, setCartItems] = useState<POSCartItem[]>([]);
  const [discountType, setDiscountType] = useState<'FLAT' | 'PERCENTAGE'>('FLAT');
  const [discountValue, setDiscountValue] = useState(0);

  // Customer State
  const [customerName, setCustomerName] = useState('Walk-in Guest');
  const [customerPhone, setCustomerPhone] = useState('0000000000');
  const [customerEmail, setCustomerEmail] = useState('');

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI'>('CASH');
  const [cashReceived, setCashReceived] = useState(0);
  const [transactionId, setTransactionId] = useState('');

  // Status & Modal State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [posError, setPosError] = useState('');
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);

  // Held Bills State
  const [heldBills, setHeldBills] = useState<{ id: string; items: POSCartItem[]; customerName: string; time: string }[]>([]);
  const [isHeldModalOpen, setIsHeldModalOpen] = useState(false);

  // Toggle Browser / Overlay Fullscreen
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      setIsFullscreen(true);
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else {
      setIsFullscreen(false);
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  // Add Item to Cart
  const handleAddToCart = (product: Product, variant?: ProductVariant) => {
    const vName = variant ? variant.name : undefined;
    const vPrice = variant ? Number(variant.price) : Number(product.price);

    setCartItems((prev) => {
      const existingIdx = prev.findIndex(
        (i) => i.productId === product._id && i.variantName === vName
      );

      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += 1;
        return updated;
      } else {
        return [
          ...prev,
          {
            productId: product._id,
            name: product.name,
            variantName: vName,
            price: vPrice,
            quantity: 1,
            gst: product.gst !== undefined ? product.gst : 0,
            image: product.image,
          },
        ];
      }
    });
  };

  // Update Item Quantity
  const handleUpdateQty = (productId: string, variantName: string | undefined, delta: number) => {
    setCartItems((prev) => {
      return prev
        .map((i) => {
          if (i.productId === productId && i.variantName === variantName) {
            const newQty = i.quantity + delta;
            return newQty > 0 ? { ...i, quantity: newQty } : null;
          }
          return i;
        })
        .filter(Boolean) as POSCartItem[];
    });
  };

  // Remove Item
  const handleRemoveItem = (productId: string, variantName?: string) => {
    setCartItems((prev) =>
      prev.filter((i) => !(i.productId === productId && i.variantName === variantName))
    );
  };

  // Discount Update
  const handleUpdateDiscount = (type: 'FLAT' | 'PERCENTAGE', val: number) => {
    setDiscountType(type);
    setDiscountValue(val);
  };

  // Reset / Clear Counter
  const handleResetCounter = () => {
    setCartItems([]);
    setDiscountType('FLAT');
    setDiscountValue(0);
    setCustomerName('Walk-in Guest');
    setCustomerPhone('0000000000');
    setCustomerEmail('');
    setPaymentMethod('CASH');
    setCashReceived(0);
    setTransactionId('');
    setPosError('');
  };

  // Hold Current Bill
  const handleHoldBill = () => {
    if (cartItems.length === 0) return;
    const newHeld = {
      id: `HELD-${Date.now().toString().slice(-4)}`,
      items: [...cartItems],
      customerName,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
    setHeldBills((prev) => [newHeld, ...prev]);
    handleResetCounter();
  };

  // Resume Held Bill
  const handleResumeBill = (heldId: string) => {
    const target = heldBills.find((b) => b.id === heldId);
    if (target) {
      setCartItems(target.items);
      setCustomerName(target.customerName);
      setHeldBills((prev) => prev.filter((b) => b.id !== heldId));
      setIsHeldModalOpen(false);
    }
  };

  // Calculate Subtotal & Totals for Payment Panel
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalGst = cartItems.reduce(
    (sum, item) => sum + Math.round(item.price * item.quantity * (item.gst / 100)),
    0
  );

  let discountAmount = 0;
  if (discountType === 'PERCENTAGE') {
    discountAmount = Math.round(subtotal * (discountValue / 100));
  } else {
    discountAmount = Math.round(discountValue);
  }
  discountAmount = Math.min(discountAmount, subtotal);

  const finalTotal = Math.max(0, subtotal + totalGst - discountAmount);

  // Submit POS Order
  const handleSubmitPOS = async () => {
    setPosError('');
    if (cartItems.length === 0) {
      setPosError('Cart is empty.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        items: cartItems,
        customerName,
        customerPhone,
        customerEmail,
        paymentMethod,
        discountType,
        discountValue,
        cashReceived: paymentMethod === 'CASH' ? cashReceived : finalTotal,
        transactionId,
        cashierName,
        cashierId,
      };

      const res = await fetch('/api/pos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setCompletedOrder(data.data);
        handleResetCounter();
        onRefreshProducts(); // Refresh stock in admin
      } else {
        setPosError(data.message || 'Failed to complete POS sale.');
      }
    } catch (err: any) {
      setPosError(err.message || 'Server error completing POS billing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={
        isFullscreen
          ? 'fixed top-0 left-0 right-0 bottom-0 w-screen h-screen z-[999999] bg-[#F8FAFC] p-4 flex flex-col overflow-hidden'
          : 'flex flex-col h-[calc(100vh-140px)] min-h-[620px] space-y-3'
      }
    >
      {/* POS Top Control & Branding Bar */}
      <div className="shrink-0 bg-white p-3 px-4 rounded-2xl border border-[#E8EDF2] flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#ED3500] text-white flex items-center justify-center font-black shadow-2xs">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-black text-sm text-[#163B5C] uppercase tracking-wide">
                NEXUS ECOM POS COUNTER
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Live Terminal
              </span>
            </div>
            <p className="text-[11px] font-semibold text-[#64748B] flex items-center gap-2">
              <span>Cashier: <strong>{cashierName}</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1 font-mono text-[10px]"><Clock className="w-3 h-3 text-[#ED3500]" /> {currentTime}</span>
            </p>
          </div>
        </div>

        {/* Fullscreen & Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleFullscreen}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 border transition-all shadow-2xs ${
              isFullscreen
                ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600'
                : 'bg-white hover:bg-[#FFF8F5] text-[#163B5C] border-[#E8EDF2] hover:border-[#ED3500]/40'
            }`}
            title={isFullscreen ? 'Exit Fullscreen POS Mode' : 'Enter Fullscreen POS Mode'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-4 h-4" /> Exit Fullscreen
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4 text-[#ED3500]" /> Fullscreen POS
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {posError && (
        <div className="shrink-0 p-3 px-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center justify-between">
          <span>⚠️ {posError}</span>
          <button onClick={() => setPosError('')} className="text-rose-600 font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Main 2-Column POS Layout */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-4 min-h-0 items-stretch">
        {/* Left Column: Product Grid (7 Cols) */}
        <div className="xl:col-span-7 flex flex-col h-full min-h-0">
          <ProductGrid
            products={products}
            categories={categories}
            onAddToCart={handleAddToCart}
          />
        </div>

        {/* Right Column: POS Cart & Payment Panel (5 Cols) */}
        <div className="xl:col-span-5 flex flex-col h-full min-h-0 space-y-3 overflow-y-auto pr-1">
          <div className="flex-1 min-h-[280px]">
            <POSCart
              items={cartItems}
              discountType={discountType}
              discountValue={discountValue}
              onUpdateQty={handleUpdateQty}
              onRemoveItem={handleRemoveItem}
              onUpdateDiscount={handleUpdateDiscount}
              onClearCart={handleResetCounter}
              onHoldBill={handleHoldBill}
              heldBillsCount={heldBills.length}
              onOpenHeldBillsModal={() => setIsHeldModalOpen(true)}
            />
          </div>

          <div className="shrink-0 pb-4">
            <PaymentPanel
              finalTotal={finalTotal}
              paymentMethod={paymentMethod}
              onUpdatePaymentMethod={setPaymentMethod}
              cashReceived={cashReceived}
              onUpdateCashReceived={setCashReceived}
              transactionId={transactionId}
              onUpdateTransactionId={setTransactionId}
              customerName={customerName}
              customerPhone={customerPhone}
              customerEmail={customerEmail}
              onUpdateCustomer={({ customerName, customerPhone, customerEmail }) => {
                if (customerName !== undefined) setCustomerName(customerName);
                if (customerPhone !== undefined) setCustomerPhone(customerPhone);
                if (customerEmail !== undefined) setCustomerEmail(customerEmail);
              }}
              onSubmitPOS={handleSubmitPOS}
              isSubmitting={isSubmitting}
              isCartEmpty={cartItems.length === 0}
              merchantUpiId={process.env.NEXT_PUBLIC_MERCHANT_UPI_ID || ''}
            />
          </div>
        </div>
      </div>

      {/* Held Bills Modal */}
      {isHeldModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-[#E8EDF2] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E8EDF2] pb-3">
              <h3 className="font-extrabold text-base text-[#163B5C]">Parked / Held Bills ({heldBills.length})</h3>
              <button onClick={() => setIsHeldModalOpen(false)} className="text-[#64748B] hover:text-[#163B5C]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {heldBills.length === 0 ? (
              <p className="text-xs text-[#64748B] text-center py-6">No held bills in queue.</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {heldBills.map((b) => (
                  <div
                    key={b.id}
                    className="p-3 rounded-2xl bg-[#FFFCFB] border border-[#E8EDF2] flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-[#163B5C] block">{b.id} — {b.customerName}</span>
                      <span className="text-[10px] text-[#64748B]">{b.time} • {b.items.reduce((s, i) => s + i.quantity, 0)} items</span>
                    </div>
                    <button
                      onClick={() => handleResumeBill(b.id)}
                      className="px-3 py-1.5 rounded-xl bg-[#ED3500] hover:bg-[#D02E00] text-white font-bold text-xs flex items-center gap-1 shadow-xs"
                    >
                      <Play className="w-3.5 h-3.5" /> Resume
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* POS Receipt Modal on completed sale */}
      {completedOrder && (
        <POSReceipt
          order={completedOrder}
          onClose={() => setCompletedOrder(null)}
          onNewSale={() => {
            setCompletedOrder(null);
            handleResetCounter();
          }}
        />
      )}

      {/* Mobile Screen Warning Popup Modal */}
      {showMobileWarning && (
        <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 border border-[#E8EDF2] shadow-2xl text-center relative overflow-hidden">
            {/* Header Icon */}
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
              <Monitor className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-black uppercase">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Screen Size Notice
              </div>
              <h3 className="font-black text-lg text-[#163B5C]">
                Large Screen Recommended for POS
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                The <strong>Nexus Ecom POS Counter</strong> is optimized for Desktop PCs, Laptops, and Tablets (1024px+ width) to ensure fast multi-item counter billing, barcode scanning, and receipt printing.
              </p>
            </div>

            {/* Quick Tips */}
            <div className="p-3.5 rounded-2xl bg-[#FFFCFB] border border-[#E8EDF2] text-left text-xs space-y-2.5">
              <div className="flex items-start gap-2.5 text-[#163B5C]">
                <Smartphone className="w-4 h-4 text-[#ED3500] shrink-0 mt-0.5" />
                <span><strong>Mobile Tip:</strong> Rotate your phone to <strong>Landscape Mode</strong> for a better counter layout.</span>
              </div>
              <div className="flex items-start gap-2.5 text-[#163B5C]">
                <Monitor className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Recommended:</strong> Open on counter desktop PC or tablet for full speed billing.</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => setShowMobileWarning(false)}
                className="w-full py-3.5 rounded-2xl bg-[#ED3500] hover:bg-[#D02E00] text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-[#ED3500]/25 transition-all flex items-center justify-center gap-2"
              >
                Proceed Anyway on Mobile <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
