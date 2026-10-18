'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/currency';
import { calculateVerifiedRevenue, getOrderPaymentDisplayInfo } from '@/lib/revenue';
import {
  Plus,
  Package,
  ShoppingBag,
  LogOut,
  Trash2,
  Edit,
  Clock,
  X,
  Upload,
  RefreshCw,
  DollarSign,
  Phone,
  Mail,
  MapPin,
  Filter,
  Layers,
  Tag,
  CreditCard,
  QrCode,
  ChevronLeft,
  ChevronRight,
  Check,
  Image as ImageIcon,
  Zap,
  Store,
  Menu,
  FileText,
  Lock,
  ShieldCheck,
  Flower2,
  Calendar,
  Search,
  Download,
  Users,
  FileSpreadsheet,
  ArrowRight,
  Settings,
  ExternalLink,
  Eye,
  Printer,
  RotateCcw,
  Sparkles,
  Award,
} from 'lucide-react';
import POSCounter from './components/pos/POSCounter';
import POSReceipt from './components/pos/POSReceipt';
import SubscriptionTab from '@/components/licensing/SubscriptionTab';
import GracePeriodBanner from '@/components/licensing/GracePeriodBanner';
import LicenseActivationModal from '@/components/licensing/LicenseActivationModal';
import PolicyManagerTab from '@/components/admin/PolicyManagerTab';
import CustomersTab from '@/components/admin/CustomersTab';
import ReportsTab from '@/components/admin/ReportsTab';
import { IClientLicenseState } from '@/lib/licensing/licenseTypes';

interface BannerItem {
  _id: string;
  title: string;
  eyebrow?: string;
  description?: string;
  ctaText?: string;
  image: string;
  link?: string;
  badgeText?: string;
  order?: number;
  active?: boolean;
  createdAt: string;
}

interface ProductVariant {
  _id?: string;
  name: string;
  mrp: number | string;
  price: number | string;
  quantity: number | string;
  discount?: number;
}

interface Product {
  _id: string;
  name: string;
  description: string;
  image: string;
  mrp: number;
  price: number;
  discount: number;
  quantity: number;
  gst: number;
  category: string;
  variants?: ProductVariant[];
  createdAt: string;
}

interface CategoryItem {
  _id: string;
  name: string;
  image?: string;
  order?: number;
  createdAt: string;
}

interface OrderItem {
  productId: string;
  name: string;
  variantName?: string;
  price: number;
  quantity: number;
  gst?: number;
  isTaxable?: boolean;
  taxCode?: string;
  image?: string;
}

interface Order {
  _id: string;
  orderId: string;
  invoiceNumber?: string;
  orderType?: 'ONLINE' | 'POS';
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  shippingAddress: string;
  pincode?: string;
  items: OrderItem[];
  subtotal: number;
  totalTax?: number;
  totalGst?: number;
  taxSnapshot?: any;
  totalAmount: number;
  discountType?: 'FLAT' | 'PERCENTAGE';
  discountValue?: number;
  discountAmount?: number;
  pointsRedeemed?: number;
  pointsDiscount?: number;
  pointsEarned?: number;
  pointsAwarded?: boolean;
  paymentMethod: 'COD' | 'CASH' | 'CreditCard' | 'Razorpay' | 'ApplePay' | 'PayPal';
  paymentStatus: 'Pending' | 'Paid' | 'Failed' | 'Refunded' | 'Partially_Refunded';
  transactionId?: string;
  cashReceived?: number;
  changeReturned?: number;
  cashierName?: string;
  cashierId?: string;
  status: 'Pending' | 'Processing' | 'Delivered' | 'Completed' | 'Cancelled' | 'Refunded' | 'Returned';
  refundAmount?: number;
  refundReason?: string;
  refundDate?: string;
  isRestocked?: boolean;
  restockedAt?: string;
  refundNotes?: string;
  createdAt: string;
}

interface CustomOrderInquiry {
  _id: string;
  inquiryId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  cityState: string;
  eventDate?: string;
  occasion: string;
  requirements: string;
  budget?: string;
  status: 'NEW' | 'CONTACTED' | 'QUOTED' | 'CONFIRMED' | 'ARCHIVED';
  internalNotes?: string;
  createdAt: string;
}

