'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/currency';
import Header from '@/components/Header';
import HeroSection, { HeroSlide } from '@/components/HeroSection';
import CategoryTiles, { CategoryItem } from '@/components/CategoryTiles';
import ProductCard, { Product, ProductVariant } from '@/components/ProductCard';
import ProductQuickViewModal from '@/components/ProductQuickViewModal';
import AddedToCartPopup, { AddedItemDetails } from '@/components/AddedToCartPopup';
import CartDrawer from '@/components/CartDrawer';
import WishlistDrawer from '@/components/WishlistDrawer';
import CustomOrderSection from '@/components/CustomOrderSection';
import {
  ShoppingBag,
  Search,
  CheckCircle2,
  X,
  Truck,
  RefreshCw,
  PackageCheck,
  Phone,
  Mail,
  MapPin,
  Star,
  Quote,
  ArrowRight,
  ShieldCheck,
  Headphones,
  Heart,
  Flower2,
  Check,
  CreditCard,
  Lock,
  Wallet,
  Banknote,
  QrCode,
  DollarSign,
  Copy,
  Facebook,
  Instagram,
  Youtube,
} from 'lucide-react';

interface CartItem {
  product: Product;
  selectedVariant?: ProductVariant;
  quantity: number;
}

interface CustomerReview {
  _id: string;
  customerName: string;
  location: string;
  comment: string;
  rating: number;
  avatar?: string;
  productName?: string;
}

interface TrackedOrder {
  _id: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  shippingAddress: string;
  pincode: string;
  items: Array<{ name: string; price: number; quantity: number; image?: string }>;
  subtotal: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  createdAt: string;
}

