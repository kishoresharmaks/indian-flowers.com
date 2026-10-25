'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { dispatchItemAdded } from '@/components/ItemAddedNotification';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/currency';
import { US_STATES } from '@/lib/tax';
import { validateCheckoutForm } from '@/lib/checkoutValidation';
import Header from '@/components/Header';
import HeroSection, { HeroSlide } from '@/components/HeroSection';
import ShopByCategory from '@/components/home/ShopByCategory';
import type { CategoryItem } from '@/components/home/CategoryCarousel';
import ProductCarousel from '@/components/ProductCarousel';
import FloralCornerDecorations from '@/components/FloralCornerDecorations';
import ProductCard, { Product, ProductVariant } from '@/components/ProductCard';
import ProductQuickViewModal from '@/components/ProductQuickViewModal';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { IDeliveryMode, DEFAULT_DELIVERY_MODES } from '@/lib/delivery';
import WishlistDrawer from '@/components/WishlistDrawer';
import CustomOrderSection from '@/components/CustomOrderSection';
import FloatingCartBar from '@/components/FloatingCartBar';
import EventDeliveryChecker from '@/components/home/EventDeliveryChecker';
import ColdChainStorySection from '@/components/home/ColdChainStorySection';
import {
  ShoppingBag,
  Search,
  CheckCircle2,
  X,
  Truck,
  Clock,
  RefreshCw,
  PackageCheck,
  Plane,
  Store,
  Info,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Headphones,
  Heart,
  Flower2,
  Coins,
  Gift,
  Tag,
  Check,
  CreditCard,
  Lock,
  Wallet,
  DollarSign,
  Loader2,
  Award,
  AlertCircle,
} from 'lucide-react';

interface CartItem {
  product: Product;
  selectedVariant?: ProductVariant;
  quantity: number;
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
  const router = useRouter();
  const [customer, setCustomer] = useState<any | null>(null);

  // Dynamic State sourced 100% from MongoDB
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [banners, setBanners] = useState<HeroSlide[]>([]);
  const [storeSettings, setStoreSettings] = useState<any>(null);