interface SubscriberItem {
  _id: string;
  email: string;
  status: 'active' | 'unsubscribed';
  source?: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<
    | 'products'
    | 'categories'
    | 'orders'
    | 'banners'
    | 'settings'
    | 'pos'
    | 'subscription'
    | 'customOrders'
    | 'subscribers'
    | 'policies'
    | 'customers'
    | 'reports'
  >('products');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (
        tabParam &&
        [
          'products',
          'categories',
          'orders',
          'banners',
          'settings',
          'pos',
          'subscription',
          'customOrders',
          'subscribers',
          'policies',
          'customers',
          'reports',
        ].includes(tabParam)
      ) {
        setActiveTab(tabParam as any);
      }
    }
  }, []);
  const [licenseState, setLicenseState] = useState<IClientLicenseState | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // POS & Billing Security Lock State
  const [isPosUnlocked, setIsPosUnlocked] = useState(false);
  const [isSecModalOpen, setIsSecModalOpen] = useState(false);
  const [secPasswordInput, setSecPasswordInput] = useState('');
  const [secPasswordError, setSecPasswordError] = useState('');
  const [secSubmitting, setSecSubmitting] = useState(false);
  const [targetTabAfterUnlock, setTargetTabAfterUnlock] = useState<'pos' | 'billing' | null>(null);

  const handleVerifySecPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecPasswordError('');
    setSecSubmitting(true);
    try {
      const res = await fetch('/api/auth/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: secPasswordInput }),
      });
      const data = await res.json();
      if (data.success) {
        setIsPosUnlocked(true);
        setIsSecModalOpen(false);
        setSecPasswordInput('');
        if (targetTabAfterUnlock === 'pos') {
          setActiveTab('pos');
        } else if (targetTabAfterUnlock === 'billing') {
          router.push('/admin/billing');
        }
      } else {
        setSecPasswordError(data.message || 'Invalid Admin Password');
      }
    } catch (err: any) {
      setSecPasswordError(err.message || 'Verification failed');
    } finally {
      setSecSubmitting(false);
    }
  };

  // Products State
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [productFormError, setProductFormError] = useState('');
  const [productPage, setProductPage] = useState(1);
  const productsPerPage = 8;
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('All');
  const [productStockFilter, setProductStockFilter] = useState<'All' | 'inStock' | 'lowStock' | 'outOfStock'>('All');

  // Add/Edit Product Form State
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    image: '',
    mrp: '',
    price: '',
    quantity: '10',
    gst: '0',
    category: '',
    variants: [] as ProductVariant[],
  });
  const [imagePreview, setImagePreview] = useState('');

  // Categories State
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [newCatName, setNewCatName] = useState('');
  const [newCatImage, setNewCatImage] = useState('');
  const [newCatImagePreview, setNewCatImagePreview] = useState('');
  const [isSubmittingCat, setIsSubmittingCat] = useState(false);
  const [catError, setCatError] = useState('');
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatImage, setEditCatImage] = useState('');
  const [editCatImagePreview, setEditCatImagePreview] = useState('');
  const [isEditCatModalOpen, setIsEditCatModalOpen] = useState(false);

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [orderStatusFilter, setOrderStatusFilter] = useState('All');
  const [orderChannelFilter, setOrderChannelFilter] = useState<'All' | 'ONLINE' | 'POS'>('All');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderPage, setOrderPage] = useState(1);
  const ordersPerPage = 10;
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<Order | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [customerCount, setCustomerCount] = useState<number>(0);

  // Process Sales Return & Refund Modal State
  const [refundOrderTarget, setRefundOrderTarget] = useState<Order | null>(null);
  const [refundType, setRefundType] = useState<'FULL' | 'PARTIAL'>('FULL');
  const [customRefundAmount, setCustomRefundAmount] = useState<string>('');
  const [refundReason, setRefundReason] = useState<string>('Customer return / refund request');
  const [restockReturnedItems, setRestockReturnedItems] = useState<boolean>(true);
  const [refundNotes, setRefundNotes] = useState<string>('');
  const [isProcessingRefund, setIsProcessingRefund] = useState<boolean>(false);
  const [refundError, setRefundError] = useState<string>('');

  const handleOpenRefundModal = (order: Order) => {
    setRefundOrderTarget(order);
    setRefundType('FULL');
    setCustomRefundAmount(String(order.totalAmount || 0));
    setRefundReason('Customer return / refund request');
    setRestockReturnedItems(true);
    setRefundNotes('');
    setRefundError('');
  };

  const handleProcessRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundOrderTarget) return;

    setRefundError('');
    const orderTotal = Number(refundOrderTarget.totalAmount) || 0;
    const amountToRefund = refundType === 'FULL' ? orderTotal : Number(customRefundAmount);

    if (isNaN(amountToRefund) || amountToRefund <= 0) {
      setRefundError('Please enter a valid refund amount greater than $0.00');
      return;
    }
    if (amountToRefund > orderTotal) {
      setRefundError(`Refund amount cannot exceed order total ($${orderTotal.toFixed(2)})`);
      return;
    }

    try {
      setIsProcessingRefund(true);
      const res = await fetch(`/api/orders/${refundOrderTarget._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'refund',
          refundAmount: amountToRefund,
          refundReason: refundReason.trim() || 'Customer return / refund',
          refundNotes: refundNotes.trim(),
          restockItems: restockReturnedItems,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setRefundOrderTarget(null);
        await fetchOrders();
        if (selectedOrderForDetails && selectedOrderForDetails._id === refundOrderTarget._id) {
          setSelectedOrderForDetails(data.data);
        }
      } else {
        setRefundError(data.message || 'Failed to process refund');
      }
    } catch (err: any) {
      setRefundError(err.message || 'Network error processing refund');
    } finally {
      setIsProcessingRefund(false);
    }
  };

  // Helper to resolve product variants & images for orders (including historical fallback by price match)
  const enrichOrderWithVariants = (orderToEnrich: Order | null): Order | null => {
    if (!orderToEnrich) return null;
    return {
      ...orderToEnrich,
      items: orderToEnrich.items?.map((it) => {
        const matchedProduct = products.find(
          (p) => p._id === it.productId || p.name?.toLowerCase().trim() === it.name?.toLowerCase().trim()
        );
        const resolvedVariant =
          (it.variantName && it.variantName.trim().length > 0)
            ? it.variantName
            : matchedProduct?.variants?.find((v) => Number(v.price) === Number(it.price))?.name;
        return {
          ...it,
          variantName: resolvedVariant || it.variantName || '',
          image: it.image || matchedProduct?.image || '',
        };
      }),
    };
  };

  // Banners State
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [loadingBanners, setLoadingBanners] = useState(true);
  const [newBannerEyebrow, setNewBannerEyebrow] = useState('');
  const [newBannerTitle, setNewBannerTitle] = useState('');
  const [newBannerDesc, setNewBannerDesc] = useState('');
  const [newBannerCta, setNewBannerCta] = useState('');
  const [newBannerLink, setNewBannerLink] = useState('');
  const [newBannerImage, setNewBannerImage] = useState('');
  const [newBannerOrder, setNewBannerOrder] = useState<number | string>(1);
  const [bannerImagePreview, setBannerImagePreview] = useState('');
  const [isSubmittingBanner, setIsSubmittingBanner] = useState(false);
  const [bannerError, setBannerError] = useState('');

  // Edit Banner Modal State
  const [editingBanner, setEditingBanner] = useState<BannerItem | null>(null);
  const [editBannerEyebrow, setEditBannerEyebrow] = useState('');
  const [editBannerTitle, setEditBannerTitle] = useState('');
  const [editBannerDesc, setEditBannerDesc] = useState('');
  const [editBannerCta, setEditBannerCta] = useState('');
  const [editBannerLink, setEditBannerLink] = useState('');
  const [editBannerImage, setEditBannerImage] = useState('');
  const [editBannerImagePreview, setEditBannerImagePreview] = useState('');
  const [editBannerOrder, setEditBannerOrder] = useState<number | string>(1);
  const [isEditBannerModalOpen, setIsEditBannerModalOpen] = useState(false);

  // Settings State
  const [paymentSettings, setPaymentSettings] = useState({
    enableRazorpay: true,
    razorpayKeyId: '',
    razorpayKeySecret: '',
    enableCOD: true,
    siteName: 'Indian Flowers',
    businessName: 'Indian Flowers LLC',
    tagline: 'Indian Flowers for Every Occasion',
    domain: 'indian-flowers.com',
    contactEmail: 'support@indian-flowers.com',
    contactPhone: '+1 (510) 579-5199',
    companyAddress: '39120 Argonaut Way, Suite 428',
    companyCity: 'Fremont',
    companyState: 'CA',
    companyZip: '94538',
    companyCountry: 'United States',
    companyTaxId: '94-3829104',
    stateTaxPermitId: 'SR-KHE-102-984712',
    bankName: 'JPMorgan Chase Bank, N.A.',
    bankAccountNo: 'Checking •••• 4829',
    bankRoutingNo: '121000247',
    bankHolder: 'Indian Flowers LLC',
    logoDataUrl: '/indian-flowers-logo.svg',
    // Loyalty Points Program Settings
    loyaltyEnabled: true,
    loyaltySpendAmount: 100,
    loyaltyPointsEarned: 10,
    loyaltyRedemptionEnabled: true,
    loyaltyPointsPerDollar: 10,
    loyaltyMinPointsToRedeem: 10,
    loyaltyMaxRedemptionPercent: 100,
  });
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [isSubmittingSettings, setIsSubmittingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const [settingsError, setSettingsError] = useState('');

  // Custom Orders Inquiries State
  const [customOrders, setCustomOrders] = useState<CustomOrderInquiry[]>([]);
  const [loadingCustomOrders, setLoadingCustomOrders] = useState(true);
  const [customOrderStatusFilter, setCustomOrderStatusFilter] = useState('All');
  const [customOrderSearch, setCustomOrderSearch] = useState('');

  // Newsletter Subscribers State
  const [subscribers, setSubscribers] = useState<SubscriberItem[]>([]);
  const [loadingSubscribers, setLoadingSubscribers] = useState(true);
  const [subscriberSearch, setSubscriberSearch] = useState('');
  const [isDeletingSubscriber, setIsDeletingSubscriber] = useState<string | null>(null);

  // Fetch License & Subscription Status
  const fetchLicenseStatus = async () => {
    try {
      const res = await fetch(`/api/license/status?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.license) {
        setLicenseState(data.license);
      }
    } catch (err) {
      console.error('Failed to fetch license status', err);
    }
  };

  // Fetch Subscribers
  const fetchSubscribers = async (forceSpinner: boolean = false) => {
    try {
      if (forceSpinner || subscribers.length === 0) {
        setLoadingSubscribers(true);
      }
      const res = await fetch(`/api/newsletter/subscribe?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setSubscribers(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch subscribers:', err);
    } finally {
      setLoadingSubscribers(false);
    }
  };

  // Delete Subscriber
  const handleDeleteSubscriber = async (id: string, email: string) => {
    if (!confirm(`Are you sure you want to remove "${email}" from the newsletter list?`)) return;
    try {
      setIsDeletingSubscriber(id);
      const res = await fetch(`/api/newsletter/subscribe?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setSubscribers((prev) => prev.filter((s) => s._id !== id));
      } else {
        alert(data.message || 'Failed to remove subscriber.');
      }
    } catch (err) {
      console.error('Error deleting subscriber:', err);
      alert('Network error while deleting subscriber.');
    } finally {
      setIsDeletingSubscriber(null);
    }
  };

  // Export Subscribers to CSV
  const handleExportSubscribersCSV = () => {
    if (subscribers.length === 0) {
      alert('No subscribers to export.');
      return;
    }
    const headers = ['Email', 'Status', 'Source', 'Subscribed At'];
    const rows = subscribers.map((s) => [
      `"${s.email.replace(/"/g, '""')}"`,
      `"${s.status}"`,
      `"${(s.source || 'storefront_footer').replace(/"/g, '""')}"`,
      `"${new Date(s.createdAt).toLocaleString()}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `indian_flowers_subscribers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Fetch All Dashboard Data
  const fetchAllData = async () => {
    try {
      setIsRefreshing(true);
      await Promise.all([
        fetchProducts(),
        fetchCategories(),
        fetchOrders(),
        fetchBanners(),
        fetchSettings(),
        fetchCustomOrders(),
        fetchSubscribers(),
        fetchLicenseStatus(),
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Fetch Products
  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const res = await fetch(`/api/products?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Fetch Categories
  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.success) {
        setCategories(data.data);
        if (data.data.length > 0 && !productForm.category) {
          setProductForm((prev) => ({ ...prev, category: data.data[0].name }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Fetch Orders
  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Fetch Banners
  const fetchBanners = async () => {
    try {
      setLoadingBanners(true);
      const res = await fetch('/api/banners');
      const data = await res.json();
      if (data.success) {
        setBanners(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBanners(false);
    }
  };

  // Fetch Settings
  const fetchSettings = async () => {
    try {
      setLoadingSettings(true);
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.success && data.data) {
        setPaymentSettings({
          enableRazorpay: data.data.enableRazorpay ?? true,
          razorpayKeyId: data.data.razorpayKeyId ?? '',
          razorpayKeySecret: data.data.razorpayKeySecret ?? '',
          enableCOD: data.data.enableCOD ?? true,
          siteName: data.data.siteName || 'Indian Flowers',
          businessName: data.data.businessName || 'Indian Flowers LLC',
          tagline: data.data.tagline || 'Indian Flowers for Every Occasion',
          domain: data.data.domain || 'indian-flowers.com',
          contactEmail: data.data.contactEmail || 'support@indian-flowers.com',
          contactPhone: data.data.contactPhone || '+1 (510) 579-5199',
          companyAddress: data.data.companyAddress || '39120 Argonaut Way, Suite 428',
          companyCity: data.data.companyCity || 'Fremont',
          companyState: data.data.companyState || 'CA',
          companyZip: data.data.companyZip || '94538',
          companyCountry: data.data.companyCountry || 'United States',
          companyTaxId: data.data.companyTaxId || '94-3829104',
          stateTaxPermitId: data.data.stateTaxPermitId || 'SR-KHE-102-984712',
          bankName: data.data.bankName || 'JPMorgan Chase Bank, N.A.',
          bankAccountNo: data.data.bankAccountNo || 'Checking •••• 4829',
          bankRoutingNo: data.data.bankRoutingNo || '121000247',
          bankHolder: data.data.bankHolder || 'Indian Flowers LLC',
          logoDataUrl: data.data.logoDataUrl || '/indian-flowers-logo.svg',
          loyaltyEnabled: data.data.loyaltyEnabled !== false,
          loyaltySpendAmount: data.data.loyaltySpendAmount ?? 100,
          loyaltyPointsEarned: data.data.loyaltyPointsEarned ?? 10,
          loyaltyRedemptionEnabled: data.data.loyaltyRedemptionEnabled !== false,
          loyaltyPointsPerDollar: data.data.loyaltyPointsPerDollar ?? 10,
          loyaltyMinPointsToRedeem: data.data.loyaltyMinPointsToRedeem ?? 10,
          loyaltyMaxRedemptionPercent: data.data.loyaltyMaxRedemptionPercent ?? 100,
        });
      }
    } catch (err) {
      console.error('Failed to fetch settings', err);
    } finally {
      setLoadingSettings(false);
    }
  };

  // Save Payment Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSuccess('');
    setSettingsError('');
    try {
      setIsSubmittingSettings(true);
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentSettings),
      });
      const data = await res.json();
      if (data.success) {
        setSettingsSuccess('Store settings saved successfully!');
        setTimeout(() => setSettingsSuccess(''), 3500);
      } else {
        setSettingsError(data.message || 'Failed to update payment settings');
      }
    } catch (err: any) {
      setSettingsError(err.message || 'Server error updating payment settings');
    } finally {
      setIsSubmittingSettings(false);
    }
  };

  // Fetch Custom Order Inquiries
  const fetchCustomOrders = async (forceSpinner: boolean = false) => {
    try {
      if (forceSpinner || customOrders.length === 0) {
        setLoadingCustomOrders(true);
      }
      const res = await fetch(`/api/custom-orders?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setCustomOrders(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch custom orders:', err);
    } finally {
      setLoadingCustomOrders(false);
    }
  };

  // Update Custom Order Inquiry Status
  const handleUpdateCustomOrderStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/custom-orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setCustomOrders((prev) =>
          prev.map((item) => (item._id === id ? { ...item, status: newStatus as any } : item))
        );
      }
    } catch (err) {
      console.error('Failed to update custom order status:', err);
    }
  };

  // Delete Custom Order Inquiry
  const handleDeleteCustomOrder = async (id: string) => {
    if (!confirm('Are you sure you want to delete this custom order inquiry?')) return;
    try {
      const res = await fetch(`/api/custom-orders/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setCustomOrders((prev) => prev.filter((item) => item._id !== id));
      }
    } catch (err) {
      console.error('Failed to delete custom order inquiry:', err);
    }
  };

// Reusable Client-Side Canvas Image Compressor (Reduces base64 size by ~95%)
const compressImage = (file: File, maxWidth = 800, quality = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const elem = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        elem.width = width;
        elem.height = height;
        const ctx = elem.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(elem.toDataURL('image/jpeg', quality));
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

  // Handle Banner Image File Selection with Auto Compression
  const handleBannerImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file, 1600, 0.85);
        setNewBannerImage(compressedBase64);
        setBannerImagePreview(compressedBase64);
      } catch (err) {
        console.error('Banner image compression failed', err);
      }
    }
  };

  const handleEditBannerImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file, 1600, 0.85);
        setEditBannerImage(compressedBase64);
        setEditBannerImagePreview(compressedBase64);
      } catch (err) {
        console.error('Edit banner image compression failed', err);
      }
    }
  };

  const handleOpenEditBanner = (b: BannerItem) => {
    setEditingBanner(b);
    setEditBannerEyebrow(b.eyebrow || '');
    setEditBannerTitle(b.title || '');
    setEditBannerDesc(b.description || '');
    setEditBannerCta(b.ctaText || 'Shop Now');
    setEditBannerLink(b.link || '');
    setEditBannerImage(b.image || '');
    setEditBannerImagePreview(b.image || '');
    setEditBannerOrder(b.order ?? 1);
    setIsEditBannerModalOpen(true);
  };

  // Add New Hero Banner
  const handleAddBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    setBannerError('');
    if (!newBannerTitle.trim() || !newBannerImage) {
      setBannerError('Please enter a banner title and provide an image.');
      return;
    }

    try {
      setIsSubmittingBanner(true);
      const res = await fetch('/api/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newBannerTitle.trim(),
          eyebrow: newBannerEyebrow.trim(),
          description: newBannerDesc.trim(),
          ctaText: newBannerCta.trim() || 'Shop Now',
          image: newBannerImage,
          link: newBannerLink.trim(),
          order: Number(newBannerOrder) || (banners.length + 1),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNewBannerTitle('');
        setNewBannerEyebrow('');
        setNewBannerDesc('');
        setNewBannerCta('');
        setNewBannerImage('');
        setNewBannerLink('');
        setNewBannerOrder(banners.length + 2);
        setBannerImagePreview('');
        fetchBanners();
      } else {
        setBannerError(data.message || 'Failed to add banner');
      }
    } catch (err: any) {
      setBannerError('Network error while adding banner');
    } finally {
      setIsSubmittingBanner(false);
    }
  };

  // Save Edited Hero Banner
  const handleSaveEditedBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner || !editBannerTitle.trim() || !editBannerImage) {
      alert('Banner title and image are required.');
      return;
    }

    try {
      setIsSubmittingBanner(true);
      const res = await fetch(`/api/banners/${editingBanner._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editBannerTitle.trim(),
          eyebrow: editBannerEyebrow.trim(),
          description: editBannerDesc.trim(),
          ctaText: editBannerCta.trim() || 'Shop Now',
          link: editBannerLink.trim(),
          image: editBannerImage,
          order: Number(editBannerOrder) || 1,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsEditBannerModalOpen(false);
        setEditingBanner(null);
        fetchBanners();
      } else {
        alert(data.message || 'Failed to update banner');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while updating banner');
    } finally {
      setIsSubmittingBanner(false);
    }
  };

  // Delete Hero Banner
  const handleDeleteBanner = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    try {
      const res = await fetch(`/api/banners/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchBanners();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 1-Click Database Heavy Images Optimizer
  const [isOptimizingDb, setIsOptimizingDb] = useState(false);
  const [optimizeStatus, setOptimizeStatus] = useState('');

  const compressBase64Url = (base64Url: string, maxWidth = 800, quality = 0.8): Promise<string> => {
    return new Promise((resolve) => {
      if (!base64Url || base64Url.length < 150000) {
        resolve(base64Url);
        return;
      }
      const img = new window.Image();
      img.src = base64Url;
      img.onload = () => {
        const elem = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        elem.width = width;
        elem.height = height;
        const ctx = elem.getContext('2d');
        if (!ctx) {
          resolve(base64Url);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(elem.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(base64Url);
    });
  };

  const handleOptimizeExistingDatabaseImages = async () => {
    try {
      setIsOptimizingDb(true);
      setOptimizeStatus('Scanning existing products & banners in database...');

      let optimizedCount = 0;

      // 1. Compress heavy existing products
      for (const p of products) {
        if (p.image && p.image.length > 150000) {
          setOptimizeStatus(`Compressing heavy image for product: ${p.name}...`);
          const compressed = await compressBase64Url(p.image, 800, 0.8);
          if (compressed.length < p.image.length) {
            await fetch(`/api/products/${p._id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...p, image: compressed }),
            });
            optimizedCount++;
          }
        }
      }

      // 2. Compress heavy existing banners
      for (const b of banners) {
        if (b.image && b.image.length > 150000) {
          setOptimizeStatus(`Compressing heavy hero banner: ${b.title}...`);
          const compressed = await compressBase64Url(b.image, 1200, 0.85);
          if (compressed.length < b.image.length) {
            await fetch(`/api/banners/${b._id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...b, image: compressed }),
            });
            optimizedCount++;
          }
        }
      }

      await fetchAllData();
      alert(`Success! Optimized ${optimizedCount} heavy image(s) in database down to ~40KB each.`);
    } catch (err: any) {
      alert('Error during image optimization: ' + (err.message || err));
    } finally {
      setIsOptimizingDb(false);
      setOptimizeStatus('');
    }
  };

  const fetchCustomerCount = async () => {
    try {
      const res = await fetch(`/api/admin/customers?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.stats) {
        setCustomerCount(data.stats.totalCustomers || 0);
      }
    } catch (err) {
      console.error('Failed to fetch customer count:', err);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        if (data.authenticated) {
          setIsAuthenticated(true);
          fetchProducts();
          fetchCategories();
          fetchOrders();
          fetchBanners();
          fetchSettings();
          fetchLicenseStatus();
          fetchCustomOrders(true);
          fetchSubscribers(true);
          fetchCustomerCount();
        } else {
          router.replace('/admin/login');
        }
      } catch (err) {
        router.replace('/admin/login');
      } finally {
        setIsAuthChecking(false);
      }
    };

    checkSession();
  }, [router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (activeTab === 'settings') {
      fetchSettings();
    } else if (activeTab === 'subscribers') {
      fetchSubscribers(false);
    } else if (activeTab === 'customOrders') {
      fetchCustomOrders(false);
    } else if (activeTab === 'orders') {
      fetchOrders();
    } else if (activeTab === 'products') {
      fetchProducts();
    }
  }, [activeTab, isAuthenticated]);

  // Handle Product Image Upload & Canvas Compression
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file, 800, 0.8);
        setProductForm((prev) => ({ ...prev, image: compressedBase64 }));
        setImagePreview(compressedBase64);
      } catch (err) {
        console.error('Product image compression failed', err);
      }
    }
  };

  // Handle Variant Row Actions
  const handleAddVariantRow = () => {
    setProductForm((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        { name: '', mrp: prev.mrp || '', price: prev.price || '', quantity: '10' },
      ],
    }));
  };

  const handleRemoveVariantRow = (index: number) => {
    setProductForm((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, idx) => idx !== index),
    }));
  };

  const handleUpdateVariantRow = (index: number, field: keyof ProductVariant, value: string) => {
    setProductForm((prev) => {
      const updated = [...prev.variants];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, variants: updated };
    });
  };

  // Open Edit Product Modal
  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      image: product.image,
      mrp: String(product.mrp),
      price: String(product.price),
      quantity: String(product.quantity),
      gst: String(product.gst !== undefined ? product.gst : 0),
      category: product.category || (categories[0]?.name ?? ''),
      variants: product.variants ? product.variants.map((v) => ({ ...v })) : [],
    });
    setImagePreview(product.image);
    setProductFormError('');
    setIsAddModalOpen(true);
  };

  // Open Add Product Modal
  const openAddProductModal = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      description: '',
      image: '',
      mrp: '',
      price: '',
      quantity: '10',
      gst: '0',
      category: categories.length > 0 ? categories[0].name : '',
      variants: [],
    });
    setImagePreview('');
    setProductFormError('');
    setIsAddModalOpen(true);
  };

  // Submit Add / Edit Product Form
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setProductFormError('');

    if (
      !productForm.name ||
      !productForm.description ||
      !productForm.image ||
      !productForm.mrp ||
      !productForm.price ||
      !productForm.category
    ) {
      setProductFormError('Please fill in all required fields, select a category, and upload an image.');
      return;
    }

    try {
      setIsSubmittingProduct(true);
      const isEdit = !!editingProduct;
      const url = isEdit ? `/api/products/${editingProduct._id}` : '/api/products';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: productForm.name,
          description: productForm.description,
          image: productForm.image,
          mrp: Number(productForm.mrp),
          price: Number(productForm.price),
          quantity: Number(productForm.quantity),
          gst: Number(productForm.gst),
          category: productForm.category,
          variants: productForm.variants.map((v) => ({
            name: v.name.trim(),
            mrp: Number(v.mrp),
            price: Number(v.price),
            quantity: Number(v.quantity || 10),
          })),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsAddModalOpen(false);
        setEditingProduct(null);
        if (data.data) {
          if (isEdit) {
            setProducts((prev) => prev.map((p) => (p._id === data.data._id ? data.data : p)));
          } else {
            setProducts((prev) => [data.data, ...prev]);
          }
        }
        fetchProducts();
      } else {
        setProductFormError(data.message || 'Failed to save product.');
      }
    } catch (err: any) {
      setProductFormError(err.message || 'Network error.');
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      setProducts((prev) => prev.filter((p) => p._id !== id));
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchProducts();
      } else {
        fetchProducts();
      }
    } catch (err) {
      console.error(err);
      fetchProducts();
    }
  };

  // Category Image File Upload Handlers
  const handleNewCatImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file, 400, 0.85);
        setNewCatImage(compressedBase64);
        setNewCatImagePreview(compressedBase64);
      } catch (err) {
        console.error('Category image compression failed', err);
      }
    }
  };

  const handleEditCatImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file, 400, 0.85);
        setEditCatImage(compressedBase64);
        setEditCatImagePreview(compressedBase64);
      } catch (err) {
        console.error('Edit category image compression failed', err);
      }
    }
  };

  const handleOpenEditCategory = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setEditCatName(cat.name);
    setEditCatImage(cat.image || '');
    setEditCatImagePreview(cat.image || '');
    setIsEditCatModalOpen(true);
  };

  // Add Category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCatError('');
    if (!newCatName.trim()) return;

    try {
      setIsSubmittingCat(true);
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCatName.trim(),
          image: newCatImage.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewCatName('');
        setNewCatImage('');
        setNewCatImagePreview('');
        fetchCategories();
      } else {
        setCatError(data.message || 'Failed to add category');
      }
    } catch (err: any) {
      setCatError(err.message || 'Error adding category');
    } finally {
      setIsSubmittingCat(false);
    }
  };

  // Edit Category
  const handleSaveEditedCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editCatName.trim()) return;
    try {
      setIsSubmittingCat(true);
      const res = await fetch(`/api/categories/${editingCategory._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editCatName.trim(),
          image: editCatImage,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsEditCatModalOpen(false);
        setEditingCategory(null);
        setEditCatName('');
        setEditCatImage('');
        setEditCatImagePreview('');
        fetchCategories();
      } else {
        alert(data.message || 'Failed to update category');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating category');
    } finally {
      setIsSubmittingCat(false);
    }
  };

  // Delete Category
  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchCategories();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Update Order Status
  const handleUpdateOrderStatus = async (
    orderId: string,
    updates: {
      status?: any;
      paymentStatus?: any;
    }
  ) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success) {
        fetchOrders();
        setSelectedOrderForDetails((prev) => {
          if (!prev || prev._id !== orderId) return prev;
          return { ...prev, ...updates, ...(data.data || {}) } as Order;
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Logout
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  // Metrics (Strictly verified payments only; pending COD, failed, or cancelled orders are excluded)
  const onlineOrders = orders.filter((o) => o.orderType !== 'POS');
  const posOrders = orders.filter((o) => o.orderType === 'POS');
  const onlineRevenue = calculateVerifiedRevenue(onlineOrders);
  const posRevenue = calculateVerifiedRevenue(posOrders);
  const totalRevenue = calculateVerifiedRevenue(orders);
  const pendingOrdersCount = orders.filter((o) => o.status === 'Pending').length;

  // Filter & Pagination for Orders
  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter === 'Refunded') {
      if (o.status !== 'Refunded' && o.status !== 'Returned' && o.paymentStatus !== 'Refunded' && o.paymentStatus !== 'Partially_Refunded') return false;
    } else if (orderStatusFilter !== 'All' && o.status !== orderStatusFilter) {
      return false;
    }
    if (orderChannelFilter === 'ONLINE' && o.orderType === 'POS') return false;
    if (orderChannelFilter === 'POS' && o.orderType !== 'POS') return false;
    if (!orderSearch.trim()) return true;
    const q = orderSearch.toLowerCase().trim();
    return (
      o.orderId?.toLowerCase().includes(q) ||
      o.invoiceNumber?.toLowerCase().includes(q) ||
      o.customerName?.toLowerCase().includes(q) ||
      o.customerPhone?.toLowerCase().includes(q) ||
      o.customerEmail?.toLowerCase().includes(q) ||
      o.transactionId?.toLowerCase().includes(q) ||
      o.shippingAddress?.toLowerCase().includes(q) ||
      o.pincode?.toLowerCase().includes(q) ||
      o.city?.toLowerCase().includes(q) ||
      o.state?.toLowerCase().includes(q) ||
      o.items?.some((item) => item.name?.toLowerCase().includes(q))
    );
  });
  const totalOrderPages = Math.ceil(filteredOrders.length / ordersPerPage) || 1;
  const paginatedOrders = filteredOrders.slice(
    (orderPage - 1) * ordersPerPage,
    orderPage * ordersPerPage
  );

  // Filter & Pagination for Products
  const filteredProducts = products.filter((p) => {
    if (productCategoryFilter !== 'All' && p.category?.toLowerCase() !== productCategoryFilter.toLowerCase()) {
      return false;
    }
    if (productStockFilter === 'inStock' && p.quantity <= 0) return false;
    if (productStockFilter === 'lowStock' && (p.quantity <= 0 || p.quantity > 5)) return false;
    if (productStockFilter === 'outOfStock' && p.quantity > 0) return false;

    if (!productSearch.trim()) return true;
    const q = productSearch.toLowerCase().trim();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.price?.toString().includes(q) ||
      p.variants?.some((v) => v.name?.toLowerCase().includes(q))
    );
  });
  const totalProductPages = Math.ceil(filteredProducts.length / productsPerPage) || 1;
  const paginatedProducts = filteredProducts.slice(
    (productPage - 1) * productsPerPage,
    productPage * productsPerPage
  );

  // Custom Orders Filter & Metrics
  const filteredCustomOrders = customOrders.filter((inquiry) => {
    const matchesStatus =
      customOrderStatusFilter === 'All' ? true : inquiry.status === customOrderStatusFilter;
    if (!matchesStatus) return false;
    if (!customOrderSearch.trim()) return true;
    const q = customOrderSearch.toLowerCase();
    return (
      inquiry.inquiryId?.toLowerCase().includes(q) ||
      inquiry.customerName?.toLowerCase().includes(q) ||
      inquiry.customerEmail?.toLowerCase().includes(q) ||
      inquiry.customerPhone?.toLowerCase().includes(q) ||
      inquiry.cityState?.toLowerCase().includes(q) ||
      inquiry.occasion?.toLowerCase().includes(q) ||
      inquiry.requirements?.toLowerCase().includes(q)
    );
  });

  const newCustomOrdersCount = customOrders.filter((c) => c.status === 'NEW').length;
  if (isAuthChecking || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FFFCFB] flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FFF8F5] border border-[#ED3500]/20 flex items-center justify-center mx-auto text-[#ED3500]">
            <RefreshCw className="w-6 h-6 animate-spin" />
          </div>
          <p className="text-xs font-bold text-[#163B5C] uppercase tracking-wider">
            Verifying Admin Credentials...
          </p>
        </div>
      </div>
    );
  }

  if (!licenseState || !licenseState.isActivated || licenseState.isLocked) {
    return (
      <LicenseActivationModal
        license={licenseState}
        onActivated={() => fetchAllData()}
      />
    );
  }

  type NavItemId =
    | 'products'
    | 'categories'
    | 'orders'
    | 'customOrders'
    | 'customers'
    | 'banners'
    | 'subscribers'
    | 'policies'
    | 'settings'
    | 'pos'
    | 'subscription'
    | 'billing'
    | 'reports';

  interface NavItem {
    id: NavItemId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
    badge?: string;
    badgeColor?: string;
    locked?: boolean;
    isExternal?: boolean;
    href?: string;
    action: (e?: React.MouseEvent) => void;
  }

  interface NavGroup {
    title: string;
    items: NavItem[];
  }

  const navGroups: NavGroup[] = [
    {
      title: 'Store & Inventory',
      items: [
        {
          id: 'products',
          label: 'Products',
          icon: Package,
          count: products.length,
          action: () => setActiveTab('products'),
        },
        {
          id: 'categories',
          label: 'Categories',
          icon: Layers,
          count: categories.length,
          action: () => setActiveTab('categories'),
        },
        {
          id: 'orders',
          label: 'Orders',
          icon: ShoppingBag,
          count: orders.length,
          action: () => setActiveTab('orders'),
        },
        {
          id: 'customOrders',
          label: 'Custom Orders',
          icon: Flower2,
          count: customOrders.length,
          badge: newCustomOrdersCount > 0 ? `${newCustomOrdersCount} new` : undefined,
          badgeColor: 'bg-[#C85A78] text-white',
          action: () => setActiveTab('customOrders'),
        },
        {
          id: 'customers',
          label: 'Customer Accounts',
          icon: Users,
          count: customerCount > 0 ? customerCount : undefined,
          action: () => setActiveTab('customers'),
        },
      ],
    },
    {
      title: 'Storefront & Media',
      items: [
        {
          id: 'banners',
          label: 'Hero Banners',
          icon: ImageIcon,
          count: banners.length,
          action: () => setActiveTab('banners'),
        },
        {
          id: 'subscribers',
          label: 'Subscribers',
          icon: Mail,
          count: subscribers.length,
          action: () => setActiveTab('subscribers'),
        },
        {
          id: 'policies',
          label: 'Policies & Legal',
          icon: FileText,
          badge: 'US Laws',
          badgeColor: 'bg-emerald-100 text-emerald-800',
          action: () => setActiveTab('policies'),
        },
      ],
    },
    {
      title: 'Sales & POS Terminal',
      items: [
        {
          id: 'pos',
          label: 'POS Counter',
          icon: Store,
          locked: !isPosUnlocked,
          action: () => {
            if (isPosUnlocked) {
              setActiveTab('pos');
            } else {
              setTargetTabAfterUnlock('pos');
              setIsSecModalOpen(true);
            }
          },
        },
        {
          id: 'billing',
          label: 'Billing & Accounting ↗',
          icon: DollarSign,
          locked: !isPosUnlocked,
          isExternal: true,
          href: '/admin/billing',
          action: (e?: React.MouseEvent) => {
            if (!isPosUnlocked) {
              e?.preventDefault();
              setTargetTabAfterUnlock('billing');
              setIsSecModalOpen(true);
            }
          },
        },
        {
          id: 'reports',
          label: 'Reports & Exports',
          icon: FileSpreadsheet,
          badge: 'Excel',
          badgeColor: 'bg-emerald-600 text-white',
          action: () => setActiveTab('reports'),
        },
      ],
    },
    {
      title: 'System & License',
      items: [
        {
          id: 'settings',
          label: 'Store Settings',
          icon: Settings,
          action: () => setActiveTab('settings'),
        },
        {
          id: 'subscription',
          label: 'Plan & Subscription',
          icon: ShieldCheck,
          badge:
            licenseState?.daysRemaining !== undefined && licenseState.daysRemaining <= 7
              ? licenseState.daysRemaining <= 0
                ? 'Expired'
                : `${licenseState.daysRemaining}d`
              : undefined,
          badgeColor: 'bg-amber-500 text-white',
          action: () => setActiveTab('subscription'),
        },
      ],
    },
  ];

  const currentTabMeta: Record<
    string,
    { label: string; desc: string; icon: React.ComponentType<{ className?: string }> }
  > = {
    products: {
      label: 'Product Inventory',
      desc: `Manage, edit, and organize all ${products.length} store products`,
      icon: Package,
    },
    categories: {
      label: 'Category Management',
      desc: `Organize store categories and navigation hierarchy (${categories.length})`,
      icon: Layers,
    },
    orders: {
      label: 'Customer Orders',
      desc: `Track, fulfill, and manage ${orders.length} customer orders`,
      icon: ShoppingBag,
    },
    customOrders: {
      label: 'Custom Muhurtham & Event Inquiries',
      desc: `Manage bespoke garland inquiries and custom wedding orders (${customOrders.length})`,
      icon: Flower2,
    },
    customers: {
      label: 'Customer Accounts & Users',
      desc: `Registered customer profiles and lifetime purchase histories (${customerCount})`,
      icon: Users,
    },
    banners: {
      label: 'Hero Banners & Promotions',
      desc: `Manage homepage hero slider banners and promotional campaigns (${banners.length})`,
      icon: ImageIcon,
    },
    subscribers: {
      label: 'Newsletter Subscribers',
      desc: `Customer marketing email list and subscriber growth (${subscribers.length})`,
      icon: Mail,
    },
    policies: {
      label: 'Store Policies & Legal Compliance',
      desc: 'US e-commerce legal policies, return terms, and consumer disclosures',
      icon: FileText,
    },
    settings: {
      label: 'Store & Checkout Settings',
      desc: 'Sales tax nexus, payment gateways, store address, and currency configuration',
      icon: Settings,
    },
    pos: {
      label: 'Retail POS Counter',
      desc: 'In-person walk-in order terminal and instant receipt printer',
      icon: Store,
    },
    subscription: {
      label: 'Plan & License Subscription',
      desc: 'Software license management, active features, and subscription validity',
      icon: ShieldCheck,
    },
    reports: {
      label: 'Reports & Exports',
      desc: 'Export detailed financial and customer Excel spreadsheets',
      icon: FileSpreadsheet,
    },
  };

  const activeMeta = currentTabMeta[activeTab] || currentTabMeta.products;
  const ActiveHeaderIcon = activeMeta.icon;

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#F8FAFC] text-[#163B5C] flex flex-row">
      {/* 1. MOBILE SLIDE-OVER DRAWER MENU */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <aside className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-2xl flex flex-col z-50 animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="h-16 px-4 border-b border-[#E2E8F0] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <img
                  src="/nexus-mark.svg"
                  alt="Nexus Ecom CMS logo"
                  className="w-9 h-9 object-contain rounded-xl border border-[#E8EDF2]"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div>
                  <h2 className="font-extrabold text-sm text-[#163B5C]">Nexus Ecom</h2>
                  <span className="text-[11px] text-[#64748B]">Admin Portal</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                aria-label="Close Navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Navigation Body */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full [scrollbar-width:thin] [scrollbar-color:#E2E8F0_transparent]">
              {navGroups.map((group) => (
                <div key={group.title} className="space-y-1">
                  <h4 className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {group.title}
                  </h4>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const ItemIcon = item.icon;
                      const isActive = activeTab === item.id;

                      if (item.isExternal && item.href) {
                        return (
                          <Link
                            key={item.id}
                            href={item.href}
                            onClick={(e) => {
                              item.action(e);
                              setIsMobileMenuOpen(false);
                            }}
                            className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                              isActive
                                ? 'bg-[#FFF8F5] text-[#ED3500] font-extrabold border-l-4 border-[#ED3500]'
                                : 'text-slate-600 hover:text-[#163B5C] hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <ItemIcon
                                className={`w-4 h-4 shrink-0 ${
                                  isActive ? 'text-[#ED3500]' : 'text-slate-400'
                                }`}
                              />
                              <span>{item.label}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {item.locked && <Lock className="w-3 h-3 text-amber-500" />}
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </div>
                          </Link>
                        );
                      }

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            item.action();
                            setIsMobileMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                            isActive
                              ? 'bg-[#FFF8F5] text-[#ED3500] font-extrabold border-l-4 border-[#ED3500]'
                              : 'text-slate-600 hover:text-[#163B5C] hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <ItemIcon
                              className={`w-4 h-4 shrink-0 ${
                                isActive ? 'text-[#ED3500]' : 'text-slate-400'
                              }`}
                            />
                            <span>{item.label}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {item.locked && <Lock className="w-3 h-3 text-amber-500" />}
                            {item.badge ? (
                              <span
                                className={`px-1.5 py-0.5 text-[10px] font-black rounded-full leading-none ${
                                  item.badgeColor || 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {item.badge}
                              </span>
                            ) : item.count !== undefined ? (
                              <span
                                className={`px-1.5 py-0.5 text-[10.5px] font-bold rounded-md leading-none ${
                                  isActive
                                    ? 'bg-[#ED3500]/10 text-[#ED3500]'
                                    : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                {item.count}
                              </span>
                            ) : null}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-3 border-t border-[#E2E8F0] space-y-2 bg-slate-50">
              <Link
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs font-bold text-[#163B5C]"
              >
                <span>View Storefront</span>
                <span>↗</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout Session</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* 2. DESKTOP VERTICAL LEFT SIDEBAR */}
      <aside
        className={`hidden lg:flex flex-col bg-white border-r border-[#E2E8F0] h-full z-30 transition-all duration-300 ease-in-out shrink-0 select-none ${
          isSidebarCollapsed ? 'w-20' : 'w-64 xl:w-72'
        }`}
      >
        {/* Sidebar Header Brand */}
        <div className="h-16 sm:h-20 px-4 border-b border-[#E2E8F0] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/nexus-mark.svg"
              alt="Nexus Ecom CMS admin logo"
              className="w-10 h-10 object-contain rounded-xl shadow-xs border border-[#E8EDF2] shrink-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            {!isSidebarCollapsed && (
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="font-extrabold text-sm text-[#163B5C] truncate">
                    Nexus Ecom
                  </h2>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-[#ED3500]/10 text-[#ED3500] px-1.5 py-0.2 rounded">
                    Admin
                  </span>
                </div>
                <span className="text-[11px] text-[#64748B] block truncate">
                  The Indian Flowers
                </span>
              </div>
            )}
          </div>

          {/* Desktop Collapse / Expand Toggle */}
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1.5 rounded-lg border border-transparent hover:border-slate-200 text-slate-400 hover:text-[#163B5C] hover:bg-slate-50 transition-all shrink-0"
            title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            aria-label={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Sidebar Navigation Items (Smooth Scrollable) */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300 [scrollbar-width:thin] [scrollbar-color:#E2E8F0_transparent]">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              {!isSidebarCollapsed ? (
                <h4 className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {group.title}
                </h4>
              ) : (
                <div className="h-px bg-slate-100 my-2 mx-2" />
              )}

              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const ItemIcon = item.icon;
                  const isActive = activeTab === item.id;

                  if (item.isExternal && item.href) {
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={(e) => {
                          item.action(e);
                        }}
                        title={item.label}
                        className={`group flex items-center ${
                          isSidebarCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2.5'
                        } rounded-xl text-xs font-bold transition-all ${
                          isActive
                            ? 'bg-[#FFF8F5] text-[#ED3500] font-extrabold border-l-4 border-[#ED3500] shadow-2xs'
                            : 'text-slate-600 hover:text-[#163B5C] hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <ItemIcon
                            className={`w-4 h-4 shrink-0 transition-colors ${
                              isActive ? 'text-[#ED3500]' : 'text-slate-400 group-hover:text-slate-600'
                            }`}
                          />
                          {!isSidebarCollapsed && (
                            <span className="truncate">{item.label}</span>
                          )}
                        </div>
                        {!isSidebarCollapsed && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            {item.locked && <Lock className="w-3 h-3 text-amber-500" />}
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </div>
                        )}
                      </Link>
                    );
                  }

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => item.action()}
                      title={item.label}
                      className={`w-full group flex items-center ${
                        isSidebarCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2.5'
                      } rounded-xl text-xs font-bold transition-all text-left ${
                        isActive
                          ? 'bg-[#FFF8F5] text-[#ED3500] font-extrabold border-l-4 border-[#ED3500] shadow-2xs'
                          : 'text-slate-600 hover:text-[#163B5C] hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <ItemIcon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive ? 'text-[#ED3500]' : 'text-slate-400 group-hover:text-slate-600'
                          }`}
                        />
                        {!isSidebarCollapsed && (
                          <span className="truncate">{item.label}</span>
                        )}
                      </div>
                      {!isSidebarCollapsed && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.locked && <Lock className="w-3 h-3 text-amber-500" />}
                          {item.badge ? (
                            <span
                              className={`px-1.5 py-0.5 text-[10px] font-black rounded-full leading-none ${
                                item.badgeColor || 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {item.badge}
                            </span>
                          ) : item.count !== undefined ? (
                            <span
                              className={`px-1.5 py-0.5 text-[10.5px] font-bold rounded-md leading-none ${
                                isActive
                                  ? 'bg-[#ED3500]/10 text-[#ED3500]'
                                  : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                              }`}
                            >
                              {item.count}
                            </span>
                          ) : null}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-[#E2E8F0] space-y-1.5 bg-slate-50/60 shrink-0">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            title="View Storefront"
            className={`w-full flex items-center ${
              isSidebarCollapsed ? 'justify-center p-2' : 'justify-between px-3 py-2'
            } rounded-xl text-xs font-semibold text-slate-600 hover:text-[#ED3500] hover:bg-white border border-transparent hover:border-slate-200 transition-all`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Store className="w-4 h-4 text-slate-400 shrink-0" />
              {!isSidebarCollapsed && <span className="truncate">View Storefront</span>}
            </div>
            {!isSidebarCollapsed && <span className="text-[10px] text-slate-400">↗</span>}
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            title="Logout Admin"
            className={`w-full flex items-center ${
              isSidebarCollapsed ? 'justify-center p-2' : 'gap-2 px-3 py-2'
            } rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isSidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* 3. MAIN DASHBOARD CONTENT WORKSPACE */}
      <div id="admin-main-scroll" className="flex-1 min-w-0 flex flex-col h-full overflow-y-auto bg-[#F8FAFC]">
        {/* Expiry & Grace Period Alert Banner */}
        <GracePeriodBanner
          license={licenseState}
          onOpenRenewal={() => setActiveTab('subscription')}
        />

        {/* Sticky Top Utility Header */}
        <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-20 shadow-2xs shrink-0">
          <div className="px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-3">
            {/* Left: Mobile Drawer Trigger & Active Tab Breadcrumb */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-xl border border-[#E2E8F0] text-[#163B5C] hover:bg-slate-50 shrink-0"
                aria-label="Open Navigation Menu"
              >
                <Menu className="w-5 h-5 text-[#163B5C]" />
              </button>

              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 text-[#163B5C]">
                  <ActiveHeaderIcon className="w-4 h-4 text-[#ED3500]" />
                </div>
                <div className="min-w-0">
                  <h1 className="font-extrabold text-sm sm:text-base lg:text-lg text-[#163B5C] truncate">
                    {activeMeta.label}
                  </h1>
                  <p className="text-[11px] sm:text-xs text-[#64748B] hidden sm:block truncate">
                    {activeMeta.desc}
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Quick Action Controls */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('subscription')}
                className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-xs ${
                  activeTab === 'subscription'
                    ? 'bg-amber-500 text-white border-amber-600'
                    : 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-900'
                }`}
                title="Manage Software License & Subscription Plan"
              >
                <ShieldCheck
                  className={`w-3.5 h-3.5 ${
                    activeTab === 'subscription' ? 'text-white' : 'text-amber-600'
                  }`}
                />
                <span className="hidden xl:inline">Plan &amp; Subscription</span>
                {licenseState?.daysRemaining !== undefined && licenseState.daysRemaining <= 7 && (
                  <span className="px-1.5 py-0.2 text-[10px] font-black bg-amber-600 text-white rounded-full">
                    {licenseState.daysRemaining <= 0 ? '!' : `${licenseState.daysRemaining}d`}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={handleOptimizeExistingDatabaseImages}
                disabled={isOptimizingDb}
                className="px-3 py-1.5 sm:py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
                title="Compress heavy existing images in database down to ~40KB"
              >
                <Zap
                  className={`w-3.5 h-3.5 text-emerald-600 ${
                    isOptimizingDb ? 'animate-bounce' : ''
                  }`}
                />
                <span className="hidden md:inline">
                  {isOptimizingDb ? 'Optimizing...' : 'Optimize DB Images'}
                </span>
              </button>

              <button
                type="button"
                onClick={fetchAllData}
                disabled={isRefreshing}
                className="px-3 py-1.5 sm:py-2 rounded-xl bg-white hover:bg-slate-50 border border-[#E2E8F0] text-[#163B5C] font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
                title="Refresh Dashboard Data"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-[#ED3500] ${
                    isRefreshing ? 'animate-spin' : ''
                  }`}
                />
                <span className="hidden md:inline">
                  {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
                </span>
              </button>

              <Link
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1 text-xs font-semibold text-[#64748B] hover:text-[#ED3500] px-2.5 py-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <span>View Store</span>
                <span className="text-[10px]">↗</span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl bg-[#FFF8F5] text-[#ED3500] hover:bg-[#ED3500] hover:text-white border border-[#ED3500]/20 font-bold text-xs transition-all shadow-xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Database Optimization Progress Banner */}
        {isOptimizingDb && (
          <div className="bg-emerald-600 text-white px-4 py-3 text-xs font-bold flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>{optimizeStatus || 'Compressing heavy database images...'}</span>
            </div>
            <span>Please wait...</span>
          </div>
        )}

        {/* Main Workspace Body */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full flex-1">
          {/* Metric Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-[#E8EDF2] shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#ED3500]/10 text-[#ED3500] flex items-center justify-center">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block">
                  Total Products
                </span>
                <span className="text-2xl font-black text-[#163B5C]">
                  {products.length}
                </span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#E8EDF2] shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block">
                  Total Categories
                </span>
                <span className="text-2xl font-black text-[#163B5C]">
                  {categories.length}
                </span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#E8EDF2] shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block">
                  Pending Orders
                </span>
                <span className="text-2xl font-black text-[#163B5C]">
                  {pendingOrdersCount}
                </span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#E8EDF2] shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block">
                  Total Revenue
                </span>
                <span className="text-2xl font-black text-[#ED3500]">
                  {formatCurrency(totalRevenue)}
                </span>
                <span className="text-[10px] font-semibold text-emerald-700 block">
                  Verified payments only
                </span>
              </div>
            </div>
          </div>

          {/* Mobile-Only Horizontal Quick Navigation Pills (Zero Native Scrollbars, Hidden on lg:) */}
          <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {navGroups.flatMap((g) => g.items).map((item) => {
              const ItemIcon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => item.action()}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#ED3500] text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-[#E2E8F0] hover:bg-slate-50'
                  }`}
                >
                  <ItemIcon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                  {item.count !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full leading-none ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

        {/* Products Management View */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-[#E8EDF2] shadow-sm">
              <div>
                <h3 className="text-base sm:text-lg font-black text-[#163B5C]">Product Inventory</h3>
                <p className="text-xs text-[#64748B]">Manage, edit, and organize all {products.length} store products</p>
              </div>
              <button
                onClick={openAddProductModal}
                className="px-4 py-2.5 rounded-xl bg-[#ED3500] hover:bg-[#D02E00] text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all active:scale-95 shrink-0 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" /> Add Product
              </button>
            </div>

            {/* Product Search & Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-[#E8EDF2] shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Real-time Search Input */}
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search products by title, description, category, price..."
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setProductPage(1);
                  }}
                  className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-[#E8EDF2] bg-[#F8FAFC]/50 text-xs sm:text-sm font-medium text-[#163B5C] placeholder:text-[#94A3B8] focus:bg-white focus:outline-none focus:border-[#ED3500] focus:ring-2 focus:ring-[#ED3500]/10 transition-all"
                />
                {productSearch && (
                  <button
                    onClick={() => {
                      setProductSearch('');
                      setProductPage(1);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-md hover:bg-slate-100"
                    title="Clear Search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Category & Stock Filter Controls */}
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <div className="flex items-center gap-1.5 shrink-0">
                  <Filter className="w-3.5 h-3.5 text-[#64748B]" />
                  <select
                    value={productCategoryFilter}
                    onChange={(e) => {
                      setProductCategoryFilter(e.target.value);
                      setProductPage(1);
                    }}
                    className="px-3 py-2 rounded-xl border border-[#E8EDF2] bg-white text-xs font-bold text-[#163B5C] focus:outline-none focus:border-[#ED3500]"
                  >
                    <option value="All">All Categories ({products.length})</option>
                    {Array.from(new Set(products.map((p) => p.category).filter(Boolean))).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat} ({products.filter((p) => p.category === cat).length})
                      </option>
                    ))}
                  </select>
                </div>

                <select
                  value={productStockFilter}
                  onChange={(e) => {
                    setProductStockFilter(e.target.value as any);
                    setProductPage(1);
                  }}
                  className="px-3 py-2 rounded-xl border border-[#E8EDF2] bg-white text-xs font-bold text-[#163B5C] focus:outline-none focus:border-[#ED3500] shrink-0"
                >
                  <option value="All">All Stock Levels</option>
                  <option value="inStock">In Stock (&gt;5)</option>
                  <option value="lowStock">Low Stock (1-5)</option>
                  <option value="outOfStock">Out of Stock (0)</option>
                </select>

                {(productSearch || productCategoryFilter !== 'All' || productStockFilter !== 'All') && (
                  <button
                    onClick={() => {
                      setProductSearch('');
                      setProductCategoryFilter('All');
                      setProductStockFilter('All');
                      setProductPage(1);
                    }}
                    className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 transition-all shrink-0"
                    title="Reset All Filters"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Reset</span>
                  </button>
                )}
              </div>
            </div>

            {loadingProducts ? (
              <div className="py-20 text-center">
                <RefreshCw className="w-8 h-8 text-[#ED3500] animate-spin mx-auto" />
              </div>
            ) : products.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-3xl border border-[#E8EDF2] p-8 space-y-4">
                <Package className="w-12 h-12 text-[#64748B] mx-auto opacity-40" />
                <h3 className="text-xl font-bold text-[#163B5C]">No products in inventory</h3>
                <p className="text-sm text-[#64748B]">Click below to add your first product.</p>
                <button
                  onClick={openAddProductModal}
                  className="px-5 py-2.5 rounded-full bg-[#ED3500] text-white font-bold text-xs uppercase tracking-wider"
                >
                  + Add Product Now
                </button>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-2xl border border-[#E8EDF2] p-8 space-y-3">
                <Search className="w-10 h-10 text-[#64748B] mx-auto opacity-30" />
                <h4 className="text-base font-bold text-[#163B5C]">No products found</h4>
                <p className="text-xs text-[#64748B]">
                  No products matched your search {productSearch ? `"${productSearch}"` : ''} or selected filter criteria.
                </p>
                <button
                  onClick={() => {
                    setProductSearch('');
                    setProductCategoryFilter('All');
                    setProductStockFilter('All');
                    setProductPage(1);
                  }}
                  className="px-4 py-2 bg-[#163B5C] text-white rounded-xl text-xs font-bold hover:bg-[#112F4A] transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-[#E8EDF2] overflow-hidden shadow-sm space-y-4 p-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#FFFCFB] border-b border-[#E8EDF2] text-xs font-bold text-[#64748B] uppercase tracking-wider">
                        <th className="py-4 px-6">Product</th>
                        <th className="py-4 px-6">Category</th>
                        <th className="py-4 px-6">MRP</th>
                        <th className="py-4 px-6">Selling Price</th>
                        <th className="py-4 px-6">Discount</th>
                        <th className="py-4 px-6">Tax Status</th>
                        <th className="py-4 px-6">Stock Quantity</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8EDF2] text-sm">
                      {paginatedProducts.map((p) => (
                        <tr key={p._id} className="hover:bg-[#FFFCFB]/80 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <img
                                src={p.image}
                                alt={p.name}
                                className="w-12 h-12 object-cover rounded-xl bg-[#FFF8F5] border border-[#E8EDF2]"
                              />
                              <div>
                                <h4 className="font-bold text-[#163B5C] line-clamp-1">{p.name}</h4>
                                <p className="text-xs text-[#64748B] line-clamp-1">{p.description}</p>
                                {p.variants && p.variants.length > 0 && (
                                  <span className="inline-block mt-1 px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-bold text-[10px] border border-purple-200">
                                    {p.variants.length} Variants ({p.variants.map((v) => v.name).join(', ')})
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-xs font-semibold text-[#64748B]">
                            {p.category}
                          </td>
                          <td className="py-4 px-6 font-semibold line-through text-[#64748B]">
                            {formatCurrency(p.mrp)}
                          </td>
                          <td className="py-4 px-6 font-black text-[#ED3500]">
                            {formatCurrency(p.price)}
                          </td>
                          <td className="py-4 px-6 font-bold text-emerald-600 text-xs">
                            {p.discount}% OFF
                          </td>
                          <td className="py-4 px-6 font-bold text-[#163B5C] text-xs">
                            {Number(p.gst) === 0 ? 'Exempt' : 'Taxable'}
                          </td>
                          <td className="py-4 px-6">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${
                                p.quantity > 5
                                  ? 'bg-[#10B981]/10 text-[#10B981]'
                                  : p.quantity > 0
                                  ? 'bg-amber-500/10 text-amber-600'
                                  : 'bg-rose-500/10 text-rose-600'
                              }`}
                            >
                              {p.quantity > 0 ? `${p.quantity} Units` : 'Out of Stock'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {/* Edit Product Button */}
                              <button
                                onClick={() => openEditProductModal(p)}
                                className="p-2 rounded-lg text-[#64748B] hover:text-[#163B5C] hover:bg-[#FFFCFB] border border-transparent hover:border-[#E8EDF2] transition-colors"
                                title="Edit Product"
                              >
                                <Edit className="w-4 h-4 text-purple-600" />
                              </button>
                              {/* Delete Product Button */}
                              <button
                                onClick={() => handleDeleteProduct(p._id)}
                                className="p-2 rounded-lg text-[#64748B] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Delete Product"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Products Pagination Controls */}
                {totalProductPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-[#E8EDF2] text-xs text-[#64748B]">
                    <span>
                      Page <strong className="text-[#163B5C]">{productPage}</strong> of{' '}
                      <strong className="text-[#163B5C]">{totalProductPages}</strong>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={productPage === 1}
                        onClick={() => setProductPage((p) => Math.max(p - 1, 1))}
                        className="px-3 py-1.5 rounded-lg border border-[#E8EDF2] bg-white font-bold disabled:opacity-40 hover:bg-[#FFFCFB] flex items-center gap-1"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" /> Prev
                      </button>
                      <button
                        disabled={productPage === totalProductPages}
                        onClick={() => setProductPage((p) => Math.min(p + 1, totalProductPages))}
                        className="px-3 py-1.5 rounded-lg border border-[#E8EDF2] bg-white font-bold disabled:opacity-40 hover:bg-[#FFFCFB] flex items-center gap-1"
                      >
                        Next <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Categories Management View */}
        {activeTab === 'categories' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Create Category Card */}
            <div className="bg-white rounded-2xl border border-[#E8EDF2] p-6 space-y-4 shadow-sm max-w-2xl">
              <div>
                <h3 className="text-lg font-bold text-[#163B5C] flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#ED3500]" />
                  <span>Create New Category</span>
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Category names and images are displayed in the circular category section on the front page.
                </p>
              </div>

              {catError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {catError}
                </div>
              )}

              <form onSubmit={handleAddCategory} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#163B5C] uppercase tracking-wider block">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Loose Flowers, Garland Strings, Sacred Leaves..."
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E8EDF2] text-sm focus:outline-none focus:border-[#ED3500]"
                  />
                </div>

                {/* Category Image Upload */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#163B5C] uppercase tracking-wider block">
                    Category Image (Front Page Circle Tile)
                  </label>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <label className="flex-1 w-full border-2 border-dashed border-[#E8EDF2] hover:border-[#ED3500] rounded-2xl p-4 text-center cursor-pointer bg-[#FFFCFB] transition-colors">
                      <Upload className="w-5 h-5 text-[#ED3500] mx-auto mb-1" />
                      <span className="text-xs font-bold text-[#163B5C] block">
                        {newCatImagePreview ? 'Change Category Image' : 'Upload Category Image'}
                      </span>
                      <span className="text-[10px] text-[#64748B]">Auto-optimized for circular display (PNG, JPG, WEBP)</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleNewCatImageChange}
                        className="hidden"
                      />
                    </label>

                    {newCatImagePreview && (
                      <div className="relative group shrink-0">
                        <div className="w-20 h-20 rounded-full border-2 border-[#ED3500] overflow-hidden bg-[#FFF8F5] shadow-xs">
                          <img
                            src={newCatImagePreview}
                            alt="Category Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setNewCatImage('');
                            setNewCatImagePreview('');
                          }}
                          className="absolute -top-1 -right-1 p-1 rounded-full bg-rose-600 text-white shadow-xs hover:bg-rose-700 transition-colors"
                          title="Remove image"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-1 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmittingCat || !newCatName.trim()}
                    className="px-6 py-2.5 rounded-xl bg-[#ED3500] hover:bg-[#D02E00] text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-[#ED3500]/20 flex items-center gap-2 disabled:opacity-50 transition-all"
                  >
                    {isSubmittingCat ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Add Category
                  </button>
                </div>
              </form>
            </div>

            {/* Category List with Image Preview & Edit Modal */}
            {loadingCategories ? (
              <div className="py-10 text-center">
                <RefreshCw className="w-6 h-6 text-[#ED3500] animate-spin mx-auto" />
              </div>
            ) : categories.length === 0 ? (
              <div className="py-12 text-center bg-white rounded-2xl border border-[#E8EDF2] p-6 space-y-2">
                <Layers className="w-10 h-10 text-[#64748B] mx-auto opacity-40" />
                <h4 className="font-bold text-[#163B5C]">No categories added yet</h4>
                <p className="text-xs text-[#64748B]">Add categories above to organize your products.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-[#E8EDF2] overflow-hidden shadow-sm max-w-3xl">
                <div className="p-4 bg-[#FFFCFB] border-b border-[#E8EDF2] font-bold text-xs text-[#64748B] uppercase tracking-wider grid grid-cols-12 gap-2">
                  <span className="col-span-2 sm:col-span-1">Icon</span>
                  <span className="col-span-6 sm:col-span-7">Category Name</span>
                  <span className="col-span-2 hidden sm:block">Display</span>
                  <span className="col-span-4 sm:col-span-2 text-right">Actions</span>
                </div>
                <div className="divide-y divide-[#E8EDF2]">
                  {categories.map((cat) => (
                    <div key={cat._id} className="p-3.5 sm:p-4 grid grid-cols-12 gap-2 items-center text-sm font-semibold text-[#163B5C] hover:bg-slate-50/50 transition-colors">
                      {/* Image Thumbnail */}
                      <div className="col-span-2 sm:col-span-1">
                        <div className="w-10 h-10 rounded-full border border-gray-200 overflow-hidden bg-emerald-50 flex items-center justify-center shrink-0 shadow-2xs">
                          {cat.image ? (
                            <img
                              src={cat.image}
                              alt={cat.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <Flower2 className="w-5 h-5 text-emerald-600" />
                          )}
                        </div>
                      </div>

                      {/* Category Name */}
                      <div className="col-span-6 sm:col-span-7 flex flex-col justify-center">
                        <span className="font-bold text-gray-900 text-xs sm:text-sm">{cat.name}</span>
                        <span className="text-[10px] text-gray-400 font-normal">
                          Added {new Date(cat.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Display Status */}
                      <div className="col-span-2 hidden sm:block">
                        {cat.image ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            Custom Image
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-600 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">
                            Default Icon
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="col-span-4 sm:col-span-2 flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditCategory(cat)}
                          className="p-2 rounded-xl text-purple-600 hover:bg-purple-50 transition-colors"
                          title="Edit Category Name & Image"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat._id)}
                          className="p-2 rounded-xl text-[#64748B] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Customer Orders Management View with High-Density Tabular UI & Search */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Top Orders Header & Filter Controls Bar */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E8EDF2] shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#163B5C]">Orders &amp; Shipments</h3>
                  <p className="text-xs text-[#64748B]">
                    Track, fulfill, and review online delivery and in-store POS sales
                  </p>
                </div>

                  <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setActiveTab('reports')}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Reports &amp; Excel Export</span>
                    </button>
                    <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setOrderChannelFilter('All');
                          setOrderPage(1);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          orderChannelFilter === 'All'
                            ? 'bg-white text-[#163B5C] shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        All Channels ({orders.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOrderChannelFilter('ONLINE');
                          setOrderPage(1);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          orderChannelFilter === 'ONLINE'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Online ({onlineOrders.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOrderChannelFilter('POS');
                          setOrderPage(1);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          orderChannelFilter === 'POS'
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        POS ({posOrders.length})
                      </button>
                    </div>
                  </div>
                </div>

              {/* Real-time Order Search & Status Filter Row */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-3 border-t border-[#E8EDF2]">
                {/* Search Input */}
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search by Order ID, customer name, phone, email, or item..."
                    value={orderSearch}
                    onChange={(e) => {
                      setOrderSearch(e.target.value);
                      setOrderPage(1);
                    }}
                    className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-[#E8EDF2] bg-[#F8FAFC]/50 text-xs sm:text-sm font-medium text-[#163B5C] placeholder:text-[#94A3B8] focus:bg-white focus:outline-none focus:border-[#ED3500] focus:ring-2 focus:ring-[#ED3500]/10 transition-all"
                  />
                  {orderSearch && (
                    <button
                      onClick={() => {
                        setOrderSearch('');
                        setOrderPage(1);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-md hover:bg-slate-100"
                      title="Clear Order Search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Status Pills with Dynamic Counts */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                  {[
                    { id: 'All', label: 'All', count: orders.length },
                    { id: 'Pending', label: 'Pending', count: orders.filter((o) => o.status === 'Pending').length },
                    { id: 'Processing', label: 'Processing', count: orders.filter((o) => o.status === 'Processing').length },
                    { id: 'Delivered', label: 'Delivered', count: orders.filter((o) => o.status === 'Delivered').length },
                    { id: 'Completed', label: 'Completed', count: orders.filter((o) => o.status === 'Completed').length },
                    { id: 'Cancelled', label: 'Cancelled', count: orders.filter((o) => o.status === 'Cancelled').length },
                    {
                      id: 'Refunded',
                      label: 'Refunded / Returns',
                      count: orders.filter(
                        (o) =>
                          o.status === 'Refunded' ||
                          o.status === 'Returned' ||
                          o.paymentStatus === 'Refunded' ||
                          o.paymentStatus === 'Partially_Refunded'
                      ).length,
                    },
                  ].map((st) => (
                    <button
                      key={st.id}
                      onClick={() => {
                        setOrderStatusFilter(st.id);
                        setOrderPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all flex items-center gap-1.5 ${
                        orderStatusFilter === st.id
                          ? 'bg-[#163B5C] text-white shadow-xs'
                          : 'bg-white border border-[#E8EDF2] text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{st.label}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                          orderStatusFilter === st.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {st.count}
                      </span>
                    </button>
                  ))}

                  {(orderSearch || orderStatusFilter !== 'All' || orderChannelFilter !== 'All') && (
                    <button
                      onClick={() => {
                        setOrderSearch('');
                        setOrderStatusFilter('All');
                        setOrderChannelFilter('All');
                        setOrderPage(1);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 transition-all shrink-0"
                      title="Reset Order Filters"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Reset</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {loadingOrders ? (
              <div className="py-20 text-center">
                <RefreshCw className="w-8 h-8 text-[#ED3500] animate-spin mx-auto" />
              </div>
            ) : orders.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-3xl border border-[#E8EDF2] p-8 space-y-4">
                <ShoppingBag className="w-12 h-12 text-[#64748B] mx-auto opacity-40" />
                <h3 className="text-xl font-bold text-[#163B5C]">No orders in system</h3>
                <p className="text-sm text-[#64748B]">
                  Customer orders will appear here automatically when placed online or rung up at POS.
                </p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-2xl border border-[#E8EDF2] p-8 space-y-3">
                <Search className="w-10 h-10 text-[#64748B] mx-auto opacity-30" />
                <h4 className="text-base font-bold text-[#163B5C]">No orders found</h4>
                <p className="text-xs text-[#64748B]">
                  No orders matched your search {orderSearch ? `"${orderSearch}"` : ''} or selected filter criteria.
                </p>
                <button
                  onClick={() => {
                    setOrderSearch('');
                    setOrderStatusFilter('All');
                    setOrderChannelFilter('All');
                    setOrderPage(1);
                  }}
                  className="px-4 py-2 bg-[#163B5C] text-white rounded-xl text-xs font-bold hover:bg-[#112F4A] transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-[#E8EDF2] overflow-hidden shadow-sm space-y-4 p-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[720px] lg:min-w-full">
                    <thead>
                      <tr className="bg-[#FFFCFB] border-b border-[#E8EDF2] text-xs font-bold text-[#64748B] uppercase tracking-wider">
                        <th className="py-3.5 px-4">Order ID &amp; Placed</th>
                        <th className="py-3.5 px-4">Customer</th>
                        <th className="py-3.5 px-4">Items Summary</th>
                        <th className="py-3.5 px-4">Total Amount</th>
                        <th className="py-3.5 px-4">Payment</th>
                        <th className="py-3.5 px-4">Order Status</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8EDF2] text-sm">
                      {paginatedOrders.map((order) => {
                        const paymentDisplay = getOrderPaymentDisplayInfo(order);
                        const itemCount =
                          order.items?.reduce((sum, it) => sum + (it.quantity || 1), 0) ||
                          order.items?.length ||
                          0;
                        const itemsSummary = order.items
                          ?.map((it) => {
                            const matchedProduct = products.find(
                              (p) => p._id === it.productId || p.name?.toLowerCase() === it.name?.toLowerCase()
                            );
                            const variant =
                              it.variantName ||
                              matchedProduct?.variants?.find((v) => Number(v.price) === Number(it.price))?.name;
                            return `${it.name}${variant ? ` (${variant})` : ''} (x${it.quantity})`;
                          })
                          .join(', ');

                        return (
                          <tr
                            key={order._id}
                            className="hover:bg-[#FFFCFB]/80 transition-colors group cursor-pointer"
                            onClick={() => setSelectedOrderForDetails(enrichOrderWithVariants(order))}
                          >
                            {/* Order ID & Channel & Date */}
                            <td className="py-3.5 px-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-extrabold text-sm text-[#163B5C] group-hover:text-[#ED3500] transition-colors">
                                    {order.orderId}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                                      order.orderType === 'POS'
                                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    }`}
                                  >
                                    {order.orderType === 'POS' ? 'POS' : 'Online'}
                                  </span>
                                </div>
                                <p className="text-[11px] text-[#64748B]">
                                  {new Date(order.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                              </div>
                            </td>

                            {/* Customer */}
                            <td className="py-3.5 px-4">
                              <div className="space-y-0.5">
                                <p className="font-bold text-[#163B5C] text-xs sm:text-sm line-clamp-1">
                                  {order.customerName || 'Walk-in Guest'}
                                </p>
                                <p className="text-[11px] text-[#64748B] flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="truncate">{order.customerPhone}</span>
                                </p>
                              </div>
                            </td>

                            {/* Items Summary */}
                            <td className="py-3.5 px-4 max-w-[240px]">
                              <div className="space-y-0.5">
                                <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                                  {itemCount} {itemCount === 1 ? 'item' : 'items'}
                                </span>
                                <p className="text-xs text-[#64748B] truncate" title={itemsSummary}>
                                  {itemsSummary || 'Standard Floral Package'}
                                </p>
                              </div>
                            </td>

                            {/* Total Amount (USD) */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="space-y-0.5">
                                <span className="text-sm font-black text-[#163B5C]">
                                  {formatCurrency(order.totalAmount)}
                                </span>
                                {paymentDisplay.isVerified && (
                                  <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                                    <Check className="w-3 h-3 text-emerald-600" /> Verified
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Payment Method & Status */}
                            <td
                              className="py-3.5 px-4 whitespace-nowrap"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="space-y-1">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${paymentDisplay.badgeClass}`}
                                >
                                  {order.paymentMethod === 'Razorpay' || order.paymentMethod === 'CreditCard' ? (
                                    <CreditCard className="w-3 h-3" />
                                  ) : (
                                    <DollarSign className="w-3 h-3" />
                                  )}
                                  <span>{paymentDisplay.badgeLabel}</span>
                                </span>
                                <p className="text-[10px] text-slate-500 font-medium">
                                  {order.paymentMethod}
                                </p>
                              </div>
                            </td>

                            {/* Order Status */}
                            <td
                              className="py-3.5 px-4 whitespace-nowrap"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {order.status === 'Completed' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-extrabold text-xs">
                                  <Check className="w-3.5 h-3.5" /> Completed
                                </span>
                              ) : order.status === 'Cancelled' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 font-extrabold text-xs">
                                  <X className="w-3.5 h-3.5" /> Cancelled
                                </span>
                              ) : order.status === 'Refunded' || order.status === 'Returned' || order.paymentStatus === 'Refunded' ? (
                                <span
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-extrabold text-xs"
                                  title={order.refundReason || 'Order Refunded'}
                                >
                                  <RotateCcw className="w-3.5 h-3.5" /> Refunded
                                </span>
                              ) : (
                                <select
                                  value={order.status}
                                  onChange={(e) =>
                                    handleUpdateOrderStatus(order._id, { status: e.target.value })
                                  }
                                  className="bg-[#FFFCFB] border border-[#E8EDF2] rounded-lg px-2.5 py-1 text-xs font-bold text-[#163B5C] focus:outline-none focus:border-[#ED3500]"
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="Processing">Processing</option>
                                  <option value="Delivered">Delivered</option>
                                  <option value="Completed">Completed</option>
                                  <option value="Cancelled">Cancelled</option>
                                  <option value="Refunded">Refunded</option>
                                  <option value="Returned">Returned</option>
                                </select>
                              )}
                            </td>

                            {/* Actions (View Details, Process Refund & Print Receipt) */}
                            <td
                              className="py-3.5 px-4 text-right whitespace-nowrap"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center justify-end gap-1.5">
                                {(order.paymentStatus === 'Paid' || order.status === 'Completed' || order.status === 'Delivered') &&
                                  order.status !== 'Refunded' &&
                                  order.status !== 'Returned' &&
                                  order.paymentStatus !== 'Refunded' && (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenRefundModal(enrichOrderWithVariants(order)!)}
                                      className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1 border border-rose-200 transition-colors shadow-2xs"
                                      title="Process Sales Return & Refund"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5" />
                                      <span className="hidden xl:inline">Refund</span>
                                    </button>
                                  )}
                                <button
                                  type="button"
                                  onClick={() => setSelectedOrderForDetails(enrichOrderWithVariants(order))}
                                  className="px-2.5 py-1.5 rounded-lg bg-[#163B5C] hover:bg-[#112F4A] text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-colors"
                                  title="View Full Order Details"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>View</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setReceiptOrder(enrichOrderWithVariants(order))}
                                  className="p-1.5 rounded-lg border border-[#E8EDF2] text-[#64748B] hover:text-[#163B5C] hover:bg-slate-50 transition-colors"
                                  title="Print Receipt / Tax Invoice"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Orders Pagination Controls */}
                {totalOrderPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-[#E8EDF2] text-xs text-[#64748B]">
                    <span>
                      Page <strong className="text-[#163B5C]">{orderPage}</strong> of{' '}
                      <strong className="text-[#163B5C]">{totalOrderPages}</strong> ({filteredOrders.length} total orders)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={orderPage === 1}
                        onClick={() => setOrderPage((p) => Math.max(p - 1, 1))}
                        className="px-3 py-1.5 rounded-lg border border-[#E8EDF2] bg-white font-bold disabled:opacity-40 hover:bg-[#FFFCFB] flex items-center gap-1"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" /> Prev
                      </button>
                      <button
                        disabled={orderPage === totalOrderPages}
                        onClick={() => setOrderPage((p) => Math.min(p + 1, totalOrderPages))}
                        className="px-3 py-1.5 rounded-lg border border-[#E8EDF2] bg-white font-bold disabled:opacity-40 hover:bg-[#FFFCFB] flex items-center gap-1"
                      >
                        Next <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Hero Banners Management View */}
        {activeTab === 'banners' && (
          <div className="space-y-6">
            {/* Create Banner Form */}
            <div className="bg-white rounded-3xl border border-[#E8EDF2] p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E8EDF2] pb-4">
                <div>
                  <div className="flex items-center gap-2 text-[#ED3500]">
                    <ImageIcon className="w-5 h-5" />
                    <h3 className="text-lg font-black text-[#163B5C]">Add New Hero Carousel Slide</h3>
                  </div>
                  <p className="text-xs text-[#64748B] mt-1">
                    Manage the main homepage hero banner slides (Eyebrow tag, Headline, Subtitle/Description, Button CTA, and Image).
                  </p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 bg-amber-50 text-amber-800 rounded-full border border-amber-200 self-start sm:self-auto">
                  {banners.length} Active Slides
                </span>
              </div>

              {bannerError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  {bannerError}
                </div>
              )}

              <form onSubmit={handleAddBanner} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Eyebrow Tag */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#163B5C] uppercase tracking-wider block">
                      Eyebrow Tag (e.g. Festival / Collection Tag)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. FESTIVAL & POOJA ESSENTIALS"
                      value={newBannerEyebrow}
                      onChange={(e) => setNewBannerEyebrow(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E8EDF2] text-sm focus:outline-none focus:border-[#ED3500]"
                    />
                  </div>

                  {/* Headline Title */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#163B5C] uppercase tracking-wider block">
                      Hero Headline / Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sacred Flowers For Daily Pooja"
                      value={newBannerTitle}
                      onChange={(e) => setNewBannerTitle(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E8EDF2] text-sm focus:outline-none focus:border-[#ED3500]"
                    />
                  </div>
                </div>

                {/* Subtitle / Description */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#163B5C] uppercase tracking-wider block">
                    Subheading / Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Fresh marigold, lotus, jasmine, and mango leaves delivered directly to your doorstep in pristine condition."
                    value={newBannerDesc}
                    onChange={(e) => setNewBannerDesc(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E8EDF2] text-sm focus:outline-none focus:border-[#ED3500]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Button CTA Text */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#163B5C] uppercase tracking-wider block">
                      Button Text (CTA)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Shop Pooja Items"
                      value={newBannerCta}
                      onChange={(e) => setNewBannerCta(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E8EDF2] text-sm focus:outline-none focus:border-[#ED3500]"
                    />
                  </div>

                  {/* Button Link */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#163B5C] uppercase tracking-wider block">
                      Button Target Link URL
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. #products-section or /categories/..."
                      value={newBannerLink}
                      onChange={(e) => setNewBannerLink(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E8EDF2] text-sm focus:outline-none focus:border-[#ED3500]"
                    />
                  </div>

                  {/* Slide Order */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#163B5C] uppercase tracking-wider block">
                      Slide Order Position
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={newBannerOrder}
                      onChange={(e) => setNewBannerOrder(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E8EDF2] text-sm focus:outline-none focus:border-[#ED3500]"
                    />
                  </div>
                </div>

                {/* Banner Image */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#163B5C] uppercase tracking-wider block">
                    Banner Background Image *
                  </label>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <label className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#FFF8F5] hover:bg-[#ED3500]/10 text-[#ED3500] border border-[#ED3500]/20 text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2 transition-all shrink-0">
                      <Upload className="w-4 h-4" /> Select Banner Image File
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBannerImageChange}
                        className="hidden"
                      />
                    </label>

                    <div className="flex-1 w-full">
                      <input
                        type="text"
                        placeholder="Or image URL / Base64 string"
                        value={newBannerImage}
                        onChange={(e) => {
                          setNewBannerImage(e.target.value);
                          setBannerImagePreview(e.target.value);
                        }}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#E8EDF2] text-xs focus:outline-none focus:border-[#ED3500]"
                      />
                    </div>
                  </div>
                </div>

                {bannerImagePreview && (
                  <div className="p-3 rounded-2xl bg-[#FFFCFB] border border-[#E8EDF2] max-w-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-[#64748B] uppercase">Slide Image Preview:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setNewBannerImage('');
                          setBannerImagePreview('');
                        }}
                        className="text-xs text-rose-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="relative aspect-video rounded-xl overflow-hidden border border-[#E8EDF2] bg-slate-100">
                      <img
                        src={bannerImagePreview}
                        alt="Banner Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmittingBanner}
                  className="px-6 py-3 rounded-xl bg-[#ED3500] hover:bg-[#D02E00] text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-[#ED3500]/20 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {isSubmittingBanner ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Add Hero Carousel Slide
                </button>
              </form>
            </div>

            {/* Banners List */}
            {loadingBanners ? (
              <div className="py-12 text-center">
                <RefreshCw className="w-8 h-8 text-[#ED3500] animate-spin mx-auto" />
              </div>
            ) : banners.length === 0 ? (
              <div className="py-12 text-center bg-white rounded-3xl border border-[#E8EDF2] p-6 space-y-2">
                <ImageIcon className="w-10 h-10 text-[#64748B] mx-auto opacity-40" />
                <h4 className="font-bold text-[#163B5C]">No hero banners added yet</h4>
                <p className="text-xs text-[#64748B]">
                  Uploaded banners will render dynamically in the customer storefront hero section.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {banners.map((b, idx) => (
                  <div
                    key={b._id}
                    className="bg-white rounded-2xl border border-[#E8EDF2] overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Image Preview with Slide Order Pill */}
                      <div className="relative aspect-video bg-[#FFF8F5] overflow-hidden">
                        <img
                          src={b.image}
                          alt={b.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute top-2 left-2 flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold">
                            Slide #{idx + 1}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-white/90 text-gray-800 text-[10px] font-bold shadow-xs">
                            Order {b.order ?? idx + 1}
                          </span>
                        </div>
                      </div>

                      {/* Content Details */}
                      <div className="p-4 space-y-2.5">
                        {/* Eyebrow Tag */}
                        {b.eyebrow ? (
                          <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                            {b.eyebrow}
                          </span>
                        ) : (
                          <span className="inline-block text-[10px] font-medium text-gray-400 italic">
                            (No eyebrow tag)
                          </span>
                        )}

                        {/* Title */}
                        <h4 className="font-bold text-sm text-[#163B5C] leading-snug line-clamp-2">
                          {b.title}
                        </h4>

                        {/* Description */}
                        {b.description && (
                          <p className="text-xs text-[#64748B] line-clamp-2 leading-relaxed">
                            {b.description}
                          </p>
                        )}

                        {/* CTA Button & Link */}
                        <div className="pt-1 flex flex-wrap items-center gap-2">
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F4F8F4] border border-[#134633]/20 text-[11px] font-semibold text-[#134633]">
                            <span>{b.ctaText || 'Shop Now'}</span>
                            <ArrowRight className="w-3 h-3" />
                          </div>
                          {b.link && (
                            <span className="text-[11px] text-blue-600 truncate max-w-[140px]" title={b.link}>
                              {b.link}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="p-4 pt-0">
                      <div className="flex items-center justify-between pt-3 border-t border-[#E8EDF2]">
                        <span className="text-[10px] text-[#64748B]">
                          Added {new Date(b.createdAt).toLocaleDateString('en-US')}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenEditBanner(b)}
                            className="px-3 py-1.5 rounded-lg bg-[#FFF8F5] text-[#ED3500] hover:bg-[#ED3500] hover:text-white font-bold text-xs flex items-center gap-1 transition-all border border-[#ED3500]/20"
                            title="Edit this banner slide"
                          >
                            <Edit className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteBanner(b._id)}
                            className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white font-bold text-xs flex items-center gap-1 transition-all"
                            title="Delete this banner slide"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Payment Settings Management View */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8EDF2] shadow-sm max-w-3xl">
              <div className="flex items-center justify-between pb-6 border-b border-[#E8EDF2] mb-6">
                <div>
                  <h2 className="text-xl font-extrabold text-[#163B5C] flex items-center gap-2">
                    <CreditCard className="w-6 h-6 text-[#ED3500]" /> Payment Method Settings
                  </h2>
                  <p className="text-xs text-[#64748B] mt-1">
                    Manage client identity and payment methods without editing source code.
                  </p>
                </div>
                <button
                  onClick={fetchSettings}
                  disabled={loadingSettings}
                  className="p-2 rounded-xl bg-[#FFFCFB] border border-[#E8EDF2] text-[#64748B] hover:text-[#ED3500] transition-colors"
                  title="Reload Settings"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingSettings ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {settingsSuccess && (
                <div className="mb-6 p-4 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{settingsSuccess}</span>
                </div>
              )}

              {settingsError && (
                <div className="mb-6 p-4 rounded-2xl bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold">
                  {settingsError}
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="space-y-6">
                <div>
                  <h3 className="font-extrabold text-sm text-[#163B5C] mb-3">Storefront Identity</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {(['siteName', 'businessName', 'tagline', 'domain', 'contactEmail', 'contactPhone'] as const).map((field) => (
                      <label key={field} className="text-xs font-bold text-[#163B5C] capitalize">
                        {field.replace(/([A-Z])/g, ' $1')}
                        <input value={paymentSettings[field]} onChange={(e) => setPaymentSettings({ ...paymentSettings, [field]: e.target.value })} className="mt-1.5 w-full rounded-xl border border-[#E8EDF2] bg-white px-3 py-2.5 text-sm font-medium outline-none focus:border-[#ED3500]" />
                      </label>
                    ))}
                  </div>
                </div>

                {/* Company & Invoice Profile */}
                <div className="pt-4 border-t border-[#E8EDF2]">
                  <div className="mb-3">
                    <h3 className="font-extrabold text-sm text-[#163B5C]">Company &amp; Tax Invoice Profile</h3>
                    <p className="text-xs text-[#64748B]">These details appear in the header and footer of your Tax Invoices, Receipts, and Financial Statements.</p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="text-xs font-bold text-[#163B5C] sm:col-span-2">
                      Company Street Address
                      <input
                        value={paymentSettings.companyAddress}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, companyAddress: e.target.value })}
                        placeholder="39120 Argonaut Way, Suite 428"
                        className="mt-1.5 w-full rounded-xl border border-[#E8EDF2] bg-white px-3 py-2.5 text-sm font-medium outline-none focus:border-[#ED3500]"
                      />
                    </label>

                    <label className="text-xs font-bold text-[#163B5C]">
                      City
                      <input
                        value={paymentSettings.companyCity}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, companyCity: e.target.value })}
                        placeholder="Fremont"
                        className="mt-1.5 w-full rounded-xl border border-[#E8EDF2] bg-white px-3 py-2.5 text-sm font-medium outline-none focus:border-[#ED3500]"
                      />
                    </label>

                    <label className="text-xs font-bold text-[#163B5C]">
                      State
                      <input
                        value={paymentSettings.companyState}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, companyState: e.target.value })}
                        placeholder="CA"
                        className="mt-1.5 w-full rounded-xl border border-[#E8EDF2] bg-white px-3 py-2.5 text-sm font-medium outline-none focus:border-[#ED3500]"
                      />
                    </label>

                    <label className="text-xs font-bold text-[#163B5C]">
                      ZIP / Postal Code
                      <input
                        value={paymentSettings.companyZip}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, companyZip: e.target.value })}
                        placeholder="94538"
                        className="mt-1.5 w-full rounded-xl border border-[#E8EDF2] bg-white px-3 py-2.5 text-sm font-medium outline-none focus:border-[#ED3500]"
                      />
                    </label>

                    <label className="text-xs font-bold text-[#163B5C]">
                      Country
                      <input
                        value={paymentSettings.companyCountry}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, companyCountry: e.target.value })}
                        placeholder="United States"
                        className="mt-1.5 w-full rounded-xl border border-[#E8EDF2] bg-white px-3 py-2.5 text-sm font-medium outline-none focus:border-[#ED3500]"
                      />
                    </label>

                    <label className="text-xs font-bold text-[#163B5C]">
                      Federal EIN / Tax ID
                      <input
                        value={paymentSettings.companyTaxId}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, companyTaxId: e.target.value })}
                        placeholder="94-3829104"
                        className="mt-1.5 w-full rounded-xl border border-[#E8EDF2] bg-white px-3 py-2.5 text-sm font-medium outline-none focus:border-[#ED3500]"
                      />
                    </label>

                    <label className="text-xs font-bold text-[#163B5C]">
                      State Tax Permit #
                      <input
                        value={paymentSettings.stateTaxPermitId}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, stateTaxPermitId: e.target.value })}
                        placeholder="SR-KHE-102-984712"
                        className="mt-1.5 w-full rounded-xl border border-[#E8EDF2] bg-white px-3 py-2.5 text-sm font-medium outline-none focus:border-[#ED3500]"
                      />
                    </label>

                    <label className="text-xs font-bold text-[#163B5C]">
                      Bank Name
                      <input
                        value={paymentSettings.bankName}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, bankName: e.target.value })}
                        placeholder="JPMorgan Chase Bank, N.A."
                        className="mt-1.5 w-full rounded-xl border border-[#E8EDF2] bg-white px-3 py-2.5 text-sm font-medium outline-none focus:border-[#ED3500]"
                      />
                    </label>

                    <label className="text-xs font-bold text-[#163B5C]">
                      Bank Account No.
                      <input
                        value={paymentSettings.bankAccountNo}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, bankAccountNo: e.target.value })}
                        placeholder="Checking •••• 4829"
                        className="mt-1.5 w-full rounded-xl border border-[#E8EDF2] bg-white px-3 py-2.5 text-sm font-medium outline-none focus:border-[#ED3500]"
                      />
                    </label>

                    <label className="text-xs font-bold text-[#163B5C]">
                      ABA Routing No.
                      <input
                        value={paymentSettings.bankRoutingNo}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, bankRoutingNo: e.target.value })}
                        placeholder="121000247"
                        className="mt-1.5 w-full rounded-xl border border-[#E8EDF2] bg-white px-3 py-2.5 text-sm font-medium outline-none focus:border-[#ED3500]"
                      />
                    </label>

                    <label className="text-xs font-bold text-[#163B5C]">
                      Bank Account Beneficiary
                      <input
                        value={paymentSettings.bankHolder}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, bankHolder: e.target.value })}
                        placeholder="Indian Flowers LLC"
                        className="mt-1.5 w-full rounded-xl border border-[#E8EDF2] bg-white px-3 py-2.5 text-sm font-medium outline-none focus:border-[#ED3500]"
                      />
                    </label>

                    <div className="sm:col-span-2 flex items-center gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                      <div className="w-16 h-16 rounded-xl border border-slate-300 bg-white flex items-center justify-center overflow-hidden shrink-0">
                        <img
                          src={paymentSettings.logoDataUrl || '/indian-flowers-logo.svg'}
                          alt="Invoice Logo"
                          className="w-full h-full object-contain p-1"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-bold text-[#163B5C] block">
                          Invoice Brand Logo Path / URL
                        </label>
                        <input
                          value={paymentSettings.logoDataUrl}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, logoDataUrl: e.target.value })}
                          placeholder="/indian-flowers-logo.svg"
                          className="mt-1 w-full rounded-xl border border-[#E8EDF2] bg-white px-3 py-2 text-xs font-medium outline-none focus:border-[#ED3500]"
                        />
                        <p className="text-[11px] text-[#64748B] mt-0.5">
                          Default: <code className="text-emerald-700">/indian-flowers-logo.svg</code> (renders high-resolution vector emblem on print).
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Razorpay Toggle & Config Card */}
                <div className="p-5 rounded-2xl border border-[#E8EDF2] bg-[#FFFCFB] space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#0B3B24]/10 text-[#0B3B24] flex items-center justify-center font-black">
                        <CreditCard className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-[#163B5C]">Razorpay Online Payment (USD)</h3>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              paymentSettings.enableRazorpay
                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-100 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {paymentSettings.enableRazorpay ? 'Active' : 'Disabled'}
                          </span>
                        </div>
                        <p className="text-xs text-[#64748B] mt-0.5">
                          Enables customers to pay securely with US credit cards, debit cards, and digital wallets via Razorpay.
                        </p>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={paymentSettings.enableRazorpay}
                        onChange={(e) =>
                          setPaymentSettings({ ...paymentSettings, enableRazorpay: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-12 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#0B3B24]"></div>
                    </label>
                  </div>

                  {paymentSettings.enableRazorpay && (
                    <div className="pt-3 border-t border-[#E8EDF2] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="font-bold text-[#163B5C] block mb-1">Razorpay Key ID:</label>
                        <input
                          type="text"
                          placeholder="rzp_live_... or rzp_test_..."
                          value={paymentSettings.razorpayKeyId}
                          onChange={(e) =>
                            setPaymentSettings({ ...paymentSettings, razorpayKeyId: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-[#0B3B24] font-mono text-[11px]"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-[#163B5C] block mb-1">Razorpay Key Secret:</label>
                        <input
                          type="password"
                          placeholder="••••••••••••••••"
                          value={paymentSettings.razorpayKeySecret}
                          onChange={(e) =>
                            setPaymentSettings({ ...paymentSettings, razorpayKeySecret: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-[#0B3B24] font-mono text-[11px]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* COD Toggle Card */}
                <div className="p-5 rounded-2xl border border-[#E8EDF2] bg-[#FFFCFB] flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black">
                      <DollarSign className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-[#163B5C]">Cash on Delivery (COD)</h3>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            paymentSettings.enableCOD
                              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-100 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {paymentSettings.enableCOD ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        Allows customers to pay in cash upon receiving their order package at their address.
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={paymentSettings.enableCOD}
                      onChange={(e) =>
                        setPaymentSettings({ ...paymentSettings, enableCOD: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-12 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#ED3500]"></div>
                  </label>
                </div>

                {/* Customer Loyalty Points & Rewards System Card */}
                <div className="p-5 sm:p-6 rounded-2xl border border-[#E8EDF2] bg-[#FFFCFB] space-y-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black">
                        <Tag className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-[#163B5C]">Customer Loyalty Points &amp; Rewards Program</h3>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              paymentSettings.loyaltyEnabled
                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-100 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {paymentSettings.loyaltyEnabled ? 'Active' : 'Disabled'}
                          </span>
                        </div>
                        <p className="text-xs text-[#64748B] mt-0.5">
                          Award customers reward points for completed purchases in US Dollars ($ USD) and allow them to redeem points as order discounts.
                        </p>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={paymentSettings.loyaltyEnabled}
                        onChange={(e) =>
                          setPaymentSettings({ ...paymentSettings, loyaltyEnabled: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-12 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#0B3B24]"></div>
                    </label>
                  </div>

                  {paymentSettings.loyaltyEnabled && (
                    <div className="pt-4 border-t border-[#E8EDF2] space-y-4">
                      <div>
                        <h4 className="font-bold text-xs text-[#163B5C] uppercase tracking-wider mb-2">Points Earning Rule</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <label className="text-xs font-bold text-[#163B5C] block">
                            Spend Amount ($ USD)
                            <div className="mt-1 relative rounded-xl border border-[#E8EDF2] bg-white">
                              <span className="absolute left-3 top-2.5 text-xs text-gray-500 font-bold">$</span>
                              <input
                                type="number"
                                min="1"
                                step="1"
                                value={paymentSettings.loyaltySpendAmount}
                                onChange={(e) =>
                                  setPaymentSettings({
                                    ...paymentSettings,
                                    loyaltySpendAmount: Math.max(1, Number(e.target.value) || 1),
                                  })
                                }
                                className="w-full pl-7 pr-3 py-2 text-xs font-medium outline-none rounded-xl"
                              />
                            </div>
                            <span className="text-[10px] text-[#64748B] mt-0.5 block">Amount customer must spend (e.g. $100)</span>
                          </label>

                          <label className="text-xs font-bold text-[#163B5C] block">
                            Points Earned
                            <div className="mt-1 relative rounded-xl border border-[#E8EDF2] bg-white">
                              <input
                                type="number"
                                min="1"
                                step="1"
                                value={paymentSettings.loyaltyPointsEarned}
                                onChange={(e) =>
                                  setPaymentSettings({
                                    ...paymentSettings,
                                    loyaltyPointsEarned: Math.max(1, Number(e.target.value) || 1),
                                  })
                                }
                                className="w-full px-3 py-2 text-xs font-medium outline-none rounded-xl"
                              />
                            </div>
                            <span className="text-[10px] text-[#64748B] mt-0.5 block">Points awarded per spend tier (e.g. 10 points)</span>
                          </label>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-[#E8EDF2]">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-bold text-xs text-[#163B5C] uppercase tracking-wider">Points Redemption &amp; Claiming</h4>
                            <p className="text-[11px] text-[#64748B]">Allow customers to convert accrued reward points into cash discounts at checkout.</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={paymentSettings.loyaltyRedemptionEnabled}
                              onChange={(e) =>
                                setPaymentSettings({ ...paymentSettings, loyaltyRedemptionEnabled: e.target.checked })
                              }
                              className="sr-only peer"
                            />
                            <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0B3B24]"></div>
                          </label>
                        </div>

                        {paymentSettings.loyaltyRedemptionEnabled && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <label className="text-xs font-bold text-[#163B5C] block">
                              Points per $1.00 USD Discount
                              <input
                                type="number"
                                min="1"
                                step="1"
                                value={paymentSettings.loyaltyPointsPerDollar}
                                onChange={(e) =>
                                  setPaymentSettings({
                                    ...paymentSettings,
                                    loyaltyPointsPerDollar: Math.max(1, Number(e.target.value) || 1),
                                  })
                                }
                                className="mt-1 w-full px-3 py-2 rounded-xl border border-[#E8EDF2] bg-white text-xs font-medium outline-none focus:border-[#ED3500]"
                              />
                              <span className="text-[10px] text-[#64748B] mt-0.5 block">e.g. 10 pts = $1.00 (1 pt = $0.10)</span>
                            </label>

                            <label className="text-xs font-bold text-[#163B5C] block">
                              Min Points to Claim
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={paymentSettings.loyaltyMinPointsToRedeem}
                                onChange={(e) =>
                                  setPaymentSettings({
                                    ...paymentSettings,
                                    loyaltyMinPointsToRedeem: Math.max(0, Number(e.target.value) || 0),
                                  })
                                }
                                className="mt-1 w-full px-3 py-2 rounded-xl border border-[#E8EDF2] bg-white text-xs font-medium outline-none focus:border-[#ED3500]"
                              />
                              <span className="text-[10px] text-[#64748B] mt-0.5 block">Minimum threshold to redeem (e.g. 10)</span>
                            </label>

                            <label className="text-xs font-bold text-[#163B5C] block">
                              Max Discount (% of Subtotal)
                              <input
                                type="number"
                                min="1"
                                max="100"
                                step="1"
                                value={paymentSettings.loyaltyMaxRedemptionPercent}
                                onChange={(e) =>
                                  setPaymentSettings({
                                    ...paymentSettings,
                                    loyaltyMaxRedemptionPercent: Math.min(100, Math.max(1, Number(e.target.value) || 100)),
                                  })
                                }
                                className="mt-1 w-full px-3 py-2 rounded-xl border border-[#E8EDF2] bg-white text-xs font-medium outline-none focus:border-[#ED3500]"
                              />
                              <span className="text-[10px] text-[#64748B] mt-0.5 block">Max cap per order (e.g. 100%)</span>
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingSettings}
                  className="w-full py-3.5 rounded-2xl bg-[#ED3500] hover:bg-[#D02E00] text-white font-bold text-sm uppercase tracking-wider shadow-lg shadow-[#ED3500]/25 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmittingSettings ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    'Save Settings & Loyalty Configuration'
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* POS Counter Management View */}
        {activeTab === 'pos' && (
          licenseState?.features?.posEnabled !== false ? (
            <POSCounter
              products={products}
              categories={categories}
              onRefreshProducts={fetchAllData}
            />
          ) : (
            <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-12 text-center max-w-xl mx-auto space-y-4 my-12 shadow-2xl">
              <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black">POS Counter Feature Locked</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                The POS Billing Counter module is not enabled in your current subscription plan ({licenseState?.planName || 'Current Plan'}).
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setActiveTab('subscription')}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition"
                >
                  Upgrade Plan in Subscription Tab ↗
                </button>
              </div>
            </div>
          )
        )}

        {/* Subscription & Licensing Management View */}
        {activeTab === 'subscription' && (
          <SubscriptionTab
            initialLicense={licenseState}
            onRefreshLicense={fetchAllData}
          />
        )}

        {/* Custom Floral Orders & Inquiries View */}
        {activeTab === 'customOrders' && (
          <div className="space-y-6">
            {/* Top Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-[#E8EDF2] shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base sm:text-lg font-black text-[#163B5C]">
                    Custom Floral Orders &amp; Inquiries
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#F4F8F4] text-[#0B3B24] border border-emerald-200">
                    {customOrders.length} Total
                  </span>
                  {newCustomOrdersCount > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#C85A78] text-white">
                      {newCustomOrdersCount} New
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#64748B]">
                  Direct inquiries submitted from the website bespoke contact form (Weddings, Temples, Bulk Jasmine).
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {/* Search */}
                <div className="relative flex-1 sm:w-64">
                  <input
                    type="text"
                    placeholder="Search name, phone, city..."
                    value={customOrderSearch}
                    onChange={(e) => setCustomOrderSearch(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 rounded-xl border border-[#E8EDF2] text-xs focus:outline-none focus:border-[#0B3B24]"
                  />
                  <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                  {customOrderSearch && (
                    <button
                      onClick={() => setCustomOrderSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Refresh */}
                <button
                  onClick={() => fetchCustomOrders(true)}
                  disabled={loadingCustomOrders}
                  className="px-3.5 py-2 rounded-xl bg-[#F4F8F4] hover:bg-emerald-100/60 border border-emerald-200 text-[#0B3B24] font-bold text-xs flex items-center gap-1.5 transition-all"
                  title="Refresh Inquiries"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingCustomOrders ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Status:
              </span>
              {(['All', 'NEW', 'CONTACTED', 'QUOTED', 'CONFIRMED', 'ARCHIVED'] as const).map((st) => {
                const count = st === 'All' ? customOrders.length : customOrders.filter((c) => c.status === st).length;
                return (
                  <button
                    key={st}
                    onClick={() => setCustomOrderStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                      customOrderStatusFilter === st
                        ? 'bg-[#0B3B24] text-white shadow-xs'
                        : 'bg-white border border-[#E8EDF2] text-[#64748B] hover:text-[#163B5C] hover:border-gray-300'
                    }`}
                  >
                    <span>{st === 'All' ? 'All Inquiries' : st}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        customOrderStatusFilter === st ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Inquiries Content */}
            {loadingCustomOrders ? (
              <div className="py-20 text-center bg-white rounded-2xl border border-[#E8EDF2]">
                <RefreshCw className="w-8 h-8 text-[#0B3B24] animate-spin mx-auto" />
                <p className="text-xs text-[#64748B] mt-3 font-semibold">Loading custom orders from database...</p>
              </div>
            ) : filteredCustomOrders.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-3xl border border-[#E8EDF2] p-8 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-[#F4F8F4] text-[#0B3B24] flex items-center justify-center mx-auto border border-emerald-100">
                  <Flower2 className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-[#163B5C]">
                  {customOrderSearch || customOrderStatusFilter !== 'All'
                    ? 'No matching inquiries found'
                    : 'No custom order inquiries yet'}
                </h3>
                <p className="text-xs text-[#64748B] max-w-md mx-auto">
                  {customOrderSearch || customOrderStatusFilter !== 'All'
                    ? 'Try adjusting your search keywords or status filter.'
                    : 'When customers fill out the bespoke order form on Indian-Flowers.com, their inquiries will appear here.'}
                </p>
                {(customOrderSearch || customOrderStatusFilter !== 'All') && (
                  <button
                    onClick={() => {
                      setCustomOrderSearch('');
                      setCustomOrderStatusFilter('All');
                    }}
                    className="px-4 py-2 rounded-full bg-[#0B3B24] text-white text-xs font-bold"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCustomOrders.map((inquiry) => {
                  const statusColors: Record<string, string> = {
                    NEW: 'bg-rose-50 text-rose-700 border-rose-200',
                    CONTACTED: 'bg-blue-50 text-blue-700 border-blue-200',
                    QUOTED: 'bg-amber-50 text-amber-700 border-amber-200',
                    CONFIRMED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    ARCHIVED: 'bg-gray-100 text-gray-600 border-gray-200',
                  };
                  const cleanPhone = (inquiry.customerPhone || '').replace(/[^0-9]/g, '');

                  return (
                    <div
                      key={inquiry._id}
                      className="bg-white rounded-2xl border border-[#E8EDF2] shadow-xs hover:shadow-md transition-shadow p-5 sm:p-6 space-y-4"
                    >
                      {/* Inquiry Card Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8EDF2]">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="font-mono text-xs sm:text-sm font-extrabold text-[#0B3B24] bg-[#F4F8F4] px-2.5 py-1 rounded-lg border border-emerald-100">
                            {inquiry.inquiryId}
                          </span>
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-[#C85A78] border border-rose-100">
                            {inquiry.occasion}
                          </span>
                          <span className="text-[11px] text-[#64748B] flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(inquiry.createdAt).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {/* Status Selector */}
                        <div className="flex items-center gap-2">
                          <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                            Status:
                          </label>
                          <select
                            value={inquiry.status}
                            onChange={(e) => handleUpdateCustomOrderStatus(inquiry._id, e.target.value)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer focus:outline-none ${
                              statusColors[inquiry.status] || 'bg-gray-50 text-gray-700 border-gray-200'
                            }`}
                          >
                            <option value="NEW">NEW</option>
                            <option value="CONTACTED">CONTACTED</option>
                            <option value="QUOTED">QUOTED</option>
                            <option value="CONFIRMED">CONFIRMED</option>
                            <option value="ARCHIVED">ARCHIVED</option>
                          </select>
                        </div>
                      </div>

                      {/* Customer Details & Event Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                        {/* Customer */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                            Customer
                          </span>
                          <p className="font-extrabold text-sm text-[#163B5C]">{inquiry.customerName}</p>
                          <p className="text-[#64748B] flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-[#ED3500] shrink-0" />
                            <span>{inquiry.cityState}</span>
                          </p>
                        </div>

                        {/* Contact */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                            Contact Details
                          </span>
                          <p className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                            <a
                              href={`tel:${inquiry.customerPhone}`}
                              className="font-semibold text-emerald-700 hover:underline"
                            >
                              {inquiry.customerPhone}
                            </a>
                            {cleanPhone && (
                              <a
                                href={`https://wa.me/${cleanPhone.length === 10 ? '1' + cleanPhone : cleanPhone}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 hover:bg-emerald-200 font-bold"
                                title="Chat on WhatsApp"
                              >
                                WhatsApp ↗
                              </a>
                            )}
                          </p>
                          <p className="flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-blue-600 shrink-0" />
                            <a
                              href={`mailto:${inquiry.customerEmail}`}
                              className="text-blue-700 hover:underline truncate max-w-[200px]"
                            >
                              {inquiry.customerEmail}
                            </a>
                          </p>
                        </div>

                        {/* Event Date & Budget */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                            Event &amp; Budget
                          </span>
                          <p className="flex items-center gap-1.5 font-semibold text-gray-800">
                            <Calendar className="w-3 h-3 text-purple-600 shrink-0" />
                            <span>{inquiry.eventDate ? inquiry.eventDate : 'Date Flexible'}</span>
                          </p>
                          <p className="text-gray-600">
                            Budget:{' '}
                            <strong className="text-[#0B3B24]">
                              {inquiry.budget || 'Not specified'}
                            </strong>
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="space-y-1 flex flex-col justify-between">
                          <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                            Quick Actions
                          </span>
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            {inquiry.status === 'NEW' && (
                              <button
                                onClick={() => handleUpdateCustomOrderStatus(inquiry._id, 'CONTACTED')}
                                className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] border border-blue-200 transition-colors"
                              >
                                Mark Contacted
                              </button>
                            )}
                            {inquiry.status === 'CONTACTED' && (
                              <button
                                onClick={() => handleUpdateCustomOrderStatus(inquiry._id, 'QUOTED')}
                                className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-[11px] border border-amber-200 transition-colors"
                              >
                                Mark Quoted
                              </button>
                            )}
                            {inquiry.status === 'QUOTED' && (
                              <button
                                onClick={() => handleUpdateCustomOrderStatus(inquiry._id, 'CONFIRMED')}
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] border border-emerald-200 transition-colors"
                              >
                                Confirm Order
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteCustomOrder(inquiry._id)}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete inquiry"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Requirements Box */}
                      <div className="bg-[#FAF6F0] rounded-xl p-3.5 border border-[#F3DFD1]/70">
                        <span className="text-[10px] font-bold text-[#8C6D46] uppercase tracking-wider block mb-1">
                          Customer Requirements / Bespoke Request:
                        </span>
                        <p className="text-xs text-gray-800 leading-relaxed whitespace-pre-wrap font-normal">
                          {inquiry.requirements}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Subscribers */}
        {activeTab === 'subscribers' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-[#163B5C] flex items-center gap-2">
                  <Mail className="w-5 h-5 text-[#0B3B24]" />
                  <span>Newsletter Email Subscribers</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#0B3B24] font-bold">
                    {subscribers.length} total
                  </span>
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Customers who subscribed for flower updates, festival offers, and seasonal deals.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleExportSubscribersCSV}
                  disabled={subscribers.length === 0}
                  className="px-4 py-2 rounded-xl bg-white border border-[#E8EDF2] hover:border-[#0B3B24] text-[#0B3B24] font-bold text-xs flex items-center gap-2 transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Export subscriber list to CSV"
                >
                  <Download className="w-4 h-4" />
                  <span>Export to CSV</span>
                </button>

                <button
                  onClick={() => fetchSubscribers(true)}
                  disabled={loadingSubscribers}
                  className="px-3.5 py-2 rounded-xl bg-[#0B3B24] hover:bg-[#134633] text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingSubscribers ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search subscriber by email address..."
                  value={subscriberSearch}
                  onChange={(e) => setSubscriberSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8EDF2] text-xs focus:outline-none focus:border-[#0B3B24] bg-white font-normal"
                />
              </div>
            </div>

            {/* Subscribers List Table */}
            {loadingSubscribers ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-[#E8EDF2]">
                <RefreshCw className="w-6 h-6 animate-spin text-[#0B3B24] mx-auto mb-2" />
                <p className="text-xs text-[#64748B]">Loading newsletter subscribers...</p>
              </div>
            ) : subscribers.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-[#E8EDF2] space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#0B3B24]/10 text-[#0B3B24] flex items-center justify-center mx-auto">
                  <Mail className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-[#163B5C]">No subscribers yet</h4>
                <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                  When visitors subscribe using the footer newsletter signup on the homepage, their email addresses will appear here.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-[#E8EDF2] shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF6F0] border-b border-[#E8EDF2] text-[#64748B] uppercase font-bold text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3.5 px-4">#</th>
                        <th className="py-3.5 px-4">Email Address</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4">Source</th>
                        <th className="py-3.5 px-4">Subscribed Date</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8EDF2]">
                      {subscribers
                        .filter((s) =>
                          !subscriberSearch || s.email.toLowerCase().includes(subscriberSearch.toLowerCase())
                        )
                        .map((subscriber, idx) => (
                          <tr key={subscriber._id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3.5 px-4 font-mono text-gray-400">{idx + 1}</td>
                            <td className="py-3.5 px-4 font-semibold text-[#163B5C]">
                              <div className="flex items-center gap-2">
                                <Mail className="w-3.5 h-3.5 text-[#0B3B24]" />
                                <a
                                  href={`mailto:${subscriber.email}`}
                                  className="hover:underline hover:text-[#0B3B24]"
                                >
                                  {subscriber.email}
                                </a>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  subscriber.status === 'active'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    subscriber.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'
                                  }`}
                                />
                                {subscriber.status === 'active' ? 'Active' : 'Unsubscribed'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-gray-500 font-mono text-[11px]">
                              {subscriber.source || 'storefront_footer'}
                            </td>
                            <td className="py-3.5 px-4 text-gray-500">
                              {new Date(subscriber.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => handleDeleteSubscriber(subscriber._id, subscriber.email)}
                                disabled={isDeletingSubscriber === subscriber._id}
                                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-40"
                                title="Remove subscriber"
                              >
                                <Trash2 className="w-4 h-4 inline" />
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Store Policies & Legal Disclosures */}
        {activeTab === 'policies' && <PolicyManagerTab />}

        {/* Tab Content: Customer Accounts & User Management */}
        {activeTab === 'customers' && <CustomersTab />}

        {/* Tab Content: Reports & Financial Exports */}
        {activeTab === 'reports' && <ReportsTab />}
      </main>

      {/* Add / Edit Product Modal */}
      {(isAddModalOpen || editingProduct) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#E8EDF2] shadow-2xl p-6 sm:p-8 relative">
            <button
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingProduct(null);
              }}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-[#E8EDF2] text-[#64748B]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-black text-[#163B5C]">
                  {editingProduct ? 'Edit Product Details' : 'Add New Product to Inventory'}
                </h3>
                <p className="text-xs text-[#64748B]">
                  Enter product details, MRP, price, GST slab & upload 1 image.
                </p>
              </div>

              {productFormError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  {productFormError}
                </div>
              )}

              <form onSubmit={handleSaveProduct} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#163B5C] uppercase tracking-wider">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Organic Wild Honey 500g"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E8EDF2] text-sm focus:outline-none focus:border-[#ED3500]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#163B5C] uppercase tracking-wider">
                    Product Description *
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Detailed description of product origin, purity, packaging..."
                    value={productForm.description}
                    onChange={(e) =>
                      setProductForm({ ...productForm, description: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E8EDF2] text-sm focus:outline-none focus:border-[#ED3500]"
                  />
                </div>

                {/* File Upload Image */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#163B5C] uppercase tracking-wider">
                    Product Image (File Upload) *
                  </label>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <label className="flex-1 w-full border-2 border-dashed border-[#E8EDF2] hover:border-[#ED3500] rounded-2xl p-4 text-center cursor-pointer bg-[#FFFCFB] transition-colors">
                      <Upload className="w-6 h-6 text-[#ED3500] mx-auto mb-1" />
                      <span className="text-xs font-bold text-[#163B5C] block">
                        {imagePreview ? 'Change Image File' : 'Choose Image File'}
                      </span>
                      <span className="text-[10px] text-[#64748B]">PNG, JPG, WEBP up to 5MB</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>

                    {imagePreview && (
                      <div className="w-24 h-24 rounded-2xl border border-[#E8EDF2] overflow-hidden bg-[#FFF8F5] relative shrink-0">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Pricing Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#163B5C] uppercase tracking-wider">
                      MRP (Original $) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="999"
                      value={productForm.mrp}
                      onChange={(e) => setProductForm({ ...productForm, mrp: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E8EDF2] text-sm focus:outline-none focus:border-[#ED3500]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#163B5C] uppercase tracking-wider">
                      Selling Price ($) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="699"
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E8EDF2] text-sm focus:outline-none focus:border-[#ED3500]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#163B5C] uppercase tracking-wider">
                      Stock Quantity *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="10"
                      value={productForm.quantity}
                      onChange={(e) =>
                        setProductForm({ ...productForm, quantity: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E8EDF2] text-sm focus:outline-none focus:border-[#ED3500]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#163B5C] uppercase tracking-wider">
                      Sales Tax Status *
                    </label>
                    <select
                      value={productForm.gst}
                      onChange={(e) => setProductForm({ ...productForm, gst: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E8EDF2] text-sm focus:outline-none focus:border-[#ED3500]"
                    >
                      <option value="1">Standard Taxable (Cut Flowers, Floral Goods)</option>
                      <option value="0">Tax Exempt / Non-Taxable Item</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#163B5C] uppercase tracking-wider">
                      Category *
                    </label>
                    {categories.length === 0 ? (
                      <div className="text-xs text-rose-600 font-semibold pt-2">
                        No categories found. Please add a category in Categories tab first!
                      </div>
                    ) : (
                      <select
                        value={productForm.category}
                        onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#E8EDF2] text-sm focus:outline-none focus:border-[#ED3500]"
                      >
                        {categories.map((c) => (
                          <option key={c._id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Product Variants Management Section */}
                <div className="p-4 rounded-2xl bg-[#FFFCFB] border border-[#E8EDF2] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-extrabold text-[#163B5C] uppercase tracking-wider flex items-center gap-1.5">
                        <Tag className="w-4 h-4 text-[#ED3500]" /> Product Variants & Pricing (Optional)
                      </h4>
                      <p className="text-[11px] text-[#64748B]">
                        Add weight/size variants (e.g. 250g, 500g, 1kg) with variant-based pricing & stock.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddVariantRow}
                      className="px-3 py-1.5 rounded-xl bg-[#ED3500]/10 hover:bg-[#ED3500]/20 text-[#ED3500] font-bold text-xs flex items-center gap-1 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Variant
                    </button>
                  </div>

                  {/* Preset Quick Buttons */}
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <span className="text-[10px] font-bold text-[#64748B] uppercase">Quick Add:</span>
                    {['250g', '500g', '1kg', 'Pack of 2', '100ml', '500ml'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          setProductForm((prev) => ({
                            ...prev,
                            variants: [
                              ...prev.variants,
                              { name: preset, mrp: prev.mrp || '299', price: prev.price || '199', quantity: '10' },
                            ],
                          }));
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white border border-[#E8EDF2] hover:border-[#ED3500] text-[11px] font-semibold text-[#163B5C] hover:text-[#ED3500] transition-colors"
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>

                  {/* Variant Rows List */}
                  {productForm.variants.length > 0 && (
                    <div className="space-y-2.5 pt-2">
                      {productForm.variants.map((v, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center p-3 rounded-xl bg-white border border-[#E8EDF2]"
                        >
                          <div className="sm:col-span-4">
                            <label className="text-[10px] font-bold text-[#64748B] sm:hidden block">Variant Name</label>
                            <input
                              type="text"
                              required
                              placeholder="Variant (e.g. 500g)"
                              value={v.name}
                              onChange={(e) => handleUpdateVariantRow(idx, 'name', e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg border border-[#E8EDF2] text-xs focus:outline-none focus:border-[#ED3500]"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="text-[10px] font-bold text-[#64748B] sm:hidden block">MRP $</label>
                            <input
                              type="number"
                              required
                              placeholder="MRP $"
                              value={v.mrp}
                              onChange={(e) => handleUpdateVariantRow(idx, 'mrp', e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg border border-[#E8EDF2] text-xs focus:outline-none focus:border-[#ED3500]"
                            />
                          </div>

                          <div className="sm:col-span-3">
                            <label className="text-[10px] font-bold text-[#64748B] sm:hidden block">Selling Price $</label>
                            <input
                              type="number"
                              required
                              placeholder="Price $"
                              value={v.price}
                              onChange={(e) => handleUpdateVariantRow(idx, 'price', e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg border border-[#E8EDF2] text-xs focus:outline-none focus:border-[#ED3500]"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="text-[10px] font-bold text-[#64748B] sm:hidden block">Stock Qty</label>
                            <input
                              type="number"
                              required
                              placeholder="Stock"
                              value={v.quantity}
                              onChange={(e) => handleUpdateVariantRow(idx, 'quantity', e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg border border-[#E8EDF2] text-xs focus:outline-none focus:border-[#ED3500]"
                            />
                          </div>

                          <div className="sm:col-span-1 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveVariantRow(idx)}
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Remove Variant"
                            >
                              <Trash2 className="w-4 h-4 mx-auto" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingProduct || categories.length === 0}
                  className="w-full py-3.5 rounded-2xl bg-[#ED3500] hover:bg-[#D02E00] text-white font-bold text-sm uppercase tracking-wider shadow-lg shadow-[#ED3500]/25 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmittingProduct ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : editingProduct ? (
                    'Save Product Changes'
                  ) : (
                    'Add Product to Store'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {isEditCatModalOpen && editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full border border-[#E8EDF2] shadow-2xl p-6 sm:p-8 relative">
            <button
              onClick={() => {
                setIsEditCatModalOpen(false);
                setEditingCategory(null);
                setEditCatName('');
                setEditCatImage('');
                setEditCatImagePreview('');
              }}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-[#E8EDF2] text-[#64748B]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-5">
              <div>
                <h3 className="text-xl font-black text-[#163B5C] flex items-center gap-2">
                  <Edit className="w-5 h-5 text-[#ED3500]" />
                  <span>Edit Category</span>
                </h3>
                <p className="text-xs text-[#64748B]">
                  Update category name and front page circular tile image.
                </p>
              </div>

              <form onSubmit={handleSaveEditedCategory} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#163B5C] uppercase tracking-wider block">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editCatName}
                    onChange={(e) => setEditCatName(e.target.value)}
                    placeholder="Category Name"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E8EDF2] text-sm focus:outline-none focus:border-[#ED3500]"
                  />
                </div>

                {/* Category Image Upload */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#163B5C] uppercase tracking-wider block">
                    Category Image (Front Page Circle Tile)
                  </label>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <label className="flex-1 w-full border-2 border-dashed border-[#E8EDF2] hover:border-[#ED3500] rounded-2xl p-4 text-center cursor-pointer bg-[#FFFCFB] transition-colors">
                      <Upload className="w-5 h-5 text-[#ED3500] mx-auto mb-1" />
                      <span className="text-xs font-bold text-[#163B5C] block">
                        {editCatImagePreview ? 'Change Image File' : 'Upload Image File'}
                      </span>
                      <span className="text-[10px] text-[#64748B]">Auto-optimized for circular tile</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleEditCatImageChange}
                        className="hidden"
                      />
                    </label>

                    {editCatImagePreview && (
                      <div className="relative group shrink-0">
                        <div className="w-20 h-20 rounded-full border-2 border-[#ED3500] overflow-hidden bg-[#FFF8F5] shadow-xs">
                          <img
                            src={editCatImagePreview}
                            alt="Category Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setEditCatImage('');
                            setEditCatImagePreview('');
                          }}
                          className="absolute -top-1 -right-1 p-1 rounded-full bg-rose-600 text-white shadow-xs hover:bg-rose-700 transition-colors"
                          title="Remove image"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditCatModalOpen(false);
                      setEditingCategory(null);
                      setEditCatName('');
                      setEditCatImage('');
                      setEditCatImagePreview('');
                    }}
                    className="flex-1 py-2.5 rounded-xl border border-[#E8EDF2] text-xs font-bold text-[#64748B] hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingCat || !editCatName.trim()}
                    className="flex-1 py-2.5 rounded-xl bg-[#ED3500] hover:bg-[#D02E00] text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-[#ED3500]/20 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                  >
                    {isSubmittingCat ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Hero Banner Modal */}
      {isEditBannerModalOpen && editingBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-[#E8EDF2] shadow-2xl p-6 sm:p-8 relative my-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setIsEditBannerModalOpen(false);
                setEditingBanner(null);
              }}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-[#E8EDF2] text-[#64748B]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-5">
              <div className="border-b border-[#E8EDF2] pb-4">
                <h3 className="text-xl font-black text-[#163B5C] flex items-center gap-2">
                  <Edit className="w-5 h-5 text-[#ED3500]" />
                  <span>Edit Homepage Hero Slide</span>
                </h3>
                <p className="text-xs text-[#64748B] mt-1">
                  Update the eyebrow tag, headline title, description, button CTA, link, or image for this slide.
                </p>
              </div>

              <form onSubmit={handleSaveEditedBanner} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Eyebrow Tag */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#163B5C] uppercase tracking-wider block">
                      Eyebrow Tag
                    </label>
                    <input
                      type="text"
                      value={editBannerEyebrow}
                      onChange={(e) => setEditBannerEyebrow(e.target.value)}
                      placeholder="e.g. FESTIVAL & POOJA ESSENTIALS"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E8EDF2] text-sm focus:outline-none focus:border-[#ED3500]"
                    />
                  </div>

                  {/* Headline Title */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#163B5C] uppercase tracking-wider block">
                      Headline / Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={editBannerTitle}
                      onChange={(e) => setEditBannerTitle(e.target.value)}
                      placeholder="e.g. Sacred Flowers For Daily Pooja"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E8EDF2] text-sm focus:outline-none focus:border-[#ED3500]"
                    />
                  </div>
                </div>

                {/* Subtitle / Description */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#163B5C] uppercase tracking-wider block">
                    Subheading / Description
                  </label>
                  <textarea
                    rows={2}
                    value={editBannerDesc}
                    onChange={(e) => setEditBannerDesc(e.target.value)}
                    placeholder="e.g. Fresh marigold, lotus, jasmine, and mango leaves delivered directly to your doorstep in pristine condition."
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E8EDF2] text-sm focus:outline-none focus:border-[#ED3500]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Button CTA Text */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#163B5C] uppercase tracking-wider block">
                      Button Text (CTA)
                    </label>
                    <input
                      type="text"
                      value={editBannerCta}
                      onChange={(e) => setEditBannerCta(e.target.value)}
                      placeholder="e.g. Shop Pooja Items"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E8EDF2] text-sm focus:outline-none focus:border-[#ED3500]"
                    />
                  </div>

                  {/* Button Link */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#163B5C] uppercase tracking-wider block">
                      Button Link URL
                    </label>
                    <input
                      type="text"
                      value={editBannerLink}
                      onChange={(e) => setEditBannerLink(e.target.value)}
                      placeholder="e.g. #products-section"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E8EDF2] text-sm focus:outline-none focus:border-[#ED3500]"
                    />
                  </div>

                  {/* Order */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#163B5C] uppercase tracking-wider block">
                      Display Order
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={editBannerOrder}
                      onChange={(e) => setEditBannerOrder(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E8EDF2] text-sm focus:outline-none focus:border-[#ED3500]"
                    />
                  </div>
                </div>

                {/* Banner Image */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#163B5C] uppercase tracking-wider block">
                    Banner Background Image *
                  </label>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <label className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#FFF8F5] hover:bg-[#ED3500]/10 text-[#ED3500] border border-[#ED3500]/20 text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2 transition-all shrink-0">
                      <Upload className="w-4 h-4" /> Change Image File
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleEditBannerImageChange}
                        className="hidden"
                      />
                    </label>

                    <div className="flex-1 w-full">
                      <input
                        type="text"
                        placeholder="Or image URL / Base64 string"
                        value={editBannerImage}
                        onChange={(e) => {
                          setEditBannerImage(e.target.value);
                          setEditBannerImagePreview(e.target.value);
                        }}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#E8EDF2] text-xs focus:outline-none focus:border-[#ED3500]"
                      />
                    </div>
                  </div>
                </div>

                {editBannerImagePreview && (
                  <div className="p-3 rounded-2xl bg-[#FFFCFB] border border-[#E8EDF2]">
                    <span className="text-[11px] font-bold text-[#64748B] block mb-2 uppercase">Image Preview:</span>
                    <div className="relative aspect-video rounded-xl overflow-hidden border border-[#E8EDF2] bg-slate-100 max-h-48">
                      <img
                        src={editBannerImagePreview}
                        alt="Banner Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-3 flex items-center gap-3 border-t border-[#E8EDF2]">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditBannerModalOpen(false);
                      setEditingBanner(null);
                    }}
                    className="flex-1 py-2.5 rounded-xl border border-[#E8EDF2] text-xs font-bold text-[#64748B] hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingBanner || !editBannerTitle.trim() || !editBannerImage}
                    className="flex-1 py-2.5 rounded-xl bg-[#ED3500] hover:bg-[#D02E00] text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-[#ED3500]/20 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                  >
                    {isSubmittingBanner ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Admin Password Security Challenge Modal */}
      {isSecModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-[#E8EDF2] space-y-6 relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => {
                setIsSecModalOpen(false);
                setSecPasswordInput('');
                setSecPasswordError('');
              }}
              className="absolute top-4 right-4 p-2 text-[#64748B] hover:text-[#163B5C] rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-[#163B5C]">
                Admin Security Lock
              </h3>
              <p className="text-xs text-[#64748B]">
                Enter your <span className="font-bold text-[#163B5C]">Admin Password</span> to unlock access to the {targetTabAfterUnlock === 'pos' ? 'POS Counter' : 'Billing & Accounting'} section.
              </p>
            </div>

            <form onSubmit={handleVerifySecPassword} className="space-y-4">
              {secPasswordError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-bold text-center">
                  {secPasswordError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#163B5C] uppercase tracking-wider block">
                  Admin Password
                </label>
                <input
                  type="password"
                  required
                  autoFocus
                  value={secPasswordInput}
                  onChange={(e) => setSecPasswordInput(e.target.value)}
                  placeholder="Enter Admin Password"
                  className="w-full px-4 py-3 rounded-xl border border-[#E8EDF2] focus:border-[#ED3500] focus:ring-2 focus:ring-[#ED3500]/20 outline-none text-sm font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={secSubmitting}
                className="w-full py-3.5 rounded-xl bg-[#ED3500] hover:bg-[#D02E00] text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-[#ED3500]/25 transition-all flex items-center justify-center gap-2"
              >
                {secSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Unlock Section</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Order Details Comprehensive Modal */}
      {selectedOrderForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#E8EDF2] shadow-2xl max-w-4xl w-full overflow-hidden my-auto max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-5 sm:px-6 py-4 bg-[#FFFCFB] border-b border-[#E8EDF2] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#ED3500]/10 text-[#ED3500] flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base sm:text-lg text-[#163B5C]">
                      Order #{selectedOrderForDetails.orderId}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        selectedOrderForDetails.orderType === 'POS'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {selectedOrderForDetails.orderType === 'POS' ? 'POS Counter' : 'Online Delivery'}
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B]">
                    Placed on {new Date(selectedOrderForDetails.createdAt).toLocaleString('en-US')}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedOrderForDetails(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Close Order Details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 text-xs">
              {/* Quick Status Control Strip */}
              <div className="p-4 rounded-2xl bg-[#FFFCFB] border border-[#E8EDF2] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#163B5C]">Order Fulfillment:</span>
                    {selectedOrderForDetails.status === 'Refunded' || selectedOrderForDetails.status === 'Returned' ? (
                      <span className="px-3 py-1.5 rounded-xl bg-rose-100 text-rose-800 font-extrabold flex items-center gap-1 border border-rose-300">
                        <RotateCcw className="w-3.5 h-3.5" /> Returned / Refunded
                      </span>
                    ) : selectedOrderForDetails.status === 'Completed' ? (
                      <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold flex items-center gap-1.5 border border-emerald-300">
                        <Lock className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Completed</span>
                      </span>
                    ) : (
                      <select
                        value={selectedOrderForDetails.status}
                        onChange={(e) =>
                          handleUpdateOrderStatus(selectedOrderForDetails._id, { status: e.target.value })
                        }
                        className="bg-white border border-[#E8EDF2] rounded-xl px-3 py-1.5 text-xs font-bold text-[#163B5C] focus:outline-none focus:border-[#ED3500]"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                        <option value="Refunded">Refunded</option>
                        <option value="Returned">Returned</option>
                      </select>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#163B5C]">Payment Verification:</span>
                    {selectedOrderForDetails.paymentStatus === 'Refunded' ? (
                      <span className="px-3 py-1.5 rounded-xl bg-rose-100 text-rose-800 font-extrabold flex items-center gap-1 border border-rose-300">
                        <RotateCcw className="w-3.5 h-3.5" /> Full Refund Issued
                      </span>
                    ) : selectedOrderForDetails.paymentStatus === 'Partially_Refunded' ? (
                      <span className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-800 font-extrabold flex items-center gap-1.5 border border-amber-300">
                        <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                        <span>Partially Refunded</span>
                      </span>
                    ) : selectedOrderForDetails.status === 'Cancelled' ? (
                      <span className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 font-extrabold border border-rose-200">
                        Cancelled
                      </span>
                    ) : selectedOrderForDetails.paymentStatus === 'Paid' ? (
                      <span className="px-3 py-1.5 rounded-xl bg-emerald-500 text-white font-extrabold flex items-center gap-1.5 shadow-xs">
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>Paid (Verified)</span>
                      </span>
                    ) : (
                      <select
                        value={selectedOrderForDetails.paymentStatus || 'Pending'}
                        onChange={(e) =>
                          handleUpdateOrderStatus(selectedOrderForDetails._id, { paymentStatus: e.target.value })
                        }
                        className="bg-white border border-[#E8EDF2] rounded-xl px-3 py-1.5 text-xs font-bold text-[#163B5C] focus:outline-none focus:border-[#ED3500]"
                      >
                        <option value="Pending">Pending Verification</option>
                        <option value="Paid">Mark Paid &amp; Verify</option>
                        <option value="Failed">Failed</option>
                      </select>
                    )}
                  </div>

                  {/* Return & Refund Action Button in Details Modal */}
                  {(selectedOrderForDetails.paymentStatus === 'Paid' ||
                    selectedOrderForDetails.status === 'Completed' ||
                    selectedOrderForDetails.status === 'Delivered') &&
                    selectedOrderForDetails.status !== 'Refunded' &&
                    selectedOrderForDetails.status !== 'Returned' &&
                    selectedOrderForDetails.paymentStatus !== 'Refunded' && (
                      <button
                        type="button"
                        onClick={() => handleOpenRefundModal(selectedOrderForDetails)}
                        className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Process Return / Refund</span>
                      </button>
                    )}
                </div>

                {/* Return / Refund Record Banner if already refunded */}
                {(Number(selectedOrderForDetails.refundAmount) > 0 ||
                  selectedOrderForDetails.paymentStatus === 'Refunded' ||
                  selectedOrderForDetails.status === 'Refunded' ||
                  selectedOrderForDetails.status === 'Returned') && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-rose-200/60 flex items-center justify-center shrink-0">
                        <RotateCcw className="w-4 h-4 text-rose-700" />
                      </div>
                      <div>
                        <span className="font-extrabold block text-xs">
                          Sales Return &amp; Refund Applied: -{formatCurrency(selectedOrderForDetails.refundAmount || selectedOrderForDetails.totalAmount)}
                        </span>
                        <span className="text-[11px] text-rose-700 block">
                          Reason: <strong>{selectedOrderForDetails.refundReason || 'Customer return'}</strong>
                          {selectedOrderForDetails.refundDate && ` • ${new Date(selectedOrderForDetails.refundDate).toLocaleDateString()}`}
                        </span>
                      </div>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${selectedOrderForDetails.isRestocked ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-200 text-slate-700'}`}>
                      {selectedOrderForDetails.isRestocked ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-700" />
                          <span>Inventory Restocked</span>
                        </>
                      ) : (
                        <span>No Restock</span>
                      )}
                    </span>
                  </div>
                )}
              </div>

              {/* 2-Column Grid: Customer & Delivery Details vs Items & Financial Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Column 1: Customer & Delivery Details */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="p-4 rounded-2xl bg-white border border-[#E8EDF2] space-y-2.5 shadow-2xs">
                    <h5 className="font-extrabold text-[#163B5C] text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-[#ED3500]" />
                      <span>Customer Contact</span>
                    </h5>
                    <div className="space-y-1 text-slate-600">
                      <p className="font-bold text-sm text-[#163B5C]">{selectedOrderForDetails.customerName || 'Walk-in Guest'}</p>
                      <p className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-[#ED3500] shrink-0" />
                        <a href={`tel:${selectedOrderForDetails.customerPhone}`} className="hover:underline font-medium">
                          {selectedOrderForDetails.customerPhone}
                        </a>
                      </p>
                      {selectedOrderForDetails.customerEmail && (
                        <p className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-[#ED3500] shrink-0" />
                          <a href={`mailto:${selectedOrderForDetails.customerEmail}`} className="hover:underline font-medium">
                            {selectedOrderForDetails.customerEmail}
                          </a>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-[#E8EDF2] space-y-2.5 shadow-2xs">
                    <h5 className="font-extrabold text-[#163B5C] text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-[#ED3500]" />
                      <span>Delivery / Shipping Address</span>
                    </h5>
                    <div className="space-y-1 text-slate-600">
                      <p className="font-medium text-[#163B5C]">
                        {selectedOrderForDetails.shippingAddress || selectedOrderForDetails.streetAddress || 'Direct Storefront Pickup / In-person Delivery'}
                      </p>
                      {(selectedOrderForDetails.city || selectedOrderForDetails.state || selectedOrderForDetails.pincode || selectedOrderForDetails.zipCode) && (
                        <p className="text-slate-500 text-[11px]">
                          {[
                            selectedOrderForDetails.city,
                            selectedOrderForDetails.state,
                            selectedOrderForDetails.pincode || selectedOrderForDetails.zipCode,
                          ]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-[#E8EDF2] space-y-2.5 shadow-2xs">
                    <h5 className="font-extrabold text-[#163B5C] text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-[#ED3500]" />
                      <span>Payment &amp; Transaction Details</span>
                    </h5>
                    <div className="space-y-2 text-slate-600">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Method:</span>
                        <span className="font-bold text-[#163B5C]">{selectedOrderForDetails.paymentMethod}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Status:</span>
                        <span className="font-bold text-[#163B5C]">{selectedOrderForDetails.paymentStatus || 'Pending'}</span>
                      </div>
                      {selectedOrderForDetails.transactionId && (
                        <div className="pt-2 border-t border-slate-100 space-y-1">
                          <span className="text-slate-500 block text-[11px]">Transaction ID / Reference:</span>
                          <code className="bg-emerald-50 text-emerald-800 px-2 py-1 rounded font-mono text-[11px] block border border-emerald-200 break-all select-all">
                            {selectedOrderForDetails.transactionId}
                          </code>
                        </div>
                      )}
                      {selectedOrderForDetails.cashierName && (
                        <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                          <span className="text-slate-500">Cashier:</span>
                          <span className="font-bold text-[#163B5C]">{selectedOrderForDetails.cashierName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Column 2: Ordered Items & Bill Summary */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E8EDF2] space-y-3.5 shadow-2xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <h5 className="font-extrabold text-[#163B5C] text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <Package className="w-4 h-4 text-[#ED3500]" />
                        <span>Ordered Items ({selectedOrderForDetails.items?.length || 0})</span>
                      </h5>
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold text-[11px]">
                        Total Units: {selectedOrderForDetails.items?.reduce((sum, it) => sum + (it.quantity || 1), 0) || 0}
                      </span>
                    </div>

                    <div className="max-h-96 overflow-y-auto pr-1 space-y-2.5">
                      {selectedOrderForDetails.items?.map((item, idx) => {
                        const matchedProduct = products.find(
                          (p) => p._id === item.productId || p.name?.toLowerCase().trim() === item.name?.toLowerCase().trim()
                        );
                        const matchedVariant =
                          (item.variantName && item.variantName.trim().length > 0)
                            ? item.variantName
                            : matchedProduct?.variants?.find((v) => Number(v.price) === Number(item.price))?.name;
                        const itemImage = item.image || matchedProduct?.image;
                        const lineTotal = item.price * item.quantity;
                        const categoryName = matchedProduct?.category;

                        return (
                          <div
                            key={idx}
                            className="p-3 sm:p-3.5 rounded-xl bg-[#FAFBFD] border border-slate-200/80 hover:border-slate-300 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                          >
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              {itemImage ? (
                                <img
                                  src={itemImage}
                                  alt={item.name}
                                  className="w-14 h-14 object-cover rounded-xl bg-white border border-slate-200 shrink-0 shadow-2xs"
                                />
                              ) : (
                                <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                                  <Package className="w-6 h-6" />
                                </div>
                              )}

                              <div className="min-w-0 space-y-1.5 flex-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <p className="font-extrabold text-[#163B5C] text-xs sm:text-sm leading-snug break-words">
                                    {item.name}
                                  </p>
                                  {categoryName && (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 shrink-0">
                                      {categoryName}
                                    </span>
                                  )}
                                </div>

                                {/* Selected Variant Badge */}
                                <div className="flex flex-wrap items-center gap-2">
                                  {matchedVariant ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs">
                                      <Tag className="w-3 h-3 text-purple-600 shrink-0" />
                                      <span>Variant: {matchedVariant}</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                                      Standard Item
                                    </span>
                                  )}

                                  {(item.productId || matchedProduct?._id) && (
                                    <Link
                                      href={`/product/${item.productId || matchedProduct?._id}`}
                                      target="_blank"
                                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#063D29] hover:text-[#ED3500] hover:underline"
                                    >
                                      <span>View Product</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </Link>
                                  )}
                                </div>

                                {/* Price breakdown & tax info */}
                                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-medium">
                                  <span>
                                    Qty: <strong className="text-slate-800 font-bold">{item.quantity}</strong> × {formatCurrency(item.price)} each
                                  </span>
                                  {item.isTaxable !== false && (
                                    <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[10px]">
                                      {item.taxCode ? `Tax: ${item.taxCode}` : item.gst ? `Tax: ${item.gst}%` : 'Taxable'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Line Total */}
                            <div className="sm:text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 flex sm:flex-col justify-between items-center sm:items-end w-full sm:w-auto">
                              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold sm:block">
                                Line Total
                              </span>
                              <span className="font-extrabold text-sm sm:text-base text-[#163B5C]">
                                {formatCurrency(lineTotal)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Financial Breakdown */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <h5 className="font-extrabold text-[#163B5C] text-xs uppercase tracking-wider">
                      Financial Summary
                    </h5>
                    <div className="space-y-1.5 text-slate-600">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span className="font-semibold">{formatCurrency(selectedOrderForDetails.subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sales Tax:</span>
                        <span className="font-semibold">
                          {formatCurrency(
                            selectedOrderForDetails.totalTax !== undefined
                              ? selectedOrderForDetails.totalTax
                              : selectedOrderForDetails.totalGst || 0
                          )}
                        </span>
                      </div>
                      {selectedOrderForDetails.discountAmount ? (
                        <div className="flex justify-between text-emerald-700 font-medium">
                          <span>Discount:</span>
                          <span>-{formatCurrency(selectedOrderForDetails.discountAmount)}</span>
                        </div>
                      ) : null}
                      {Boolean(selectedOrderForDetails.pointsRedeemed && selectedOrderForDetails.pointsRedeemed > 0) && (
                        <div className="flex justify-between text-purple-700 font-medium">
                          <span className="flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                            <span>Claimed Points Discount ({selectedOrderForDetails.pointsRedeemed} pts):</span>
                          </span>
                          <span>-{formatCurrency(selectedOrderForDetails.pointsDiscount || 0)}</span>
                        </div>
                      )}
                      <div className="pt-2 border-t border-slate-200 flex justify-between items-center font-black text-sm text-[#163B5C]">
                        <span>Grand Total:</span>
                        <span className="text-base text-[#ED3500]">
                          {formatCurrency(selectedOrderForDetails.totalAmount)}
                        </span>
                      </div>
                      {Boolean(selectedOrderForDetails.pointsEarned && selectedOrderForDetails.pointsEarned > 0) && (
                        <div className="pt-2 border-t border-slate-200 flex flex-wrap justify-between items-center gap-1 text-xs">
                          <span className="font-semibold text-amber-800 flex items-center gap-1">
                            <Award className="w-3.5 h-3.5 text-amber-600" />
                            <span>Reward Points:</span>
                          </span>
                          {selectedOrderForDetails.pointsAwarded ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-700 shrink-0" />
                              <span>+{selectedOrderForDetails.pointsEarned} pts (Credited upon Delivery)</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-700 shrink-0" />
                              <span>+{selectedOrderForDetails.pointsEarned} pts (Pending Delivery)</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Bottom Footer */}
            <div className="px-5 sm:px-6 py-4 bg-[#FFFCFB] border-t border-[#E8EDF2] flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setReceiptOrder(enrichOrderWithVariants(selectedOrderForDetails));
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <Printer className="w-4 h-4 text-slate-500" />
                <span>Print Receipt / Tax Invoice</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedOrderForDetails(null)}
                className="px-5 py-2.5 rounded-xl bg-[#163B5C] hover:bg-[#112F4A] text-white font-bold text-xs transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return & Refund Modal Dialog */}
      {refundOrderTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-[#E8EDF2] shadow-2xl overflow-hidden animate-fadeIn">
            {/* Header */}
            <div className="p-5 border-b border-[#E8EDF2] flex items-center justify-between bg-[#FFFCFB]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#163B5C]">Process Sales Return &amp; Refund</h3>
                  <p className="text-xs text-[#64748B]">Order #{refundOrderTarget.orderId} • {refundOrderTarget.customerName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRefundOrderTarget(null)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleProcessRefundSubmit} className="p-5 space-y-4 text-xs">
              {refundError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold">
                  {refundError}
                </div>
              )}

              {/* Order Summary Strip */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                <div>
                  <span className="text-[#64748B] block text-[11px]">Original Order Total:</span>
                  <span className="text-base font-black text-[#163B5C]">{formatCurrency(refundOrderTarget.totalAmount)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[#64748B] block text-[11px]">Payment Method:</span>
                  <span className="font-bold text-[#163B5C]">{refundOrderTarget.paymentMethod}</span>
                </div>
              </div>

              {/* Refund Type */}
              <div className="space-y-1.5">
                <label className="font-bold text-[#163B5C] block">Refund Amount Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRefundType('FULL');
                      setCustomRefundAmount(String(refundOrderTarget.totalAmount));
                    }}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                      refundType === 'FULL'
                        ? 'border-rose-600 bg-rose-50 text-rose-700 shadow-2xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Full Refund ({formatCurrency(refundOrderTarget.totalAmount)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRefundType('PARTIAL')}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                      refundType === 'PARTIAL'
                        ? 'border-rose-600 bg-rose-50 text-rose-700 shadow-2xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Custom Partial Refund
                  </button>
                </div>
              </div>

              {/* Custom Refund Amount Input (if partial) */}
              {refundType === 'PARTIAL' && (
                <div className="space-y-1">
                  <label className="font-bold text-[#163B5C] block">Custom Refund Amount ($ USD)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={refundOrderTarget.totalAmount}
                      value={customRefundAmount}
                      onChange={(e) => setCustomRefundAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-2 rounded-xl border border-slate-300 font-bold text-sm text-[#163B5C] focus:outline-none focus:border-rose-500"
                      required
                    />
                  </div>
                  <span className="text-[10.5px] text-[#64748B]">Maximum refundable: {formatCurrency(refundOrderTarget.totalAmount)}</span>
                </div>
              )}

              {/* Refund Reason */}
              <div className="space-y-1">
                <label className="font-bold text-[#163B5C] block">Return / Refund Reason</label>
                <select
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-700 focus:outline-none focus:border-rose-500"
                >
                  <option value="Customer return / refund request">Customer return / refund request</option>
                  <option value="Damaged or degraded flowers on delivery">Damaged or degraded flowers on delivery</option>
                  <option value="Event cancelled or rescheduled">Event cancelled or rescheduled</option>
                  <option value="Incorrect floral garland or variant delivered">Incorrect floral garland or variant delivered</option>
                  <option value="Shipping delay / delivery missed occasion">Shipping delay / delivery missed occasion</option>
                  <option value="Counter POS customer walk-in return">Counter POS customer walk-in return</option>
                  <option value="Other / Merchant courtesy refund">Other / Merchant courtesy refund</option>
                </select>
              </div>

              {/* Additional Notes */}
              <div className="space-y-1">
                <label className="font-bold text-[#163B5C] block">Internal Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={refundNotes}
                  onChange={(e) => setRefundNotes(e.target.value)}
                  placeholder="Additional return notes, tracking number, or customer details..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-700 focus:outline-none focus:border-rose-500 resize-none"
                />
              </div>

              {/* Restock Items Checkbox */}
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={restockReturnedItems}
                  onChange={(e) => setRestockReturnedItems(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <div>
                  <span className="font-extrabold text-[#163B5C] block">Restock Items back into Inventory</span>
                  <span className="text-[10.5px] text-[#64748B] block">
                    Automatically increments the stock count for returned items ({refundOrderTarget.items?.length || 0} product lines).
                  </span>
                </div>
              </label>

              {/* Footer Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRefundOrderTarget(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingRefund}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold flex items-center gap-2 shadow-md shadow-rose-600/20 transition-all disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{isProcessingRefund ? 'Processing Refund...' : 'Confirm Return & Refund'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Instant POS / Tax Receipt Slip Modal */}
      {receiptOrder && (
        <POSReceipt
          order={receiptOrder}
          onClose={() => setReceiptOrder(null)}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-[#E8EDF2] py-4 px-6 text-center text-xs text-[#64748B]">
        Nexus Ecom CMS administration • The Indian Flowers Portal
      </footer>
    </div>
  </div>
  );
}