export default function CustomerStore() {
  // Dynamic State sourced 100% from MongoDB
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [banners, setBanners] = useState<HeroSlide[]>([]);
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [storeSettings, setStoreSettings] = useState<any>(null);

  // Loading States
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingBanners, setLoadingBanners] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modals & Drawers State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any | null>(null);

  // Added To Cart Popup Notification State
  const [addedItemDetails, setAddedItemDetails] = useState<AddedItemDetails | null>(null);
  const [isAddedPopupOpen, setIsAddedPopupOpen] = useState(false);

  // Order Tracking Modal State
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [trackQuery, setTrackQuery] = useState('');
  const [trackedOrders, setTrackedOrders] = useState<TrackedOrder[]>([]);
  const [isSearchingOrders, setIsSearchingOrders] = useState(false);
  const [trackSearched, setTrackSearched] = useState(false);

  // Checkout Form State (Dynamic Backend Payment Methods)
  const [checkoutForm, setCheckoutForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    shippingAddress: '',
    pincode: '',
    paymentMethod: 'COD',
    transactionId: '',
    notes: '',
  });
  const [copiedUpi, setCopiedUpi] = useState(false);

  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [formError, setFormError] = useState('');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  // Restore Cart on Mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('if_cart');
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCart(parsed);
        }
      }
    } catch (err) {
      console.error('Failed to parse cart:', err);
    }
  }, []);

  // Save Cart on Change
  useEffect(() => {
    try {
      if (cart.length > 0) {
        localStorage.setItem('if_cart', JSON.stringify(cart));
      } else {
        localStorage.removeItem('if_cart');
      }
    } catch (err) {
      console.error('Failed to persist cart:', err);
    }
  }, [cart]);

  // Restore Wishlist on Mount
  useEffect(() => {
    try {
      const savedWishlist = localStorage.getItem('if_wishlist');
      if (savedWishlist) {
        const parsed = JSON.parse(savedWishlist);
        if (Array.isArray(parsed)) {
          setWishlist(parsed);
        }
      }
    } catch (err) {
      console.error('Failed to parse wishlist:', err);
    }
  }, []);

  // Save Wishlist on Change
  useEffect(() => {
    try {
      if (wishlist.length > 0) {
        localStorage.setItem('if_wishlist', JSON.stringify(wishlist));
      } else {
        localStorage.removeItem('if_wishlist');
      }
    } catch (err) {
      console.error('Failed to persist wishlist:', err);
    }
  }, [wishlist]);

  // Wishlist Handlers
  const handleToggleWishlist = (product: Product) => {
    setWishlist((prev) => {
      const exists = prev.some((p) => p._id === product._id);
      if (exists) {
        return prev.filter((p) => p._id !== product._id);
      } else {
        return [...prev, product];
      }
    });
  };

  const handleRemoveFromWishlist = (productId: string) => {
    setWishlist((prev) => prev.filter((p) => p._id !== productId));
  };

  const handleClearWishlist = () => {
    setWishlist([]);
  };

  // 1. Fetch Store Settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        if (data.success && data.data) {
          setStoreSettings(data.data);
          if (data.data.enableCOD !== false) {
            setCheckoutForm((prev) => ({ ...prev, paymentMethod: 'COD' }));
          } else if (data.data.enableUPI) {
            setCheckoutForm((prev) => ({ ...prev, paymentMethod: 'UPI' }));
          }
        }
      } catch (err) {
        console.error('Failed to fetch settings from DB:', err);
      }
    };
    fetchSettings();
  }, []);

  // 2. Fetch Categories from DB
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const res = await fetch('/api/categories');
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setCategories(data.data);
        } else {
          setCategories([]);
        }
      } catch (err) {
        console.error('Failed to fetch categories from DB:', err);
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  // 3. Fetch Banners/Hero Slides from DB
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setLoadingBanners(true);
        const res = await fetch('/api/banners');
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setBanners(data.data);
        } else {
          setBanners([]);
        }
      } catch (err) {
        console.error('Failed to fetch banners from DB:', err);
        setBanners([]);
      } finally {
        setLoadingBanners(false);
      }
    };
    fetchBanners();
  }, []);

  // 4. Fetch Reviews from DB
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoadingReviews(true);
        const res = await fetch('/api/reviews');
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setReviews(data.data);
        } else {
          setReviews([]);
        }
      } catch (err) {
        console.error('Failed to fetch reviews from DB:', err);
        setReviews([]);
      } finally {
        setLoadingReviews(false);
      }
    };
    fetchReviews();
  }, []);

  // 5. Fetch Dynamic Products from DB based on Search Query & Category
  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const url = new URL('/api/products', window.location.origin);
      if (searchQuery.trim()) url.searchParams.append('search', searchQuery.trim());
      if (selectedCategory !== 'All') url.searchParams.append('category', selectedCategory);

      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setProducts(data.data);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error('Failed to fetch products from DB:', err);
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [searchQuery, selectedCategory]);

  // Cart Management
  const addToCart = (product: Product, variant?: ProductVariant, quantity: number = 1) => {
    setCart((prevCart) => {
      const existingIdx = prevCart.findIndex(
        (it) =>
          it.product._id === product._id &&
          ((!it.selectedVariant && !variant) || it.selectedVariant?.name === variant?.name)
      );

      if (existingIdx > -1) {
        const updated = [...prevCart];
        updated[existingIdx].quantity += quantity;
        return updated;
      } else {
        return [...prevCart, { product, selectedVariant: variant, quantity }];
      }
    });

    // Trigger proper responsive Added To Cart popup
    setAddedItemDetails({ product, variant, quantity });
    setIsAddedPopupOpen(true);
  };

  const updateCartQty = (productId: string, variantName: string | undefined, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(productId, variantName);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.product._id === productId && item.selectedVariant?.name === variantName) {
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: string, variantName?: string) => {
    setCart((prevCart) =>
      prevCart.filter(
        (item) => !(item.product._id === productId && item.selectedVariant?.name === variantName)
      )
    );
  };

  const cartSubtotal = cart.reduce(
    (sum, item) =>
      sum + (item.selectedVariant ? item.selectedVariant.price : item.product.price) * item.quantity,
    0
  );
  const cartGrandTotal = cartSubtotal;
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Search tracking
  const handleSearchTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackQuery.trim()) return;

    try {
      setIsSearchingOrders(true);
      setTrackSearched(true);
      const res = await fetch(`/api/orders/track?query=${encodeURIComponent(trackQuery.trim())}`);
      const data = await res.json();
      if (data.success && data.data) {
        setTrackedOrders(data.data);
      } else {
        setTrackedOrders([]);
      }
    } catch (err) {
      console.error('Track error:', err);
      setTrackedOrders([]);
    } finally {
      setIsSearchingOrders(false);
    }
  };

  const shippingAddressValid = (addr: string) => Boolean(addr && addr.trim().length > 3);

  // Place Order into MongoDB
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (
      !checkoutForm.customerName ||
      !checkoutForm.customerPhone ||
      !checkoutForm.customerEmail ||
      !shippingAddressValid(checkoutForm.shippingAddress) ||
      !checkoutForm.pincode
    ) {
      setFormError('Please fill in all required shipping details.');
      return;
    }

    const isCodActive = storeSettings ? storeSettings.enableCOD !== false : true;
    const isUpiActive = storeSettings ? Boolean(storeSettings.enableUPI) : false;

    if (!isCodActive && !isUpiActive) {
      setFormError('Online checkout is currently paused by store administration.');
      return;
    }

    const currentMethod =
      checkoutForm.paymentMethod === 'UPI' && isUpiActive
        ? 'UPI'
        : isCodActive
        ? 'COD'
        : 'UPI';

    if (currentMethod === 'UPI' && !checkoutForm.transactionId.trim()) {
      setFormError('Please enter the 12-digit UPI UTR / Reference ID from your payment receipt.');
      return;
    }

    try {
      setSubmittingOrder(true);
      const payload = {
        customerName: checkoutForm.customerName,
        customerPhone: checkoutForm.customerPhone,
        customerEmail: checkoutForm.customerEmail,
        shippingAddress: checkoutForm.shippingAddress,
        pincode: checkoutForm.pincode,
        paymentMethod: currentMethod,
        transactionId: currentMethod === 'UPI' ? checkoutForm.transactionId.trim() : '',
        items: cart.map((item) => ({
          productId: item.product._id,
          name: item.selectedVariant
            ? `${item.product.name} (${item.selectedVariant.name})`
            : item.product.name,
          price: item.selectedVariant ? item.selectedVariant.price : item.product.price,
          quantity: item.quantity,
          gst: 0,
          image: item.product.image,
        })),
        totalAmount: cartGrandTotal,
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setOrderSuccess(data.data);
        setCart([]);
        setIsCheckoutOpen(false);
        setIsCartOpen(false);
        localStorage.removeItem('if_cart');
      } else {
        setFormError(data.message || 'Unable to place order. Please check details and try again.');
      }
    } catch (err: any) {
      console.error('Order creation error:', err);
      setFormError('Connection error while placing order. Please try again.');
    } finally {
      setSubmittingOrder(false);
    }
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterSubscribed(true);
    setTimeout(() => {
      setNewsletterEmail('');
    }, 2500);
  };

  const contactPhone = storeSettings?.contactPhone || '+1 (510) 579-5199';
  const contactEmail = storeSettings?.contactEmail || 'support@indian-flowers.com';

  // Dynamic Backend Payment Options (Real Settings from MongoDB)
  const isCodActive = storeSettings ? storeSettings.enableCOD !== false : true;
  const isUpiActive = storeSettings ? Boolean(storeSettings.enableUPI) : false;
  const merchantUpiId =
    storeSettings?.contactEmail || process.env.NEXT_PUBLIC_MERCHANT_UPI_ID || 'orders@indian-flowers.com';
  const upiIntentUrl = `upi://pay?pa=${encodeURIComponent(merchantUpiId)}&pn=${encodeURIComponent(
    storeSettings?.businessName || 'Indian Flowers'
  )}&am=${cartGrandTotal}&cu=USD&tn=Flower%20Order`;
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    upiIntentUrl
  )}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(merchantUpiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  return (
    <div className={`min-h-[100dvh] flex flex-col justify-between bg-white text-gray-900 font-sans ${cartItemCount > 0 ? 'pb-24 sm:pb-0' : ''}`}>
      {/* 1. TOP NAVBAR & PAGE LINKS (Retrieved from DB Categories) */}
      <Header
        cartItemCount={cartItemCount}
        onCartClick={() => setIsCartOpen(true)}
        wishlistCount={wishlist.length}
        onWishlistClick={() => setIsWishlistOpen(true)}
        onTrackClick={() => setIsTrackModalOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          const el = document.getElementById('products-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* 2. IMAGE SLIDER HERO (Retrieved from DB Banners) */}
      <HeroSection
        slides={banners}
        loading={loadingBanners}
        onShopClick={() => {
          const el = document.getElementById('products-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* 3. CATEGORIES SECTION (Retrieved from DB Categories) */}
      <CategoryTiles
        categories={categories}
        loading={loadingCategories}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          const el = document.getElementById('products-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* 4. BESTSELLERS / POPULAR PRODUCTS SECTION (Retrieved from DB Products) */}
      <section id="products-section" className="py-10 sm:py-14 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
            <div>
              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.14em] text-[#C85A78] block">
                Bestsellers
              </span>
              <h2 className="text-[24px] sm:text-[32px] lg:text-[36px] font-bold tracking-[-0.03em] text-gray-900 mt-1 leading-[1.2]">
                Popular Flowers &amp; Garlands
              </h2>
              <p className="text-sm sm:text-base text-gray-500 mt-1 font-normal max-w-[42ch]">
                Handpicked favourites for your special occasions
              </p>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto">
              {selectedCategory !== 'All' && (
                <button
                  onClick={() => setSelectedCategory('All')}
                  className="shrink-0 px-3.5 py-1.5 rounded-full border border-gray-200 text-xs text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-colors font-normal"
                >
                  Clear filter
                </button>
              )}
              <button
                onClick={() => setSelectedCategory('All')}
                className="inline-flex shrink-0 items-center gap-1.5 px-4 py-2 rounded-full border border-gray-200 hover:border-[#0B3B24] text-xs sm:text-sm font-semibold text-gray-700 hover:text-[#0B3B24] transition-colors"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {loadingProducts ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-[#E3E7E1] overflow-hidden flex flex-col animate-pulse"
                >
                  <div className="aspect-[4/5] sm:aspect-square bg-[#FAF6F0] w-full" />
                  <div className="p-3 sm:p-4 space-y-2">
                    <div className="h-3 bg-gray-200 rounded-sm w-3/4" />
                    <div className="h-4 bg-gray-200 rounded-sm w-1/2" />
                    <div className="h-11 bg-gray-100 rounded-xl w-full mt-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="py-16 text-center bg-[#FAF6F0] rounded-2xl p-8 max-w-md mx-auto">
              <p className="text-gray-600 text-sm font-normal">
                No flowers found {selectedCategory !== 'All' ? `in "${selectedCategory}"` : ''}.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  setSearchQuery('');
                }}
                className="mt-4 px-4 py-2 rounded-full bg-[#0B3B24] text-white text-xs font-medium"
              >
                Show All Products
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
              {products.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  isWishlisted={wishlist.some((w) => w._id === product._id)}
                  onToggleWishlist={handleToggleWishlist}
                  onAddToCart={(prod, v) => addToCart(prod, v, 1)}
                  onProductClick={(prod) => setSelectedProduct(prod)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 5. OCCASION FEATURE DUAL BANNERS */}
      <section className="py-8 sm:py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Banner 1: Wedding Garlands */}
            <div className="rounded-2xl overflow-hidden bg-[#FBF0E8] border border-[#F3DFD1]/80 p-5 sm:p-8 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 group hover:shadow-md transition-shadow">
              <div className="w-full max-w-[11rem] aspect-square sm:w-44 sm:h-44 sm:max-w-none rounded-xl overflow-hidden shrink-0 shadow-xs">
                <img
                  src="https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=600&q=80"
                  alt="Wedding Garlands"
                  className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-500"
                />
              </div>

              <div className="space-y-2.5 text-center sm:text-left flex-1">
                <h3 className="text-[20px] sm:text-[26px] lg:text-[30px] font-bold tracking-[-0.03em] text-gray-900 leading-[1.25]">
                  Wedding Garlands
                </h3>
                <span className="text-[11px] font-medium uppercase tracking-wider text-[#A0522D] block">
                  Traditional &amp; Custom Designs
                </span>
                <p className="text-sm sm:text-[15px] text-gray-600 leading-relaxed font-normal">
                  Make your special day more beautiful with our handcrafted garlands.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setSelectedCategory('Wedding Garlands');
                      const el = document.getElementById('products-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#0B3B24] hover:bg-[#134633] text-white text-xs sm:text-sm font-medium shadow-xs transition-colors"
                  >
                    <span>Explore Wedding Garlands</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Banner 2: Pooja Flowers & Temple Decoration */}
            <div className="rounded-2xl overflow-hidden bg-[#FBF2F4] border border-[#F5E0E5]/80 p-5 sm:p-8 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 group hover:shadow-md transition-shadow">
              <div className="space-y-2.5 text-center sm:text-left flex-1 order-2 sm:order-1">
                <h3 className="text-[20px] sm:text-[26px] lg:text-[30px] font-bold tracking-[-0.03em] text-gray-900 leading-[1.25]">
                  Pooja Flowers &amp; Temple Decoration
                </h3>
                <p className="text-sm sm:text-[15px] text-gray-600 leading-relaxed font-normal">
                  Fresh flowers, leaves and pooja items for your spiritual needs.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setSelectedCategory('Pooja Items');
                      const el = document.getElementById('products-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#0B3B24] hover:bg-[#134633] text-white text-xs sm:text-sm font-medium shadow-xs transition-colors"
                  >
                    <span>Shop Pooja Items</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="w-full max-w-[11rem] aspect-square sm:w-44 sm:h-44 sm:max-w-none rounded-xl overflow-hidden shrink-0 shadow-xs order-1 sm:order-2">
                <img
                  src="https://images.unsplash.com/photo-1605647540924-852290f6b0d5?auto=format&fit=crop&w=600&q=80"
                  alt="Pooja Flowers & Diya"
                  className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-500"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. WHY CHOOSE INDIAN-FLOWERS.COM SECTION */}
      <section className="py-12 sm:py-16 bg-[#FAFAF8] border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Header */}
          <div className="text-center space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#C85A78]">
              WHY CHOOSE INDIAN-FLOWERS.COM
            </span>
            <h2 className="text-[24px] sm:text-[30px] lg:text-[36px] font-bold tracking-[-0.03em] text-gray-900 leading-[1.2] px-2">
              Your Trusted Flower Partner in the USA
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            {/* Feature 1 */}
            <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-xs transition-shadow text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100/80">
                <Flower2 className="w-5 h-5" />
              </div>
              <h4 className="text-xs sm:text-sm font-semibold text-gray-900 leading-snug">
                Authentic Indian Flowers
              </h4>
              <p className="text-[11px] text-gray-500 leading-tight font-normal">Sourced with care</p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-xs transition-shadow text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-100/80">
                <Truck className="w-5 h-5" />
              </div>
              <h4 className="text-xs sm:text-sm font-semibold text-gray-900 leading-snug">
                Fresh &amp; Fast Delivery
              </h4>
              <p className="text-[11px] text-gray-500 leading-tight font-normal">Across the United States</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-xs transition-shadow text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100/80">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-xs sm:text-sm font-semibold text-gray-900 leading-snug">
                Wide Variety
              </h4>
              <p className="text-[11px] text-gray-500 leading-tight font-normal">Flowers, garlands, leaves &amp; more</p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-xs transition-shadow text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100/80">
                <Heart className="w-5 h-5" />
              </div>
              <h4 className="text-xs sm:text-sm font-semibold text-gray-900 leading-snug">
                Trusted by Customers
              </h4>
              <p className="text-[11px] text-gray-500 leading-tight font-normal">10,000+ happy customers</p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-xs transition-shadow text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100/80">
                <Headphones className="w-5 h-5" />
              </div>
              <h4 className="text-xs sm:text-sm font-semibold text-gray-900 leading-snug">
                Dedicated Support
              </h4>
              <p className="text-[11px] text-gray-500 leading-tight font-normal">We&apos;re here to help</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6.5 BESPOKE & BULK CUSTOM ORDERS CONTACT FORM */}
      <CustomOrderSection />

      {/* 7. CUSTOMER REVIEWS (Retrieved 100% Dynamically from DB) */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.14em] text-[#C85A78] block">
                CUSTOMER REVIEWS
              </span>
              <h2 className="text-[24px] sm:text-[32px] lg:text-[36px] font-bold tracking-[-0.03em] text-gray-900 mt-1 leading-[1.2]">
                What Our Customers Say
              </h2>
            </div>
            <div>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-200 hover:border-[#0B3B24] text-xs sm:text-sm font-medium text-gray-700 hover:text-[#0B3B24] transition-colors"
              >
                <span>View All Reviews</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Dynamic Review Cards */}
          {loadingReviews ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-[#FCFAF7] p-6 border border-amber-100/50 h-44 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {reviews.slice(0, 3).map((rev) => (
                <div
                  key={rev._id}
                  className="rounded-2xl bg-[#FCFAF7] p-6 border border-amber-100/50 shadow-2xs flex flex-col justify-between space-y-4 hover:shadow-xs transition-shadow"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-amber-400">
                        {[...Array(rev.rating || 5)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <span className="text-amber-500/30 text-2xl font-serif font-normal leading-none">
                        &ldquo;&ldquo;
                      </span>
                    </div>
                    <p className="text-xs sm:text-[13px] text-gray-700 italic leading-relaxed font-normal">
                      &ldquo;{rev.comment}&rdquo;
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pt-2 border-t border-amber-100/40">
                    {rev.avatar ? (
                      <img
                        src={rev.avatar}
                        alt={rev.customerName}
                        className="w-9 h-9 rounded-full object-cover border border-amber-200/80"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-emerald-100 text-[#0B3B24] flex items-center justify-center font-bold text-xs">
                        {rev.customerName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h4 className="text-xs font-semibold text-gray-900">{rev.customerName}</h4>
                      <span className="text-[11px] text-gray-500 font-normal">{rev.location}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 8. NEWSLETTER SIGNUP BANNER */}
      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-[#F4F8F4] border border-emerald-100/80 p-5 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-5 sm:gap-6">
            <div className="space-y-1 text-center md:text-left">
              <h3 className="text-[20px] sm:text-[26px] lg:text-[28px] font-bold tracking-[-0.03em] text-gray-900 leading-[1.25]">
                Get Flower Updates &amp; Special Offers
              </h3>
              <p className="text-sm text-gray-600 font-normal">
                Subscribe to our newsletter and be the first to know about new arrivals, seasonal offers and more.
              </p>
            </div>

            <form
              onSubmit={handleNewsletterSubmit}
              className="flex w-full md:w-auto flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-md shrink-0"
            >
              <div className="relative flex-1">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="Enter your email address"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#0B3B24] font-normal"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#0B3B24] hover:bg-[#134633] text-white font-medium text-xs sm:text-sm whitespace-nowrap shadow-2xs transition-colors"
              >
                {newsletterSubscribed ? 'Subscribed!' : 'Subscribe'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* 9. BRAND FOOTER (4-COLUMN EDITORIAL BOTANICAL DESIGN) */}
      <footer className="bg-[#0B3B24] text-white pt-16 pb-10 border-t border-[#0B3B24]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
            {/* Column 1: Brand Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
                  <Flower2 className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-white leading-tight">
                    Indian-Flowers.com
                  </h3>
                  <span className="text-[10px] text-emerald-300 font-medium tracking-wide uppercase">
                    Authentic Indian Flora
                  </span>
                </div>
              </div>

              <p className="text-xs text-white/75 leading-relaxed font-normal">
                Dedicated to bringing fresh ceremonial flowers, garlands, and sacred leaves to Indian homes and temples across the United States.
              </p>

              <div className="text-xs text-white/80 space-y-2 pt-1 font-normal">
                <p className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-emerald-300" />
                  <span>{contactPhone}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-emerald-300" />
                  <span>{contactEmail}</span>
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-emerald-300" />
                  <span>United States Delivery Nationwide</span>
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <a
                  href="#"
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="w-3.5 h-3.5 text-white" />
                </a>
                <a
                  href="#"
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-3.5 h-3.5 text-white" />
                </a>
                <a
                  href="#"
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  aria-label="YouTube"
                >
                  <Youtube className="w-3.5 h-3.5 text-white" />
                </a>
              </div>
            </div>

            {/* Column 2: Popular Categories from DB */}
            <div className="space-y-3">
              <h4 className="font-semibold text-xs uppercase tracking-wider text-emerald-300">
                Categories
              </h4>
              <ul className="space-y-2 text-xs text-white/75 font-normal">
                {categories.slice(0, 6).map((cat) => (
                  <li key={cat._id || cat.name}>
                    <button
                      onClick={() => {
                        setSelectedCategory(cat.name);
                        const el = document.getElementById('products-section');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="hover:text-white transition-colors"
                    >
                      {cat.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Customer Care */}
            <div className="space-y-3">
              <h4 className="font-semibold text-xs uppercase tracking-wider text-emerald-300">
                Customer Care
              </h4>
              <ul className="space-y-2 text-xs text-white/75 font-normal">
                <li>
                  <button
                    onClick={() => setIsTrackModalOpen(true)}
                    className="hover:text-white transition-colors text-left"
                  >
                    Track Your Order
                  </button>
                </li>
                <li>
                  <a href="#shipping" className="hover:text-white transition-colors">
                    USA Shipping &amp; Delivery Policy
                  </a>
                </li>
                <li>
                  <a href="#freshness" className="hover:text-white transition-colors">
                    Freshness &amp; Handling Guarantee
                  </a>
                </li>
                <li>
                  <a href="#custom-orders" className="hover:text-white transition-colors">
                    Custom Wedding Inquiries
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-white transition-colors">
                    Frequently Asked Questions
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 4: Policies & Safe Checkout */}
            <div className="space-y-3">
              <h4 className="font-semibold text-xs uppercase tracking-wider text-emerald-300">
                Policies &amp; Trust
              </h4>
              <ul className="space-y-2 text-xs text-white/75">
                <li>
                  <a href="#privacy" className="hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#terms" className="hover:text-white transition-colors">
                    Terms &amp; Conditions
                  </a>
                </li>
                <li>
                  <a href="#refund" className="hover:text-white transition-colors">
                    Refund &amp; Replacement Policy
                  </a>
                </li>
              </ul>

              <div className="pt-3 border-t border-white/10 space-y-1">
                <span className="text-[11px] text-emerald-200 block font-semibold">
                  100% Secure USA Checkout
                </span>
                <p className="text-[10px] text-white/60">
                  All transactions and pricing in US Dollars (USD).
                </p>
              </div>
            </div>
          </div>

          {/* Copyright Bottom Bar */}
          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/60">
            <div>
              &copy; {new Date().getFullYear()} <strong>Indian-Flowers.com</strong>. All Rights Reserved.
            </div>
            <div className="flex items-center gap-3">
              <span>Currency: <strong>USD ($)</strong></span>
            </div>
          </div>
        </div>
      </footer>

      {/* CART DRAWER */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart as any}
        subtotal={cartSubtotal}
        gstTotal={0}
        grandTotal={cartGrandTotal}
        onUpdateQuantity={updateCartQty}
        onRemove={removeFromCart}
        onCheckout={() => {
          setIsCheckoutOpen(true);
          setIsCartOpen(false);
        }}
      />

      {/* WISHLIST DRAWER */}
      <WishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        items={wishlist}
        onRemoveFromWishlist={handleRemoveFromWishlist}
        onClearWishlist={handleClearWishlist}
        onAddToCart={(prod, variant) => {
          addToCart(prod, variant, 1);
        }}
        onProductClick={(prod) => {
          setSelectedProduct(prod);
          setIsWishlistOpen(false);
        }}
      />

      {/* QUICK VIEW PRODUCT DETAIL MODAL (WITH DYNAMIC VARIANT PICKER & QUANTITY) */}
      <ProductQuickViewModal
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
        product={selectedProduct}
        isWishlisted={selectedProduct ? wishlist.some((w) => w._id === selectedProduct._id) : false}
        onToggleWishlist={handleToggleWishlist}
        onAddToCart={(prod, v, qty) => addToCart(prod, v, qty || 1)}
      />

      {/* PROPER RESPONSIVE ADDED TO CART NOTIFICATION POPUP (BOTH LARGE & SMALL SCREENS) */}
      <AddedToCartPopup
        isOpen={isAddedPopupOpen}
        onClose={() => setIsAddedPopupOpen(false)}
        item={addedItemDetails}
        cartSubtotal={cartSubtotal}
        cartItemCount={cartItemCount}
        onViewCart={() => setIsCartOpen(true)}
        onCheckout={() => setIsCheckoutOpen(true)}
      />

      {/* ORDER TRACKING MODAL */}
      {isTrackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 shadow-2xl p-6 sm:p-8 relative">
            <button
              onClick={() => {
                setIsTrackModalOpen(false);
                setTrackedOrders([]);
                setTrackSearched(false);
                setTrackQuery('');
              }}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-5">
              <div>
                <h3 className="text-xl font-bold tracking-tight text-[#0B3B24]">Track Your Order</h3>
                <p className="text-xs text-gray-500 mt-1 font-normal">
                  Enter your order number (e.g. ORD-1001) or phone number to check live status.
                </p>
              </div>

              <form onSubmit={handleSearchTracking} className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="e.g. ORD-1001 or +1 510..."
                  value={trackQuery}
                  onChange={(e) => setTrackQuery(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:border-[#0B3B24] font-normal"
                />
                <button
                  type="submit"
                  disabled={isSearchingOrders}
                  className="px-5 py-2.5 rounded-xl bg-[#0B3B24] text-white font-medium text-xs transition-colors shrink-0 flex items-center gap-1.5"
                >
                  {isSearchingOrders ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Track'}
                </button>
              </form>

              {trackSearched && trackedOrders.length === 0 && (
                <div className="py-8 text-center text-xs text-gray-500 font-normal">
                  No active orders found matching your search.
                </div>
              )}

              {trackedOrders.length > 0 && (
                <div className="space-y-3 pt-2">
                  {trackedOrders.map((ord) => (
                    <div
                      key={ord._id}
                      className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2 text-xs"
                    >
                      <div className="flex justify-between items-center font-semibold">
                        <span>{ord.orderId}</span>
                        <span className="text-[#0B3B24]">{ord.status}</span>
                      </div>
                      <div className="text-gray-600 font-normal">
                        Total Amount: <strong className="font-semibold">{formatCurrency(ord.totalAmount)}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CHECKOUT MODAL (US DOLLAR ECOMMERCE) */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] border border-gray-200 shadow-2xl overflow-y-auto p-6 sm:p-8 relative">
            <button
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-5">
              <div>
                <h3 className="text-2xl font-bold tracking-tight text-[#0B3B24]">Checkout</h3>
                <p className="text-xs text-gray-500 mt-1 font-normal">
                  Deliver fresh Indian flowers to your doorstep in the United States.
                </p>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-normal">
                  {formError}
                </div>
              )}

              <form onSubmit={handlePlaceOrder} className="space-y-3.5">
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priya Sharma"
                    value={checkoutForm.customerName}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, customerName: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-xs sm:text-sm focus:outline-none focus:border-[#0B3B24] font-normal"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+1 (510) ..."
                      value={checkoutForm.customerPhone}
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, customerPhone: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-xs sm:text-sm focus:outline-none focus:border-[#0B3B24] font-normal"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="priya@example.com"
                      value={checkoutForm.customerEmail}
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, customerEmail: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-xs sm:text-sm focus:outline-none focus:border-[#0B3B24] font-normal"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">
                    US Street Address *
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Apartment, suite, street address"
                    value={checkoutForm.shippingAddress}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, shippingAddress: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-xs sm:text-sm focus:outline-none focus:border-[#0B3B24] font-normal"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">
                    ZIP Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 94538"
                    value={checkoutForm.pincode}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, pincode: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-xs sm:text-sm focus:outline-none focus:border-[#0B3B24] font-normal"
                  />
                </div>

                {/* REAL BACKEND PAYMENT OPTIONS (SOURCED DIRECTLY FROM DATABASE SETTINGS) */}
                <div className="pt-2 border-t border-gray-100 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-800 tracking-wide uppercase">
                      Payment Method *
                    </label>
                    <span className="text-[11px] text-emerald-800 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-emerald-700" /> SSL Protected
                    </span>
                  </div>

                  {!isCodActive && !isUpiActive ? (
                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-normal">
                      Online checkout is temporarily paused by the store administration. Please contact support.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {/* Cash on Delivery (COD) — Real Backend Option */}
                      {isCodActive && (
                        <label
                          className={`block p-3.5 rounded-xl border cursor-pointer transition-all ${
                            checkoutForm.paymentMethod === 'COD'
                              ? 'border-[#0B3B24] bg-emerald-50/40 ring-1 ring-[#0B3B24]'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                name="paymentMethod"
                                value="COD"
                                checked={checkoutForm.paymentMethod === 'COD'}
                                onChange={() => setCheckoutForm({ ...checkoutForm, paymentMethod: 'COD' })}
                                className="w-4 h-4 text-[#0B3B24] focus:ring-[#0B3B24] accent-[#0B3B24]"
                              />
                              <div>
                                <div className="text-xs sm:text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                                  <DollarSign className="w-4 h-4 text-[#0B3B24]" />
                                  Cash on Delivery (COD)
                                </div>
                                <p className="text-[11px] text-gray-500 mt-0.5 font-normal">
                                  Allows customers to pay in cash upon receiving their order package at their address.
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                              Active
                            </span>
                          </div>
                        </label>
                      )}

                      {/* Online UPI Payment — Real Backend Option (Enabled via Admin Settings) */}
                      {isUpiActive && (
                        <div
                          className={`p-3.5 rounded-xl border transition-all ${
                            checkoutForm.paymentMethod === 'UPI'
                              ? 'border-[#0B3B24] bg-emerald-50/40 ring-1 ring-[#0B3B24]'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <label className="flex items-center justify-between cursor-pointer">
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                name="paymentMethod"
                                value="UPI"
                                checked={checkoutForm.paymentMethod === 'UPI'}
                                onChange={() => setCheckoutForm({ ...checkoutForm, paymentMethod: 'UPI' })}
                                className="w-4 h-4 text-[#0B3B24] focus:ring-[#0B3B24] accent-[#0B3B24]"
                              />
                              <div>
                                <div className="text-xs sm:text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                                  <QrCode className="w-4 h-4 text-[#0B3B24]" />
                                  Online UPI Payment
                                </div>
                                <p className="text-[11px] text-gray-500 mt-0.5 font-normal">
                                  Allows customers to pay instantly using Google Pay, PhonePe, Paytm, BHIM, or any UPI app.
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                              Active
                            </span>
                          </label>

                          {checkoutForm.paymentMethod === 'UPI' && (
                            <div className="mt-3.5 pt-3.5 border-t border-emerald-100/80 space-y-3 animate-fadeIn">
                              <div className="bg-white p-3 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
                                <img
                                  src={qrCodeImageUrl}
                                  alt="UPI Payment QR Code"
                                  className="w-28 h-28 rounded-lg border border-gray-200 bg-white p-1 shrink-0"
                                />
                                <div className="space-y-1.5 flex-1">
                                  <div className="text-xs text-gray-600 font-medium">Scan QR Code or pay directly to UPI ID:</div>
                                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                                    <code className="text-xs font-mono font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded border border-gray-200">
                                      {merchantUpiId}
                                    </code>
                                    <button
                                      type="button"
                                      onClick={handleCopyUpi}
                                      className="px-2 py-1 rounded bg-[#0B3B24] text-white text-[11px] font-medium flex items-center gap-1 hover:bg-[#134633] transition-colors"
                                    >
                                      <Copy className="w-3 h-3" />
                                      {copiedUpi ? 'Copied!' : 'Copy'}
                                    </button>
                                  </div>
                                  <div className="text-[11px] text-gray-500">
                                    Payable Amount: <strong className="text-gray-900">{formatCurrency(cartGrandTotal)}</strong>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <label className="text-xs font-medium text-gray-700 block mb-1">
                                  12-Digit UPI UTR / Reference No. *
                                </label>
                                <input
                                  type="text"
                                  required={checkoutForm.paymentMethod === 'UPI'}
                                  placeholder="e.g. 428901928374 (From Payment Receipt)"
                                  value={checkoutForm.transactionId}
                                  onChange={(e) =>
                                    setCheckoutForm({ ...checkoutForm, transactionId: e.target.value.trim() })
                                  }
                                  className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-xs sm:text-sm focus:outline-none focus:border-[#0B3B24] bg-white font-mono"
                                />
                                <p className="text-[11px] text-gray-500 mt-1">
                                  Enter the UTR / Ref ID received after completing payment in your UPI app.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-gray-100 flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-normal">Order Total (USD):</span>
                  <span className="text-lg font-semibold text-gray-900 tabular-nums">{formatCurrency(cartGrandTotal)}</span>
                </div>

                <button
                  type="submit"
                  disabled={submittingOrder || (!isCodActive && !isUpiActive)}
                  className="w-full py-3 rounded-xl bg-[#0B3B24] hover:bg-[#134633] text-white font-medium text-xs uppercase tracking-wider transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Lock className="w-3.5 h-3.5" />
                  {submittingOrder ? 'Processing...' : `Place Order — ${formatCurrency(cartGrandTotal)}`}
                </button>

                <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-500 pt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>256-Bit SSL Encrypted & Protected US Checkout</span>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ORDER SUCCESS MODAL */}
      {orderSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 text-center space-y-4 shadow-2xl border border-gray-100">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-[#0B3B24] flex items-center justify-center mx-auto border border-emerald-100">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-2xl font-bold tracking-tight text-gray-900">
              Order Confirmed!
            </h3>
            <p className="text-xs text-gray-600 font-normal">
              Thank you, <strong className="font-semibold">{orderSuccess.customerName}</strong>! Your order{' '}
              <strong className="text-[#0B3B24] font-semibold">{orderSuccess.orderId}</strong> has been received and is being prepared with fresh blossoms.
            </p>

            <div className="p-3.5 rounded-xl bg-gray-50 text-xs text-gray-700 text-left space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Order Total:</span>
                <strong className="font-semibold text-gray-900">{formatCurrency(orderSuccess.totalAmount)}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Payment:</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-100">
                  <Check className="w-3 h-3 text-emerald-600" />
                  {orderSuccess.paymentMethod === 'UPI'
                    ? 'Online UPI (Pending Verification)'
                    : 'Cash on Delivery (COD)'}
                </span>
              </div>
              {orderSuccess.paymentMethod === 'UPI' && orderSuccess.transactionId && (
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-gray-500">UTR / Ref No:</span>
                  <code className="font-mono font-medium text-gray-800">{orderSuccess.transactionId}</code>
                </div>
              )}
              <div className="flex justify-between items-start pt-1 border-t border-gray-200/60">
                <span className="text-gray-500 shrink-0 mr-2">Deliver to:</span>
                <span className="font-medium text-gray-800 text-right text-[11px]">
                  {orderSuccess.shippingAddress}, {orderSuccess.pincode}
                </span>
              </div>
            </div>

            <button
              onClick={() => setOrderSuccess(null)}
              className="w-full py-2.5 rounded-xl bg-[#0B3B24] hover:bg-[#134633] text-white font-medium text-xs transition-colors cursor-pointer"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      )}

      {/* FLOATING CART BAR (WHEN CART HAS ITEMS) */}
      {cartItemCount > 0 && !isCartOpen && !isCheckoutOpen && (
        <div className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] sm:inset-x-auto sm:right-6 sm:bottom-6 z-40">
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex w-full sm:w-auto items-center justify-center gap-3 bg-[#0B3B24] hover:bg-[#072718] text-white px-5 py-3.5 rounded-full shadow-2xl border border-white/20 transition-colors active:scale-[0.98]"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute -top-1.5 -right-2 bg-[#E0533C] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {cartItemCount}
              </span>
            </div>
            <span className="text-sm font-semibold">
              View cart ({formatCurrency(cartGrandTotal)})
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