  // Loading States
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingBanners, setLoadingBanners] = useState(true);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');

  // Modals & Drawers State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any | null>(null);

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
    streetAddress: '',
    aptSuite: '',
    city: '',
    state: 'CA',
    zipCode: '',
    country: 'US',
    shippingAddress: '',
    pincode: '',
    paymentMethod: 'Razorpay',
    transactionId: '',
    notes: '',
    deliveryDate: '',
  });
  // Delivery Mode State (Configured dynamically via Admin Settings)
  const [selectedDeliveryMode, setSelectedDeliveryMode] = useState<IDeliveryMode | null>(null);
  const [checkoutTaxResult, setCheckoutTaxResult] = useState<any>(null);
  const [checkoutTaxAmount, setCheckoutTaxAmount] = useState<number>(0);
  const [calculatingTax, setCalculatingTax] = useState<boolean>(false);
  const [fedexShippingQuote, setFedexShippingQuote] = useState<any>(null);
  const [calculatingFedexRates, setCalculatingFedexRates] = useState<boolean>(false);

  // Loyalty Points State
  const [redeemPoints, setRedeemPoints] = useState<number>(0);
  const [pointsDiscount, setPointsDiscount] = useState<number>(0);
  const [estimatedPointsEarned, setEstimatedPointsEarned] = useState<number>(0);
  const [loyaltyConfig, setLoyaltyConfig] = useState<any>(null);
  const [isApplyingPoints, setIsApplyingPoints] = useState<boolean>(false);

  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterMessage, setNewsletterMessage] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'success' | 'already' | 'error'>('idle');

  const isCartMountedRef = useRef(false);
  const lastSavedCartRef = useRef<string>('');

  // Restore Cart on Mount (supports both 'cart' and 'if_cart')
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('cart') || localStorage.getItem('if_cart');
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed) && parsed.length > 0) {
          lastSavedCartRef.current = savedCart;
          setCart(parsed);
        }
      }
    } catch (err) {
      console.error('Failed to parse cart:', err);
    }
  }, []);

  // Listen for Cart Updates from Global Nav, Cart Drawer, or other tabs (synced)
  useEffect(() => {
    const handleCartSync = (e?: Event) => {
      // Ignore broadcasts dispatched by CustomerStore itself to prevent infinite loops
      if ((e as CustomEvent)?.detail?.source === 'CustomerStore') {
        return;
      }
      try {
        const raw = localStorage.getItem('cart') || localStorage.getItem('if_cart') || '';
        if (raw === lastSavedCartRef.current) {
          return;
        }
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            lastSavedCartRef.current = raw;
            setCart(parsed);
            return;
          }
        }
        if (lastSavedCartRef.current !== '') {
          lastSavedCartRef.current = '';
          setCart([]);
        }
      } catch { }
    };

    window.addEventListener('cart-updated', handleCartSync as EventListener);
    window.addEventListener('storage', handleCartSync);
    return () => {
      window.removeEventListener('cart-updated', handleCartSync as EventListener);
      window.removeEventListener('storage', handleCartSync);
    };
  }, []);

  // Save Cart on Change and broadcast with source marker
  useEffect(() => {
    if (!isCartMountedRef.current) {
      isCartMountedRef.current = true;
      return;
    }
    try {
      const json = cart.length > 0 ? JSON.stringify(cart) : '';
      if (json === lastSavedCartRef.current) {
        return;
      }
      lastSavedCartRef.current = json;

      if (json) {
        localStorage.setItem('cart', json);
        localStorage.setItem('if_cart', json);
      } else {
        localStorage.removeItem('cart');
        localStorage.removeItem('if_cart');
      }
      window.dispatchEvent(
        new CustomEvent('cart-updated', { detail: { source: 'CustomerStore' } })
      );
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

  // Fetch active customer session & handle auto-opening checkout if redirected back
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const actionParam = params.get('action');
      const categoryParam = params.get('category');
      const subcategoryParam = params.get('subcategory');
      const searchParam = params.get('search');
      if (actionParam === 'cart') setIsCartOpen(true);
      if (actionParam === 'track') setIsTrackModalOpen(true);
      if (actionParam === 'wishlist') setIsWishlistOpen(true);
      if (categoryParam) setSelectedCategory(categoryParam);
      if (subcategoryParam) setSelectedSubcategory(subcategoryParam);
      if (searchParam) setSearchQuery(searchParam);
    }

    const isCheckoutRedirect =
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('checkout') === 'true';

    fetch('/api/customer/me')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success && data.customer) {
          setCustomer(data.customer);
          if (data.loyaltyConfig) {
            setLoyaltyConfig(data.loyaltyConfig);
          }
          setCheckoutForm((prev) => ({
            ...prev,
            customerName: data.customer.name || prev.customerName,
            customerPhone: data.customer.phone || prev.customerPhone,
            customerEmail: data.customer.email || prev.customerEmail,
            streetAddress: data.customer.address || prev.streetAddress,
            aptSuite: data.customer.aptSuite || prev.aptSuite,
            city: data.customer.district || data.customer.city || prev.city,
            state: data.customer.state || prev.state,
            zipCode: data.customer.zipCode || prev.zipCode,
          }));
          if (isCheckoutRedirect) {
            setIsCheckoutOpen(true);
            window.history.replaceState({}, '', window.location.pathname);
          }
        } else {
          setCustomer(null);
          if (isCheckoutRedirect) {
            setIsCheckoutOpen(false);
            window.history.replaceState({}, '', window.location.pathname);
            router.push('/login?redirect=checkout');
          }
        }
      })
      .catch(() => {
        setCustomer(null);
        if (isCheckoutRedirect) {
          setIsCheckoutOpen(false);
          window.history.replaceState({}, '', window.location.pathname);
          router.push('/login?redirect=checkout');
        }
      });
  }, [router]);

  const handleInitiateCheckout = () => {
    if (!customer) {
      setIsCartOpen(false);
      router.push('/login?redirect=checkout');
      return;
    }
    setCheckoutForm((prev) => ({
      ...prev,
      customerName: prev.customerName || customer.name || '',
      customerPhone: prev.customerPhone || customer.phone || '',
      customerEmail: prev.customerEmail || customer.email || '',
      streetAddress: prev.streetAddress || customer.address || '',
      aptSuite: prev.aptSuite || customer.aptSuite || '',
      city: prev.city || customer.district || customer.city || '',
      state: prev.state || customer.state || 'CA',
      zipCode: prev.zipCode || customer.zipCode || '',
    }));
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  // Listen for open-cart and open-wishlist from global navigation
  useEffect(() => {
    const handleOpenCart = () => setIsCartOpen(true);
    const handleOpenWishlist = () => setIsWishlistOpen(true);
    window.addEventListener('open-cart', handleOpenCart);
    window.addEventListener('open-wishlist', handleOpenWishlist);
    return () => {
      window.removeEventListener('open-cart', handleOpenCart);
      window.removeEventListener('open-wishlist', handleOpenWishlist);
    };
  }, []);

  // 1. Fetch Store Settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        if (data.success && data.data) {
                    const modes: IDeliveryMode[] = Array.isArray(data.data.deliveryModes) && data.data.deliveryModes.length > 0
            ? data.data.deliveryModes
            : DEFAULT_DELIVERY_MODES;
          setStoreSettings({ ...data.data, deliveryModes: modes });
          setSelectedDeliveryMode((current) => current || modes.find((m: any) => m.active !== false) || modes[0]);
          if (data.data.enableRazorpay !== false) {
            setCheckoutForm((prev) => ({ ...prev, paymentMethod: 'Razorpay' }));
          } else if (data.data.enableCOD !== false) {
            setCheckoutForm((prev) => ({ ...prev, paymentMethod: 'COD' }));
          }
        }
      } catch (err) {
        console.error('Failed to fetch settings from DB:', err);
      }
    };
    fetchSettings();
  }, []);

  // 2. Fetch Categories directly from DB
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const res = await fetch(`/api/categories?t=${Date.now()}`, { cache: 'no-store' });
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

  // 4. Fetch Dynamic Products directly from MongoDB based on Search Query
  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const url = new URL('/api/products', window.location.origin);
      if (searchQuery.trim()) url.searchParams.append('search', searchQuery.trim());

      const res = await fetch(url.toString(), { cache: 'no-store' });
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
  }, [searchQuery]);

  const displayedCategories = categories;

  const productsByCategory = useMemo(() => {
    const map = new Map<string, Product[]>();
    for (const p of products) {
      const key = (p.category || '').trim().toLowerCase();
      const existing = map.get(key) || [];
      existing.push(p);
      map.set(key, existing);
    }
    return map;
  }, [products]);

  const getProductsForCategory = useCallback(
    (categoryName: string) => {
      const catLower = categoryName.trim().toLowerCase();
      const prods = productsByCategory.get(catLower) || [];
      if (
        selectedSubcategory &&
        selectedCategory.trim().toLowerCase() === catLower
      ) {
        const subLower = selectedSubcategory.trim().toLowerCase();
        const filtered = prods.filter(
          (p: any) =>
            (p.subcategory && p.subcategory.trim().toLowerCase() === subLower) ||
            p.name.toLowerCase().includes(subLower.replace(/garlands?/i, '').trim())
        );
        return filtered.length > 0 ? filtered : prods;
      }
      return prods;
    },
    [productsByCategory, selectedCategory, selectedSubcategory]
  );

  const getCategoryMeta = (catName: string) => {
    const lower = catName.trim().toLowerCase();
    if (lower.includes('string') || lower.includes('jasmine')) {
      return {
        eyebrow: 'FRESH INDIAN FLOWERS',
        description: 'Premium authentic floral blooms delivered fresh across the United States',
      };
    }
    if (lower.includes('garland') || lower.includes('wedding') || lower.includes('temple')) {
      return {
        eyebrow: 'Fresh Wedding Garland',
        title: 'Our Exclusive Collections',
      };
    }
    if (lower.includes('loose') || lower.includes('daily pooja')) {
      return {
        eyebrow: 'FRESH LOOSE BLOOMS',
      };
    }
    if (lower.includes('leaf') || lower.includes('leaves') || lower.includes('greenery')) {
      return {
        eyebrow: 'SACRED PUJA LEAVES & GREENERY',
      };
    }
    if (lower.includes('kit') || lower.includes('pooja item')) {
      return {
        eyebrow: 'WORSHIP & ARCHANA ESSENTIALS',
      };
    }
    if (lower.includes('bouquet') || lower.includes('arrangement')) {
      return {
        eyebrow: 'CELEBRATION FLORAL ARRANGEMENTS',
      };
    }
    return {
      eyebrow: 'FRESH INDIAN FLOWERS',
    };
  };

  const handleSelectCategory = (catName: string, subName?: string) => {
    setSelectedCategory(catName);
    setSelectedSubcategory(subName || '');
    if (catName === 'All') {
      const el = document.getElementById('products-section');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const slug = catName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const el = document.getElementById(`category-${slug}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      const fallbackEl = document.getElementById('products-section');
      if (fallbackEl) fallbackEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const filteredSearchProducts = searchQuery.trim()
    ? products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    : [];

  // Cart Management
  const addToCart = (product: Product, variant?: ProductVariant, quantity: number = 1) => {
    const effectiveVariant =
      variant ||
      (product.variants && product.variants.length > 0 ? product.variants[0] : undefined);

    setCart((prevCart) => {
      const existingIdx = prevCart.findIndex(
        (it) =>
          it.product._id === product._id &&
          ((!it.selectedVariant && !effectiveVariant) ||
            it.selectedVariant?.name === effectiveVariant?.name)
      );

      let updated: CartItem[];
      if (existingIdx > -1) {
        updated = [...prevCart];
        updated[existingIdx].quantity += quantity;
      } else {
        updated = [...prevCart, { product, selectedVariant: effectiveVariant, quantity }];
      }
      return updated;
    });

    const unitPrice = effectiveVariant ? effectiveVariant.price : product.price;
    dispatchItemAdded({
      product: {
        _id: product._id,
        name: product.name,
        image: product.image,
        price: unitPrice,
      },
      variant: effectiveVariant ? { name: effectiveVariant.name, price: effectiveVariant.price } : undefined,
      quantity,
    });
  };

  const updateCartQty = (productId: string, variantName: string | undefined, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(productId, variantName);
      return;
    }
    setCart((prevCart) => {
      const updated = prevCart.map((item) => {
        if (item.product._id === productId && item.selectedVariant?.name === variantName) {
          return { ...item, quantity: newQty };
        }
        return item;
      });
      return updated;
    });
  };

  const removeFromCart = (productId: string, variantName?: string) => {
    setCart((prevCart) => {
      const updated = prevCart.filter(
        (item) => !(item.product._id === productId && item.selectedVariant?.name === variantName)
      );
      return updated;
    });
  };

  const cartSubtotal = cart.reduce(
    (sum, item) =>
      sum + (item.selectedVariant ? item.selectedVariant.price : item.product.price) * item.quantity,
    0
  );
  const effectivePointsDiscount = isApplyingPoints ? pointsDiscount : 0;
  const deliveryFee = Number(selectedDeliveryMode?.price || 0);
  const cartGrandTotal = Number(
    Math.max(0, cartSubtotal - effectivePointsDiscount + (checkoutTaxAmount || 0) + deliveryFee).toFixed(2)
  );
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Recalculate US Sales Tax dynamically whenever destination state, zip, cart items, or points change
  useEffect(() => {
    if (!isCheckoutOpen || cart.length === 0) {
      setCheckoutTaxResult(null);
      setCheckoutTaxAmount(0);
      setPointsDiscount(0);
      setEstimatedPointsEarned(0);
      return;
    }

    // Lazy-load payment gateway only when checkout drawer is open
    if (typeof (window as any).Razorpay === 'undefined') {
      const rzpScript = document.createElement('script');
      rzpScript.src = 'https://checkout.razorpay.com/v1/checkout.js';
      rzpScript.async = true;
      document.body.appendChild(rzpScript);
    }

    const controller = new AbortController();
    const calculateTaxAsync = async () => {
      try {
        setCalculatingTax(true);
        setCalculatingFedexRates(true);
        const res = await fetch('/api/checkout/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shippingAddress: {
              streetAddress: checkoutForm.streetAddress || 'General Delivery',
              aptSuite: checkoutForm.aptSuite || '',
              city: checkoutForm.city || 'City',
              state: checkoutForm.state || 'CA',
              zipCode: checkoutForm.zipCode || '94538',
              country: 'US',
            },
            items: cart.map((item) => ({
              productId: item.product._id,
              name: item.selectedVariant
                ? `${item.product.name} (${item.selectedVariant.name})`
                : item.product.name,
              variantName: item.selectedVariant?.name || '',
              price: item.selectedVariant ? item.selectedVariant.price : item.product.price,
              quantity: item.quantity,
              isTaxable: item.product.isTaxable !== false,
            })),
            discountAmount: 0,
            shippingFee: selectedDeliveryMode?.price || 0,
            deliveryModeId: selectedDeliveryMode?.id || 'fedex-shipping',
            deliveryMode: selectedDeliveryMode,
            redeemPoints: isApplyingPoints ? redeemPoints : 0,
            customerId: customer?._id || customer?.id || undefined,
            customerPointsBalance: customer?.pointsBalance || 0,
          }),
          signal: controller.signal,
        });

        const data = await res.json();
        if (data.success && data.data) {
          setCheckoutTaxResult(data.data.taxSnapshot);
          setCheckoutTaxAmount(Number(data.data.taxAmount) || 0);
          setPointsDiscount(Number(data.data.pointsDiscount) || 0);
          setEstimatedPointsEarned(Number(data.data.estimatedPointsEarned) || 0);
          if (data.data.loyaltyConfig) {
            setLoyaltyConfig(data.data.loyaltyConfig);
          }

          // Handle Location-Based FedEx Shipping Rates
          if (data.data.fedexRates && data.data.fedexRates.recommendedRate) {
            const rec = data.data.fedexRates.recommendedRate;
            setFedexShippingQuote(data.data.fedexRates);

            setStoreSettings((prev: any) => {
              if (!prev || !Array.isArray(prev.deliveryModes)) return prev;
              const updatedModes = prev.deliveryModes.map((dm: IDeliveryMode) => {
                if (dm.id === 'fedex-shipping') {
                  return {
                    ...dm,
                    price: rec.amount,
                    description: `Doorstep delivery: ${rec.zoneDescription} • Insulated thermal box with ice packs.`,
                    estimatedDays: rec.estimatedTransitDays || 'Next-Day Delivery',
                  };
                }
                return dm;
              });
              return { ...prev, deliveryModes: updatedModes };
            });

            setSelectedDeliveryMode((current: any) => {
              if (current && current.id === 'fedex-shipping') {
                return {
                  ...current,
                  price: rec.amount,
                  description: `Doorstep delivery: ${rec.zoneDescription} • Insulated thermal box with ice packs.`,
                  estimatedDays: rec.estimatedTransitDays || 'Next-Day Delivery',
                };
              }
              return current;
            });
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Tax & Shipping calculation error:', err);
        }
      } finally {
        setCalculatingTax(false);
        setCalculatingFedexRates(false);
      }
    };

    const timeoutId = setTimeout(calculateTaxAsync, 250);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [
    isCheckoutOpen,
    cart,
    checkoutForm.state,
    checkoutForm.zipCode,
    checkoutForm.city,
    selectedDeliveryMode?.id,
    isApplyingPoints,
    redeemPoints,
    customer,
  ]);

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

  const streetAddressValid = (addr: string) => Boolean(addr && addr.trim().length >= 3);

  // Place Order into MongoDB
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFieldErrors({});

    // Enforce Customer Authentication: Only logged-in customers can place orders
    if (!customer) {
      setFormError('Authentication required. Please sign in or register to complete your order.');
      setTimeout(() => {
        setIsCheckoutOpen(false);
        router.push('/login?redirect=checkout');
      }, 700);
      return;
    }

    // 1. Pre-flight Form Validation — Strictly verify all filled form details before initializing Razorpay

    const validation = validateCheckoutForm(checkoutForm, cart.length, selectedDeliveryMode?.type || 'shipping');
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      setFormError(
        validation.firstErrorMessage ||
        'Please verify all highlighted form fields before proceeding.'
      );
      if (validation.firstErrorField) {
        const el = document.getElementById(`checkout-${validation.firstErrorField}`);
        if (el) {
          el.focus();
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      return;
    }

    const isCodActive = storeSettings ? storeSettings.enableCOD !== false : true;
    const isRazorpayActive = storeSettings ? storeSettings.enableRazorpay !== false : true;

    if (!isCodActive && !isRazorpayActive) {
      setFormError('Online checkout is currently paused by store administration.');
      return;
    }

    const currentMethod =
      checkoutForm.paymentMethod === 'Razorpay' && isRazorpayActive
        ? 'Razorpay'
        : isCodActive
          ? 'COD'
          : 'Razorpay';

    try {
      setSubmittingOrder(true);
      const fullShippingAddress = `${checkoutForm.streetAddress}${checkoutForm.aptSuite ? ', ' + checkoutForm.aptSuite : ''
        }, ${checkoutForm.city}, ${checkoutForm.state} ${checkoutForm.zipCode}`;

      const payload = {
        customerId: customer._id || customer.id,
        customerName: checkoutForm.customerName.trim(),
        customerPhone: checkoutForm.customerPhone.trim(),
        customerEmail: checkoutForm.customerEmail.trim(),
        streetAddress: checkoutForm.streetAddress.trim(),
        aptSuite: (checkoutForm.aptSuite || '').trim(),
        city: checkoutForm.city.trim(),
        district: checkoutForm.city.trim(),
        state: checkoutForm.state.trim().toUpperCase(),
        zipCode: checkoutForm.zipCode.trim(),
        country: 'US',
        shippingAddress: fullShippingAddress,
        pincode: checkoutForm.zipCode.trim(),
        paymentMethod: currentMethod,
        transactionId: '',
        redeemPoints: isApplyingPoints ? redeemPoints : 0,
        shippingFee: deliveryFee,
        deliveryMode: selectedDeliveryMode ? {
          id: selectedDeliveryMode.id,
          name: selectedDeliveryMode.name,
          type: selectedDeliveryMode.type,
          price: selectedDeliveryMode.price,
          description: selectedDeliveryMode.description || '',
          pickupLocation: selectedDeliveryMode.pickupLocation || '',
          estimatedDays: selectedDeliveryMode.estimatedDays || '',
        } : null,
        items: cart.map((item) => ({
          productId: item.product._id,
          name: item.selectedVariant
            ? `${item.product.name} (${item.selectedVariant.name})`
            : item.product.name,
          variantName: item.selectedVariant?.name || '',
          price: item.selectedVariant ? item.selectedVariant.price : item.product.price,
          quantity: item.quantity,
          isTaxable: item.product.isTaxable !== false,
          image: item.product.image,
        })),
        totalAmount: cartGrandTotal,
      };

      const refreshCustomerAccount = () => {
        fetch('/api/customer/me')
          .then((res) => res.json())
          .then((data) => {
            if (data && data.success && data.customer) {
              setCustomer(data.customer);
            }
          })
          .catch(() => { });
        setIsApplyingPoints(false);
        setRedeemPoints(0);
      };

      if (currentMethod === 'Razorpay') {
        const rzpOrderRes = await fetch('/api/checkout/razorpay/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: payload.items,
            customerName: payload.customerName,
            streetAddress: payload.streetAddress,
            aptSuite: payload.aptSuite,
            city: payload.city,
            state: payload.state,
            zipCode: payload.zipCode,
            customerEmail: payload.customerEmail,
            customerPhone: payload.customerPhone,
            customerId: customer?._id || customer?.id || undefined,
            redeemPoints: isApplyingPoints ? redeemPoints : 0,
            shippingFee: deliveryFee,
          }),
        });

        const rzpOrderData = await rzpOrderRes.json();
        if (!rzpOrderData.success) {
          if (rzpOrderData.errors) {
            setFieldErrors(rzpOrderData.errors);
          }
          const rawMsg = rzpOrderData.message || '';
          const isDevMsg =
            rawMsg.toLowerCase().includes('razorpay') ||
            rawMsg.toLowerCase().includes('dashboard') ||
            rawMsg.toLowerCase().includes('key') ||
            rawMsg.toLowerCase().includes('secret') ||
            rawMsg.toLowerCase().includes('gateway') ||
            rawMsg.toLowerCase().includes('internal');
          setFormError(
            isDevMsg
              ? 'Unable to initialize card payment at this time. Please try another card or select Cash on Delivery.'
              : rawMsg || 'Failed to initialize payment gateway. Please choose Cash on Delivery.'
          );
          setSubmittingOrder(false);
          return;
        }

        // Mock / Development Sandbox flow
        if (rzpOrderData.isMock) {
          const verifyRes = await fetch('/api/checkout/razorpay/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: rzpOrderData.orderId,
              razorpay_payment_id: `pay_mock_${Date.now()}`,
              razorpay_signature: `mock_sig_${Date.now()}`,
              orderDetails: payload,
            }),
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success && verifyData.data) {
            setOrderSuccess(verifyData.data);
            setCart([]);
            setIsCheckoutOpen(false);
            setIsCartOpen(false);
            localStorage.removeItem('cart');
            localStorage.removeItem('if_cart');
            window.dispatchEvent(new Event('cart-updated'));
            refreshCustomerAccount();
          } else {
            setFormError(verifyData.message || 'Payment verification failed.');
          }
          setSubmittingOrder(false);
          return;
        }

        // Standard Razorpay Modal Flow with automatic script loader
        if (typeof (window as any).Razorpay === 'undefined') {
          await new Promise<void>((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve();
            script.onerror = () => resolve();
            document.body.appendChild(script);
          });
        }

        if (typeof (window as any).Razorpay === 'undefined') {
          setFormError('Unable to load payment gateway. Please choose Cash on Delivery or check your connection.');
          setSubmittingOrder(false);
          return;
        }

        const options = {
          key: rzpOrderData.keyId,
          amount: rzpOrderData.amount,
          currency: rzpOrderData.currency,
          name: storeSettings?.siteName || 'Indian-Flowers.com',
          description: 'Authentic Indian Flowers Delivery',
          order_id: rzpOrderData.orderId,
          handler: async function (response: any) {
            setSubmittingOrder(true);
            try {
              const verifyRes = await fetch('/api/checkout/razorpay/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  orderDetails: payload,
                }),
              });
              const verifyData = await verifyRes.json();
              if (verifyData.success && verifyData.data) {
                setOrderSuccess(verifyData.data);
                setCart([]);
                setIsCheckoutOpen(false);
                setIsCartOpen(false);
                localStorage.removeItem('cart');
                localStorage.removeItem('if_cart');
                window.dispatchEvent(new Event('cart-updated'));
                refreshCustomerAccount();
              } else {
                setFormError(verifyData.message || 'Payment verification failed. If your card was charged, please contact customer support.');
              }
            } catch (vErr) {
              setFormError('Connection error verifying payment with server. If your card was charged, please contact customer support.');
            } finally {
              setSubmittingOrder(false);
            }
          },
          prefill: {
            name: checkoutForm.customerName,
            email: checkoutForm.customerEmail,
            contact: checkoutForm.customerPhone,
          },
          theme: {
            color: '#0B3B24',
          },
          modal: {
            ondismiss: function () {
              setSubmittingOrder(false);
            },
          },
        };

        const rzpInstance = new (window as any).Razorpay(options);
        rzpInstance.on('payment.failed', function (resp: any) {
          const rawError = resp.error?.description || 'Payment was unsuccessful.';
          const lower = rawError.toLowerCase();
          if (
            lower.includes('international') ||
            lower.includes('card') ||
            lower.includes('dashboard') ||
            lower.includes('gateway') ||
            lower.includes('not enabled') ||
            lower.includes('merchant') ||
            lower.includes('razorpay') ||
            lower.includes('account & settings') ||
            lower.includes('payment method')
          ) {
            setFormError(
              'This card payment could not be processed at this time. Please try a different card or select Cash on Delivery to complete your order.'
            );
          } else {
            setFormError(rawError || 'Payment was unsuccessful. Please try again or select Cash on Delivery.');
          }
          setSubmittingOrder(false);
        });
        rzpInstance.open();
        return;
      }

      // COD Order flow
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
        localStorage.removeItem('cart');
        localStorage.removeItem('if_cart');
        window.dispatchEvent(new Event('cart-updated'));
        refreshCustomerAccount();
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

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = (newsletterEmail || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setNewsletterStatus('error');
      setNewsletterMessage('Please enter a valid email address.');
      return;
    }

    setNewsletterLoading(true);
    setNewsletterMessage('');
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, source: 'storefront_footer' }),
      });
      const data = await res.json();
      if (data.success) {
        setNewsletterStatus(data.alreadySubscribed ? 'already' : 'success');
        setNewsletterMessage(data.message || 'Thank you for subscribing!');
        setNewsletterSubscribed(true);
        setTimeout(() => {
          setNewsletterEmail('');
          setNewsletterSubscribed(false);
          setNewsletterStatus('idle');
          setNewsletterMessage('');
        }, 4500);
      } else {
        setNewsletterStatus('error');
        setNewsletterMessage(data.message || 'Unable to subscribe right now. Please try again.');
      }
    } catch (err) {
      console.error('Newsletter error:', err);
      setNewsletterStatus('error');
      setNewsletterMessage('Network error. Please check your internet connection.');
    } finally {
      setNewsletterLoading(false);
    }
  };

  const contactPhone = storeSettings?.contactPhone || '+1 (909) 379-3678';
  const contactEmail = storeSettings?.contactEmail || 'indianflowersorder@gmail.com';

  // Dynamic Backend Payment Options (Real Settings from MongoDB)
  const isCodActive = storeSettings ? storeSettings.enableCOD !== false : true;
  const isRazorpayActive = storeSettings ? storeSettings.enableRazorpay !== false : true;

  const weddingCategory = categories.find((c) =>
    c.name.toLowerCase().includes('wedding')
  );
  const poojaCategory = categories.find(
    (c) => c.name.toLowerCase().includes('loose') || c.name.toLowerCase().includes('pooja')
  );

  return (
    <div className="min-h-[100dvh] flex flex-col justify-between bg-white text-gray-900 font-sans pb-16 md:pb-0">
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
        selectedSubcategory={selectedSubcategory}
        onSelectCategory={handleSelectCategory}
        onMenuToggle={setIsMobileNavOpen}
        storeName={storeSettings?.siteName || 'The Indian Flowers'}
        storeTagline={storeSettings?.tagline || 'Fresh Indian Flowers for Every Occasion'}
        storePhone={storeSettings?.contactPhone || storeSettings?.phone || '+1 (909) 379-3678'}
        storeEmail={storeSettings?.contactEmail || storeSettings?.email || 'indianflowersorder@gmail.com'}
        customer={customer}
        onCustomerChange={setCustomer}
      />

      {/* 2. IMAGE SLIDER HERO (Retrieved from DB Banners) */}
      <HeroSection
        slides={banners}
        loading={loadingBanners}
        onShopClick={() => handleSelectCategory('All')}
      />

      {/* 2.5 EVENT DATE & US ZIP FAST-CHECKER (Hallmark Arrival Guarantee) */}
      <EventDeliveryChecker
        onCheckSuccess={() => {
          const el = document.getElementById('products-section');
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }}
      />

      {/* 3. UNIFIED BOTANICAL CATALOG SECTION ENCLOSING ALL CATEGORIES */}
      <section
        id="products-section"
        className="relative w-full bg-gradient-to-b from-[#FAF7F2] via-[#FFFDF9] via-[#FAF7F2] to-[#FAF6F0] overflow-hidden pt-4 pb-14 sm:pt-6 sm:pb-20 border-b border-stone-200/60"
      >
        {/* Continuous Floral Decorations Framing the Entire Catalog Section */}
        <FloralCornerDecorations />

        {/* Content Container (z-10 above decorations) */}
        <div className="relative z-10 w-full max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Horizontal Category Carousel */}
          <ShopByCategory
            categories={categories}
            loading={loadingCategories}
            selectedCategory={selectedCategory}
            selectedSubcategory={selectedSubcategory}
            onSelectCategory={handleSelectCategory}
          />

          {searchQuery.trim() ? (
            /* Search Results Section */
            <div className="py-8 sm:py-12 border-t border-amber-200/40">
              <div className="space-y-6 sm:space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
                  <div>
                    <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.14em] text-[#C85A78] block">
                      SEARCH RESULTS
                    </span>
                    <h2 className="text-[24px] sm:text-[30px] lg:text-[34px] font-bold tracking-[-0.03em] text-[#0B3B24] mt-1 leading-[1.2]">
                      Results for &ldquo;{searchQuery}&rdquo;
                    </h2>
                    <p className="text-sm sm:text-base text-gray-500 mt-1 font-normal">
                      Showing matching flowers and garlands
                    </p>
                  </div>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="px-4 py-2 rounded-full border border-gray-300 hover:border-[#0B3B24] text-xs font-semibold text-gray-700 hover:text-[#0B3B24] bg-white transition-colors self-start sm:self-auto shadow-2xs"
                  >
                    Clear search
                  </button>
                </div>

                {filteredSearchProducts.length === 0 ? (
                  <div className="py-16 text-center bg-white/80 rounded-2xl p-8 max-w-md mx-auto border border-stone-200/80 shadow-xs">
                    <p className="text-gray-600 text-sm font-normal">
                      No flowers found matching &ldquo;{searchQuery}&rdquo;.
                    </p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="mt-4 px-4 py-2 rounded-full bg-[#0B3B24] text-white text-xs font-medium"
                    >
                      Clear Search &amp; View All Categories
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-2.5 sm:gap-4 lg:gap-6">
                    {filteredSearchProducts.map((product) => (
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
            </div>
          ) : (
            /* ALL CATEGORIES RENDERED DOWN BY DOWN INSIDE THIS COMMON BOTANICAL CONTAINER */
            <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-4">
              {categories.map((category, idx) => {
                const catProducts = getProductsForCategory(category.name);
                if (catProducts.length === 0 && !loadingProducts) return null;
                const meta = getCategoryMeta(category.name);
                const slug = category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

                return (
                  <div
                    key={category._id || category.name}
                    id={`category-${slug}`}
                    className="scroll-mt-24 sm:scroll-mt-28"
                  >
                    {idx > 0 && (
                      <div className="flex items-center justify-center my-6 sm:my-8 px-4" aria-hidden="true">
                        <div className="h-px bg-gradient-to-r from-transparent via-amber-300/40 to-amber-200/70 flex-1 max-w-xs sm:max-w-md" />
                        <div className="mx-3 sm:mx-4 flex items-center gap-1.5 text-amber-600/70">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60" />
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500/80" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C12 2 9 6.5 9 10C9 12.21 10.34 14.1 12 14.73C13.66 14.1 15 12.21 15 10C15 6.5 12 2 12 2Z" opacity="0.9" />
                            <path d="M7.5 7.5C7.5 7.5 5 11 5.5 13.5C5.85 15.24 7.23 16.59 9 17C8.17 15.5 8 13.5 8.5 11.5C8.85 10.1 7.5 7.5 7.5 7.5Z" opacity="0.75" />
                            <path d="M16.5 7.5C16.5 7.5 19 11 18.5 13.5C18.15 15.24 16.77 16.59 15 17C15.83 15.5 16 13.5 15.5 11.5C15.15 10.1 16.5 7.5 16.5 7.5Z" opacity="0.75" />
                            <circle cx="12" cy="18.5" r="1.5" />
                          </svg>
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60" />
                        </div>
                        <div className="h-px bg-gradient-to-l from-transparent via-amber-300/40 to-amber-200/70 flex-1 max-w-xs sm:max-w-md" />
                      </div>
                    )}
                    <ProductCarousel
                      products={catProducts}
                      eyebrow={meta.eyebrow}
                      title={meta.title || category.name}
                      subtitle={meta.description}
                      wishlist={wishlist}
                      onToggleWishlist={handleToggleWishlist}
                      onAddToCart={(prod, v) => addToCart(prod, v, 1)}
                      onProductClick={(prod) => setSelectedProduct(prod)}
                      loading={loadingProducts}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* 5. OCCASION FEATURE DUAL BANNERS (ASYMMETRIC EDITORIAL LAYOUT) */}
      <section className="py-10 sm:py-16 bg-white overflow-hidden">
        <div className="w-full max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-7">
            {/* Banner 1: Wedding & Temple Garlands (7 cols / 58% width) */}
            <div className="lg:col-span-7 relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FAF5ED] via-[#F6EFE5] to-[#EFE2D4] border border-stone-200/80 shadow-xs hover:shadow-[0_16px_40px_rgba(11,59,36,0.09)] transition-all duration-500 flex flex-col sm:flex-row items-stretch group">
              {/* Left Side: Text & Action */}
              <div className="w-full sm:w-[56%] p-6 sm:p-7 lg:p-8 flex flex-col justify-between z-10 space-y-4">
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-600/10 text-amber-900 text-[10px] sm:text-[11px] font-bold tracking-[0.12em] uppercase border border-amber-600/20">
                      <Flower2 className="w-3 h-3 text-amber-600 shrink-0" />
                      <span>Traditional &amp; Custom</span>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-white/90 text-stone-700 text-[10px] font-bold tracking-wide border border-stone-200/60 shadow-2xs">
                      2.5 ft • 3 ft • 3.5 ft
                    </span>
                  </div>

                  <h3 className="text-[21px] sm:text-[24px] lg:text-[27px] font-bold tracking-[-0.03em] text-[#0B3B24] leading-[1.2]">
                    Wedding &amp; Temple Garlands
                  </h3>

                  <p className="text-[12px] sm:text-[13px] text-stone-600 leading-relaxed font-normal">
                    Handcrafted rose petal Jai Malas, fragrant jasmine strands, and gold-trimmed garlands curated for sacred rituals across the USA.
                  </p>
                </div>

                <div className="pt-1 sm:pt-2 flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={() => handleSelectCategory(weddingCategory?.name || 'Wedding & Temple Garlands')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0B3B24] hover:bg-[#134633] active:bg-[#072718] text-white text-xs sm:text-[13px] font-semibold tracking-wide shadow-sm hover:shadow-md transition-all hover:translate-x-0.5 active:scale-95 group/btn cursor-pointer"
                  >
                    <span>Explore Garlands</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
                  </button>
                  <button
                    onClick={() => {
                      const el = document.getElementById('custom-orders-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="inline-flex items-center gap-1 px-4 py-2.5 rounded-full bg-white/80 hover:bg-white text-stone-700 hover:text-[#0B3B24] text-xs sm:text-[12.5px] font-semibold tracking-wide border border-stone-200 transition-colors shadow-2xs cursor-pointer"
                  >
                    <span>Custom Pair Inquiry</span>
                  </button>
                </div>
              </div>

              {/* Right Side: Clear, Crisp Image Canvas */}
              <div className="w-full sm:w-[44%] relative min-h-[220px] sm:min-h-full overflow-hidden">
                <img
                  src="/images/banners/occasion-wedding-garlands.jpg"
                  alt="Wedding &amp; Temple Garlands"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="hidden sm:block absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[#FAF5ED] to-transparent pointer-events-none" />
              </div>
            </div>

            {/* Banner 2: Pooja Flowers & Temple Decor (5 cols / 42% width) */}
            <div className="lg:col-span-5 relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FDF6F2] via-[#F8EDE6] to-[#F2DED7] border border-stone-200/80 shadow-xs hover:shadow-[0_16px_40px_rgba(11,59,36,0.09)] transition-all duration-500 flex flex-col sm:flex-row items-stretch group">
              {/* Left Side: Text & Action */}
              <div className="w-full sm:w-[58%] p-6 sm:p-7 lg:p-8 flex flex-col justify-between z-10 space-y-4">
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600/10 text-rose-900 text-[10px] sm:text-[11px] font-bold tracking-[0.12em] uppercase border border-rose-600/20">
                      <Flower2 className="w-3 h-3 text-[#C85A78] shrink-0" />
                      <span>Daily Worship &amp; Decor</span>
                    </span>
                  </div>

                  <h3 className="text-[21px] sm:text-[23px] lg:text-[25px] font-bold tracking-[-0.03em] text-[#0B3B24] leading-[1.2]">
                    Pooja Flowers &amp; Sacred Leaves
                  </h3>

                  <p className="text-[12px] sm:text-[12.5px] text-stone-600 leading-relaxed font-normal">
                    Sacred lotus stems, fresh bilva, betel leaves, and vibrant loose marigolds packed for daily home puja rituals.
                  </p>
                </div>

                <div className="pt-1 sm:pt-2">
                  <button
                    onClick={() => handleSelectCategory(poojaCategory?.name || 'Loose Flowers for Daily Pooja')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0B3B24] hover:bg-[#134633] active:bg-[#072718] text-white text-xs sm:text-[13px] font-semibold tracking-wide shadow-sm hover:shadow-md transition-all hover:translate-x-0.5 active:scale-95 group/btn cursor-pointer"
                  >
                    <span>Shop Pooja Essentials</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
                  </button>
                </div>
              </div>

              {/* Right Side: Clear, Crisp Image Canvas */}
              <div className="w-full sm:w-[42%] relative min-h-[220px] sm:min-h-full overflow-hidden">
                <img
                  src="/images/banners/occasion-pooja-box.jpg"
                  alt="Pooja Flowers &amp; Temple Decor"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="hidden sm:block absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[#FDF6F2] to-transparent pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. COLD-CHAIN FRESHNESS PROMISE (Replacing the generic 5-box feature grid) */}
      <ColdChainStorySection />

      {/* 6.5 BESPOKE & BULK CUSTOM ORDERS CONTACT FORM */}
      <CustomOrderSection />

      {/* 7. AUSPICIOUS FESTIVAL & EVENT REMINDER HUB */}
      <section className="relative py-12 sm:py-16 md:py-20 bg-gradient-to-b from-[#FAF6F0] via-[#FCF9F4] to-[#FAF6F0] border-t border-b border-stone-200/80">
        <div className="w-full max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-12 max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto">
            <div className="space-y-3 text-center lg:text-left max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600/10 text-rose-900 text-[10px] sm:text-[11px] font-bold tracking-[0.14em] uppercase border border-rose-600/20">
                <Clock className="w-3 h-3 text-[#C85A78] shrink-0" />
                <span>NEVER MISS SACRED FLOWER CUTOFFS</span>
              </div>
              <h3 className="text-[22px] sm:text-[27px] md:text-[32px] font-bold tracking-[-0.03em] text-[#0B3B24] leading-[1.2]">
                Festival &amp; Wedding Delivery Reminders
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 font-normal leading-relaxed max-w-md mx-auto lg:mx-0">
                Fresh flowers fly in directly for upcoming auspicious dates. Subscribe to receive timely reminder alerts 10 days before flight order cutoffs.
              </p>

              {/* Festival Quick-Pills for Contextual Discovery */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-1.5 pt-1">
                {['Diwali 🪔', 'Varalakshmi Vratham 🌸', 'Ganesh Chaturthi 🌺', 'Navratri 🌼', 'Wedding Muhurtham 💍'].map((festival) => (
                  <span
                    key={festival}
                    className="px-2.5 py-1 rounded-full bg-white text-stone-700 text-[11px] font-medium border border-stone-200/90 shadow-2xs"
                  >
                    {festival}
                  </span>
                ))}
              </div>
            </div>

            <div className="w-full sm:w-auto max-w-md shrink-0 flex flex-col items-stretch">
              <form
                onSubmit={handleNewsletterSubmit}
                className="flex w-full flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
              >
                <div className="relative flex-1 min-w-[240px] sm:min-w-[280px]">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    disabled={newsletterLoading}
                    placeholder="Enter your email for reminders"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 sm:py-3.5 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#0B3B24] focus:ring-1 focus:ring-[#0B3B24] font-normal shadow-2xs disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={newsletterLoading || newsletterSubscribed}
                  className="w-full sm:w-auto px-6 py-3 sm:py-3.5 rounded-xl bg-[#0B3B24] hover:bg-[#134633] disabled:bg-[#0B3B24]/80 text-white font-semibold text-xs sm:text-sm whitespace-nowrap shadow-xs transition-colors cursor-pointer flex items-center justify-center min-w-[130px]"
                >
                  {newsletterLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin text-white" />
                      <span>Saving...</span>
                    </>
                  ) : newsletterSubscribed ? (
                    <>
                      <Check className="w-4 h-4 mr-1.5 text-emerald-300" />
                      <span>Subscribed!</span>
                    </>
                  ) : (
                    'Get Reminders'
                  )}
                </button>
              </form>

              {newsletterMessage && (
                <div
                  className={`mt-2.5 flex items-center gap-2 text-xs font-medium px-3.5 py-2 rounded-lg border transition-all ${
                    newsletterStatus === 'error'
                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                      : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  }`}
                >
                  {newsletterStatus === 'error' ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  )}
                  <span>{newsletterMessage}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 9. BRAND FOOTER (UNIFIED) */}
      <Footer
        categories={categories}
        onSelectCategory={(catName) => {
          setSelectedCategory(catName);
          const el = document.getElementById('products-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onTrackOrderClick={() => setIsTrackModalOpen(true)}
        contactPhone={contactPhone}
        contactEmail={contactEmail}
      />

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
        onCheckout={handleInitiateCheckout}
        deliveryModes={storeSettings?.deliveryModes && storeSettings.deliveryModes.length > 0 ? storeSettings.deliveryModes : DEFAULT_DELIVERY_MODES}
        selectedDeliveryMode={selectedDeliveryMode}
        onSelectDeliveryMode={setSelectedDeliveryMode}
      />

      {/* WISHLIST DRAWER */}
      <WishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        items={wishlist}
        cartProductIds={cart.map((it) => it.product._id)}
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

      {/* ORDER TRACKING MODAL */}
      {isTrackModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
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

              {customer && (
                <div className="p-3 bg-emerald-50/80 border border-emerald-200/90 rounded-xl flex items-start gap-2.5 text-xs text-[#0B3B24]">
                  <CheckCircle2 className="w-4 h-4 text-[#0B3B24] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-emerald-950">
                      Logged in as {customer.name} ({customer.email})
                    </span>
                    <span className="text-gray-600">
                      US delivery address pre-filled from your account. You can edit any details below for this shipment.
                    </span>
                  </div>
                </div>
              )}

              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-normal">
                  {formError}
                </div>
              )}

              {!customer ? (
                <div className="p-6 text-center space-y-4 bg-stone-50 rounded-2xl border border-stone-200">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#0B3B24] flex items-center justify-center mx-auto">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-gray-900">Sign In Required to Checkout</h4>
                    <p className="text-xs text-gray-600 max-w-sm mx-auto leading-relaxed font-normal">
                      Only verified accounts can complete flower orders for guaranteed cold-chain arrival. Your shopping cart items are securely saved.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCheckoutOpen(false);
                        router.push('/login?redirect=checkout');
                      }}
                      className="px-5 py-2.5 rounded-xl bg-[#0B3B24] hover:bg-[#134633] text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
                    >
                      Sign In to Checkout
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCheckoutOpen(false);
                        router.push('/register?redirect=checkout');
                      }}
                      className="px-5 py-2.5 rounded-xl border border-stone-300 hover:border-stone-400 bg-white text-stone-700 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Create Account
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handlePlaceOrder} className="space-y-3.5">
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">
                    Full Name *
                  </label>
                  <input
                    id="checkout-customerName"
                    type="text"
                    required
                    placeholder="e.g. Priya Sharma"
                    value={checkoutForm.customerName}
                    onChange={(e) => {
                      setCheckoutForm({ ...checkoutForm, customerName: e.target.value });
                      if (fieldErrors.customerName) {
                        setFieldErrors((prev) => ({ ...prev, customerName: '' }));
                      }
                    }}
                    className={`w-full px-3.5 py-2 rounded-lg border text-xs sm:text-sm focus:outline-none font-normal transition-colors ${fieldErrors.customerName
                        ? 'border-rose-400 bg-rose-50/20 text-rose-900 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                        : 'border-gray-200 focus:border-[#0B3B24]'
                      }`}
                  />
                  {fieldErrors.customerName && (
                    <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {fieldErrors.customerName}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">
                      Phone Number *
                    </label>
                    <input
                      id="checkout-customerPhone"
                      type="tel"
                      required
                      placeholder="+1 (510) 555-0123"
                      value={checkoutForm.customerPhone}
                      onChange={(e) => {
                        setCheckoutForm({ ...checkoutForm, customerPhone: e.target.value });
                        if (fieldErrors.customerPhone) {
                          setFieldErrors((prev) => ({ ...prev, customerPhone: '' }));
                        }
                      }}
                      className={`w-full px-3.5 py-2 rounded-lg border text-xs sm:text-sm focus:outline-none font-normal transition-colors ${fieldErrors.customerPhone
                          ? 'border-rose-400 bg-rose-50/20 text-rose-900 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                          : 'border-gray-200 focus:border-[#0B3B24]'
                        }`}
                    />
                    {fieldErrors.customerPhone && (
                      <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        {fieldErrors.customerPhone}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">
                      Email Address *
                    </label>
                    <input
                      id="checkout-customerEmail"
                      type="email"
                      required
                      placeholder="priya@example.com"
                      value={checkoutForm.customerEmail}
                      onChange={(e) => {
                        setCheckoutForm({ ...checkoutForm, customerEmail: e.target.value });
                        if (fieldErrors.customerEmail) {
                          setFieldErrors((prev) => ({ ...prev, customerEmail: '' }));
                        }
                      }}
                      className={`w-full px-3.5 py-2 rounded-lg border text-xs sm:text-sm focus:outline-none font-normal transition-colors ${fieldErrors.customerEmail
                          ? 'border-rose-400 bg-rose-50/20 text-rose-900 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                          : 'border-gray-200 focus:border-[#0B3B24]'
                        }`}
                    />
                    {fieldErrors.customerEmail && (
                      <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        {fieldErrors.customerEmail}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">
                    Street Address *
                  </label>
                  <input
                    id="checkout-streetAddress"
                    type="text"
                    required
                    placeholder="e.g. 123 Mission Blvd"
                    value={checkoutForm.streetAddress}
                    onChange={(e) => {
                      setCheckoutForm({ ...checkoutForm, streetAddress: e.target.value });
                      if (fieldErrors.streetAddress) {
                        setFieldErrors((prev) => ({ ...prev, streetAddress: '' }));
                      }
                    }}
                    className={`w-full px-3.5 py-2 rounded-lg border text-xs sm:text-sm focus:outline-none font-normal transition-colors ${fieldErrors.streetAddress
                        ? 'border-rose-400 bg-rose-50/20 text-rose-900 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                        : 'border-gray-200 focus:border-[#0B3B24]'
                      }`}
                  />
                  {fieldErrors.streetAddress && (
                    <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {fieldErrors.streetAddress}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">
                    Apartment, Suite, Unit (Optional)
                  </label>
                  <input
                    id="checkout-aptSuite"
                    type="text"
                    placeholder="Apt 4B, Suite 200, etc."
                    value={checkoutForm.aptSuite}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, aptSuite: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-xs sm:text-sm focus:outline-none focus:border-[#0B3B24] font-normal"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">
                      City *
                    </label>
                    <input
                      id="checkout-city"
                      type="text"
                      required
                      placeholder="e.g. Fremont"
                      value={checkoutForm.city}
                      onChange={(e) => {
                        setCheckoutForm({ ...checkoutForm, city: e.target.value });
                        if (fieldErrors.city) {
                          setFieldErrors((prev) => ({ ...prev, city: '' }));
                        }
                      }}
                      className={`w-full px-3.5 py-2 rounded-lg border text-xs sm:text-sm focus:outline-none font-normal transition-colors ${fieldErrors.city
                          ? 'border-rose-400 bg-rose-50/20 text-rose-900 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                          : 'border-gray-200 focus:border-[#0B3B24]'
                        }`}
                    />
                    {fieldErrors.city && (
                      <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        {fieldErrors.city}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">
                      State *
                    </label>
                    <select
                      id="checkout-state"
                      required
                      value={checkoutForm.state}
                      onChange={(e) => {
                        setCheckoutForm({ ...checkoutForm, state: e.target.value });
                        if (fieldErrors.state) {
                          setFieldErrors((prev) => ({ ...prev, state: '' }));
                        }
                      }}
                      className={`w-full px-3.5 py-2 rounded-lg border text-xs sm:text-sm focus:outline-none font-normal bg-white transition-colors ${fieldErrors.state
                          ? 'border-rose-400 bg-rose-50/20 text-rose-900 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                          : 'border-gray-200 focus:border-[#0B3B24]'
                        }`}
                    >
                      {Object.entries(US_STATES).map(([code, name]) => (
                        <option key={code} value={code}>
                          {code} — {name}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.state && (
                      <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        {fieldErrors.state}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">
                      ZIP Code *
                    </label>
                    <input
                      id="checkout-zipCode"
                      type="text"
                      required
                      placeholder="e.g. 94538"
                      value={checkoutForm.zipCode}
                      onChange={(e) => {
                        setCheckoutForm({ ...checkoutForm, zipCode: e.target.value });
                        if (fieldErrors.zipCode) {
                          setFieldErrors((prev) => ({ ...prev, zipCode: '' }));
                        }
                      }}
                      className={`w-full px-3.5 py-2 rounded-lg border text-xs sm:text-sm focus:outline-none font-normal transition-colors ${fieldErrors.zipCode
                          ? 'border-rose-400 bg-rose-50/20 text-rose-900 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                          : 'border-gray-200 focus:border-[#0B3B24]'
                        }`}
                    />
                    {fieldErrors.zipCode && (
                      <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        {fieldErrors.zipCode}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      disabled
                      value="United States (US)"
                      className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-xs sm:text-sm bg-gray-50 text-gray-600 font-normal cursor-not-allowed"
                    />
                  </div>
                </div>


                {/* CUSTOMER LOYALTY REWARDS & POINTS REDEMPTION */}
                {customer && loyaltyConfig?.enabled !== false && (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50/90 via-orange-50/50 to-yellow-50/40 border border-amber-200/90 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                          <Gift className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-[#0B3B24] uppercase tracking-wider">
                            Customer Loyalty Rewards
                          </h4>
                          <p className="text-[11px] text-[#64748B]">
                            Your balance: <strong className="text-amber-800 font-bold inline-flex items-center gap-1"><Coins className="w-3.5 h-3.5 text-amber-500 shrink-0" /> {customer.pointsBalance || 0} pts</strong>
                            {customer.pointsBalance ? ` (≈ ${formatCurrency((customer.pointsBalance || 0) / (loyaltyConfig?.pointsPerDollar || 10))} value)` : ''}
                          </p>
                        </div>
                      </div>

                      {estimatedPointsEarned > 0 && (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-200 shrink-0 inline-flex items-center gap-1">
                          <Coins className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>+{estimatedPointsEarned} pts on this order</span>
                        </span>
                      )}
                    </div>

                    {/* Redemption Controls */}
                    {loyaltyConfig?.redemptionEnabled !== false && (customer.pointsBalance || 0) > 0 ? (
                      <div className="pt-2 border-t border-amber-200/60 space-y-2">
                        <label className="flex items-start gap-2.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isApplyingPoints}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setIsApplyingPoints(checked);
                              if (checked && redeemPoints === 0) {
                                const ptsPerDollar = loyaltyConfig?.pointsPerDollar || 10;
                                const maxOrderPts = Math.floor(cartSubtotal * ptsPerDollar);
                                const available = customer.pointsBalance || 0;
                                const defaultPts = Math.min(available, maxOrderPts);
                                setRedeemPoints(defaultPts);
                              }
                            }}
                            className="mt-0.5 w-4 h-4 rounded text-amber-600 focus:ring-amber-500 accent-amber-600 cursor-pointer"
                          />
                          <div className="text-xs">
                            <span className="font-bold text-[#0B3B24]">
                              Redeem Loyalty Points for an instant discount
                            </span>
                            <p className="text-[11px] text-[#64748B]">
                              Apply your points towards this order ({loyaltyConfig?.pointsPerDollar || 10} pts = $1.00 USD).
                            </p>
                          </div>
                        </label>

                        {isApplyingPoints && (
                          <div className="pl-6 pt-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min={loyaltyConfig?.minPointsToRedeem || 1}
                                max={customer.pointsBalance || 0}
                                step="1"
                                value={redeemPoints || ''}
                                onChange={(e) => {
                                  const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                                  const max = customer.pointsBalance || 0;
                                  setRedeemPoints(Math.min(val, max));
                                }}
                                className="w-28 px-3 py-1.5 rounded-lg border border-amber-300 text-xs font-bold text-amber-900 focus:outline-none focus:border-amber-500 bg-white"
                                placeholder="Points"
                              />
                              <span className="text-xs text-[#64748B]">pts</span>

                              <button
                                type="button"
                                onClick={() => {
                                  const ptsPerDollar = loyaltyConfig?.pointsPerDollar || 10;
                                  const maxOrderPts = Math.floor(cartSubtotal * ptsPerDollar);
                                  const maxAllowed = Math.min(customer.pointsBalance || 0, maxOrderPts);
                                  setRedeemPoints(maxAllowed);
                                }}
                                className="text-[11px] font-bold text-amber-700 hover:text-amber-800 underline ml-2 cursor-pointer"
                              >
                                Use Max Points
                              </button>
                            </div>

                            {effectivePointsDiscount > 0 && (
                              <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" />
                                Instant discount applied: -{formatCurrency(effectivePointsDiscount)}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-[11px] text-[#64748B] pt-1">
                        {loyaltyConfig?.redemptionEnabled === false
                          ? 'Points redemption is currently disabled by store administration.'
                          : `Earn reward points on every order! (${loyaltyConfig?.pointsEarned || 10} pts for every $${loyaltyConfig?.spendAmount || 100} spent)`}
                      </div>
                    )}
                  </div>
                )}

                                {/* DYNAMIC DELIVERY MODES SELECTION (CONFIGURED IN ADMIN SETTINGS) */}
                <div className="pt-2 border-t border-gray-100 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-800 tracking-wide uppercase flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-[#0B3B24]" />
                      <span>Delivery Mode / Shipment *</span>
                    </label>
                    {selectedDeliveryMode && (
                      <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                        {selectedDeliveryMode.price > 0 ? formatCurrency(selectedDeliveryMode.price) : 'Local Pickup'}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {((storeSettings?.deliveryModes && storeSettings.deliveryModes.length > 0)
                      ? storeSettings.deliveryModes
                      : DEFAULT_DELIVERY_MODES
                    )
                      .filter((m: any) => m.active !== false)
                      .map((mode: any) => {
                        const isSelected = selectedDeliveryMode?.id === mode.id;
                        const isPickup = mode.type === 'pickup';

                        return (
                          <label
                            key={mode.id}
                            onClick={() => setSelectedDeliveryMode(mode)}
                            className={`block p-3 rounded-xl border cursor-pointer transition-all ${
                              isSelected
                                ? 'border-[#0B3B24] bg-emerald-50/40 ring-1 ring-[#0B3B24]'
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <input
                                type="radio"
                                name="checkoutDeliveryMode"
                                checked={isSelected}
                                onChange={() => setSelectedDeliveryMode(mode)}
                                className="mt-0.5 w-4 h-4 text-[#0B3B24] focus:ring-[#0B3B24] accent-[#0B3B24] cursor-pointer"
                              />

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-bold text-gray-900 truncate flex items-center gap-1.5">
                                    {isPickup ? (
                                      <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                    ) : mode.name.toLowerCase().includes('air') || mode.name.toLowerCase().includes('south') ? (
                                      <Plane className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                                    ) : (
                                      <Truck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    )}
                                    <span className="truncate">{mode.name}</span>
                                  </span>
                                  <span className="text-xs font-bold text-[#0B3B24] shrink-0 tabular-nums">
                                    {mode.price > 0 ? formatCurrency(mode.price) : '$0.00'}
                                  </span>
                                </div>

                                {mode.description && (
                                  <p className={`text-[11px] mt-0.5 line-clamp-2 leading-relaxed ${
                                    isPickup ? 'text-amber-700 font-medium' : 'text-gray-500'
                                  }`}>
                                    {mode.description}
                                  </p>
                                )}

                                {mode.id === 'fedex-shipping' && fedexShippingQuote?.destination?.zoneName && checkoutForm.zipCode && (
                                  <div className="mt-1">
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-800 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                                      📍 Location Rated: {fedexShippingQuote.destination.zoneName}
                                    </span>
                                  </div>
                                )}

                                {isPickup && mode.pickupLocation && (
                                  <p className="text-[10px] text-stone-500 font-normal mt-0.5">
                                    Pickup Hub: {mode.pickupLocation}
                                  </p>
                                )}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                  </div>

                  {selectedDeliveryMode?.id === 'fedex-shipping' && (
                    <div className="p-2.5 rounded-xl bg-purple-50/80 border border-purple-200 text-[11px] text-purple-950 flex items-start gap-2">
                      <Truck className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-semibold block">FedEx Priority Direct Doorstep Delivery</strong>
                        <span>
                          Packed fresh in insulated thermal cartons with cold ice packs dispatched from Fontana, CA.
                          {fedexShippingQuote?.destination?.zoneName ? ` Accurate location-based rate applied for ${fedexShippingQuote.destination.zoneName}.` : ' Enter your destination ZIP code to calculate live dynamic carrier rates.'}
                        </span>
                      </div>
                    </div>
                  )}

                  {selectedDeliveryMode?.type === 'pickup' && (
                    <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-semibold block">In-Person Regional Collection Selected</strong>
                        <span>Your fresh blooms will be prepared for collection at {selectedDeliveryMode.pickupLocation || selectedDeliveryMode.name}. A few dollars are applicable during local pickup.</span>
                      </div>
                    </div>
                  )}
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

                  {!isCodActive && !isRazorpayActive ? (
                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-normal">
                      Online checkout is temporarily paused by the store administration. Please contact support.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {/* Razorpay Online Payment — US Credit/Debit Cards, NetBanking */}
                      {isRazorpayActive && (
                        <label
                          className={`block p-3.5 rounded-xl border cursor-pointer transition-all ${checkoutForm.paymentMethod === 'Razorpay'
                              ? 'border-[#0B3B24] bg-emerald-50/40 ring-1 ring-[#0B3B24]'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                name="paymentMethod"
                                value="Razorpay"
                                checked={checkoutForm.paymentMethod === 'Razorpay'}
                                onChange={() => setCheckoutForm({ ...checkoutForm, paymentMethod: 'Razorpay' })}
                                className="w-4 h-4 text-[#0B3B24] focus:ring-[#0B3B24] accent-[#0B3B24]"
                              />
                              <div>
                                <div className="text-xs sm:text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                                  <CreditCard className="w-4 h-4 text-[#0B3B24]" />
                                  Credit or Debit Card (Secure Checkout)
                                </div>
                                <p className="text-[11px] text-gray-500 mt-0.5 font-normal">
                                  Pay securely with US Credit Cards, Debit Cards, and NetBanking in USD.
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                              Active
                            </span>
                          </div>
                        </label>
                      )}

                      {/* Cash on Delivery (COD) — Real Backend Option */}
                      {isCodActive && (
                        <label
                          className={`block p-3.5 rounded-xl border cursor-pointer transition-all ${checkoutForm.paymentMethod === 'COD'
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
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-gray-100 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center text-gray-600 font-normal">
                    <span>Subtotal:</span>
                    <span className="tabular-nums font-medium text-gray-900">{formatCurrency(cartSubtotal)}</span>
                  </div>
                  {selectedDeliveryMode && (
                    <div className="flex justify-between items-center text-gray-600 font-normal">
                      <span className="truncate pr-2">
                        Shipment ({selectedDeliveryMode.name}):
                      </span>
                      <span className="tabular-nums font-semibold text-emerald-800 shrink-0">
                        {deliveryFee > 0 ? formatCurrency(deliveryFee) : '$0.00 (Pay at Pickup)'}
                      </span>
                    </div>
                  )}
                  {effectivePointsDiscount > 0 && (
                    <div className="flex justify-between items-center text-purple-700 font-semibold bg-purple-50 px-2.5 py-1.5 rounded-xl border border-purple-100">
                      <span className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-purple-600" />
                        <span>Loyalty Points Discount ({redeemPoints} pts):</span>
                      </span>
                      <span className="tabular-nums">-{formatCurrency(effectivePointsDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-gray-600 font-normal">
                    <span>
                      Estimated Sales Tax{checkoutTaxResult?.effectiveRate ? ` (${(checkoutTaxResult.effectiveRate * 100).toFixed(1)}%)` : ''}:
                    </span>
                    <span className="tabular-nums font-medium text-gray-900">
                      {calculatingTax ? 'Calculating...' : formatCurrency(checkoutTaxAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1.5 border-t border-gray-100">
                    <span className="text-gray-700 font-semibold">Order Total (USD):</span>
                    <span className="text-lg font-bold text-[#0B3B24] tabular-nums">{formatCurrency(cartGrandTotal)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submittingOrder || (!isCodActive && !isRazorpayActive)}
                  className="w-full py-3 rounded-xl bg-[#0B3B24] hover:bg-[#134633] text-white font-medium text-xs uppercase tracking-wider transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Lock className="w-3.5 h-3.5" />
                  {submittingOrder
                    ? 'Processing...'
                    : checkoutForm.paymentMethod === 'Razorpay'
                      ? `Pay with Card — ${formatCurrency(cartGrandTotal)}`
                      : `Place Order — ${formatCurrency(cartGrandTotal)}`}
                </button>

                <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-500 pt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>256-Bit SSL Encrypted & Protected US Checkout</span>
                </div>
              </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ORDER SUCCESS MODAL */}
      {orderSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
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
              {orderSuccess.deliveryMode && (
                <div className="flex justify-between items-center text-[11px] bg-stone-100 p-2 rounded-lg border border-stone-200">
                  <span className="text-gray-600 font-medium flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-[#0B3B24]" />
                    <span>Delivery Mode:</span>
                  </span>
                  <strong className="font-semibold text-gray-900">{orderSuccess.deliveryMode.name}</strong>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Payment:</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-100">
                  <Check className="w-3 h-3 text-emerald-600" />
                  {orderSuccess.paymentMethod === 'Razorpay'
                    ? 'Paid Online (Card Verified)'
                    : orderSuccess.paymentMethod === 'CreditCard'
                      ? 'Paid Online (Card Verified)'
                      : 'Cash on Delivery (COD)'}
                </span>
              </div>
              {orderSuccess.transactionId && (
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-gray-500">
                    Payment Reference ID:
                  </span>
                  <code className="font-mono font-medium text-gray-800">{orderSuccess.transactionId}</code>
                </div>
              )}
              {orderSuccess.pointsEarned > 0 && (
                <div className="flex justify-between items-center text-[11px] bg-emerald-50 text-emerald-800 p-2 rounded-lg border border-emerald-100 font-semibold">
                  <span className="flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-amber-500" />
                    <span>Loyalty Points:</span>
                  </span>
                  <span>+{orderSuccess.pointsEarned} pts (Credited upon delivery)</span>
                </div>
              )}
              {orderSuccess.pointsRedeemed > 0 && (
                <div className="flex justify-between items-center text-[11px] bg-purple-50 text-purple-800 p-2 rounded-lg border border-purple-100 font-semibold">
                  <span>Points Redeemed:</span>
                  <span>{orderSuccess.pointsRedeemed} pts (-{formatCurrency(orderSuccess.pointsDiscount || 0)})</span>
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

      {/* FLOATING CART BAR (WITH USER PROVIDED FLORAL BASKET ASSET) */}
      <FloatingCartBar
        cartItemCount={cartItemCount}
        cartGrandTotal={cartGrandTotal}
        onOpenCart={() => setIsCartOpen(true)}
        isCartOpen={isCartOpen}
        isCheckoutOpen={isCheckoutOpen}
        isMobileMenuOpen={isMobileNavOpen}
      />
    </div>
  );
}
