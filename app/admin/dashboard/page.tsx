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
  Award,
  Plane,
  Truck,
  CheckCircle2,
  AlertCircle,
  FolderPlus,
  DownloadCloud,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { parseExcelRowsToImportItems, ParsedImportRow } from '@/lib/bulkImportHelpers';
import { IDeliveryMode, DEFAULT_DELIVERY_MODES } from '@/lib/delivery';
import POSCounter from './components/pos/POSCounter';
import POSReceipt from './components/pos/POSReceipt';
import SubscriptionTab from '@/components/licensing/SubscriptionTab';
import GracePeriodBanner from '@/components/licensing/GracePeriodBanner';
import LicenseActivationModal from '@/components/licensing/LicenseActivationModal';
import PolicyManagerTab from '@/components/admin/PolicyManagerTab';
import CustomersTab from '@/components/admin/CustomersTab';
import ReportsTab from '@/components/admin/ReportsTab';
import MailManagerTab from '@/components/admin/MailManagerTab';
import WordPressImportModal from '@/components/admin/WordPressImportModal';
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
  subcategory?: string;
  variants?: ProductVariant[];
  createdAt: string;
}

interface SubcategoryItem {
  _id?: string;
  name: string;
  slug?: string;
  image?: string;
  order?: number;
}

interface CategoryItem {
  _id: string;
  name: string;
  slug?: string;
  image?: string;
  order?: number;
  showOnHome?: boolean;
  subcategories?: SubcategoryItem[];
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
  deliveryDate?: string;
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
    | 'mail'
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
          'mail',
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
    subcategory: '',
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
  const [newCatSubcategories, setNewCatSubcategories] = useState<string[]>([]);
  const [newSubcatInput, setNewSubcatInput] = useState('');
  const [editCatSubcategories, setEditCatSubcategories] = useState<string[]>([]);
  const [editSubcatInput, setEditSubcatInput] = useState('');
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatImage, setEditCatImage] = useState('');
  const [editCatImagePreview, setEditCatImagePreview] = useState('');
  const [newCatShowOnHome, setNewCatShowOnHome] = useState(true);
  const [editCatShowOnHome, setEditCatShowOnHome] = useState(true);
  const [togglingHomeCatId, setTogglingHomeCatId] = useState<string | null>(null);
  const [isEditCatModalOpen, setIsEditCatModalOpen] = useState(false);

  // Subcategory management state
  const [selectedCatForSubcat, setSelectedCatForSubcat] = useState('');
  const [newSubcatName, setNewSubcatName] = useState('');
  const [isSubmittingSubcat, setIsSubmittingSubcat] = useState(false);
  const [subcatSuccessMsg, setSubcatSuccessMsg] = useState('');
  const [subcatError, setSubcatError] = useState('');
  const [inlineSubcatCatId, setInlineSubcatCatId] = useState<string | null>(null);
  const [inlineSubcatName, setInlineSubcatName] = useState('');
  const [isSubmittingInlineSubcat, setIsSubmittingInlineSubcat] = useState(false);

  // Bulk Import state (Solution 1: Excel + Multi-Image Dropzone + Separate Variants)
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importRawRows, setImportRawRows] = useState<any[]>([]);
  const [importEnrichedRows, setImportEnrichedRows] = useState<ParsedImportRow[]>([]);
  const [importImageFiles, setImportImageFiles] = useState<File[]>([]);
  const [importProgressStatus, setImportProgressStatus] = useState<string>('');
  const [importFilterTab, setImportFilterTab] = useState<'all' | 'new' | 'update' | 'matched' | 'unmatched'>('all');
  const [isUploadingImport, setIsUploadingImport] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
    count?: number;
    created?: number;
    updated?: number;
    errors?: string[];
  } | null>(null);


  // WordPress Migration Modal State
  const [isWpImportModalOpen, setIsWpImportModalOpen] = useState(false);

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
    logoDataUrl: '/the-indian-flowers-logo.webp',
    // Loyalty Points Program Settings
    loyaltyEnabled: true,
    loyaltySpendAmount: 100,
    loyaltyPointsEarned: 10,
    loyaltyRedemptionEnabled: true,
    loyaltyPointsPerDollar: 10,
    loyaltyMinPointsToRedeem: 10,
    loyaltyMaxRedemptionPercent: 100,
    deliveryModes: DEFAULT_DELIVERY_MODES,
    // FedEx Web Integration Solutions (WIS) Configuration Defaults
    fedexEnabled: true,
    fedexAccountNumber: '695333510',
    fedexProductionMeterNumber: '256593981',
    fedexTestMeterNumber: '256456943',
    fedexAuthKey: 'odhEUIQgzxYnhfOR',
    fedexSecretKey: '',
    fedexEnvironment: 'production',
    fedexOriginZip: '92336',
    fedexCompanyName: 'Malar Traders',
    fedexContactName: 'George Joseph',
    fedexEmail: 'indianflowers2020@gmail.com',
  });

  // FedEx Live Rate Tester State
  const [testZipCode, setTestZipCode] = useState('90210');
  const [testRateResult, setTestRateResult] = useState<any>(null);
  const [testingRate, setTestingRate] = useState(false);
  const [testRateError, setTestRateError] = useState('');

  // Delivery Modes Modal State
  const [isDeliveryModeModalOpen, setIsDeliveryModeModalOpen] = useState(false);
  const [editingDeliveryMode, setEditingDeliveryMode] = useState<IDeliveryMode | null>(null);
  const [deliveryModeForm, setDeliveryModeForm] = useState<IDeliveryMode>({
    id: '',
    name: '',
    type: 'shipping',
    price: 0,
    description: '',
    pickupLocation: '',
    estimatedDays: '',
    active: true,
    order: 0,
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

  // Fetch Customer Inbox Statistics for Sidebar
  const [inboxNewCount, setInboxNewCount] = useState<number>(0);
  const [inboxTotalCount, setInboxTotalCount] = useState<number>(0);

  const fetchInboxStats = async () => {
    try {
      const res = await fetch(`/api/admin/mail/inbox?t=${Date.now()}`);
      const data = await res.json();
      if (data.success && data.stats) {
        setInboxNewCount(data.stats.new || 0);
        setInboxTotalCount(data.stats.totalAll || 0);
      }
    } catch (err) {
      console.error('Failed to fetch inbox stats:', err);
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
        fetchInboxStats(),
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
        if (data.data.length > 0 && !selectedCatForSubcat) {
          setSelectedCatForSubcat(data.data[0]._id);
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
          logoDataUrl: data.data.logoDataUrl || '/the-indian-flowers-logo.webp',
          loyaltyEnabled: data.data.loyaltyEnabled !== false,
          loyaltySpendAmount: data.data.loyaltySpendAmount ?? 100,
          loyaltyPointsEarned: data.data.loyaltyPointsEarned ?? 10,
          loyaltyRedemptionEnabled: data.data.loyaltyRedemptionEnabled !== false,
          loyaltyPointsPerDollar: data.data.loyaltyPointsPerDollar ?? 10,
          loyaltyMinPointsToRedeem: data.data.loyaltyMinPointsToRedeem ?? 10,
          loyaltyMaxRedemptionPercent: data.data.loyaltyMaxRedemptionPercent ?? 100,
          deliveryModes: Array.isArray(data.data.deliveryModes) && data.data.deliveryModes.length > 0
            ? data.data.deliveryModes
            : DEFAULT_DELIVERY_MODES,
          fedexEnabled: data.data.fedexEnabled !== false,
          fedexAccountNumber: data.data.fedexAccountNumber || '695333510',
          fedexProductionMeterNumber: data.data.fedexProductionMeterNumber || '256593981',
          fedexTestMeterNumber: data.data.fedexTestMeterNumber || '256456943',
          fedexAuthKey: data.data.fedexAuthKey || 'odhEUIQgzxYnhfOR',
          fedexSecretKey: data.data.fedexSecretKey || '',
          fedexEnvironment: data.data.fedexEnvironment || 'production',
          fedexOriginZip: data.data.fedexOriginZip || '92336',
          fedexCompanyName: data.data.fedexCompanyName || 'Malar Traders',
          fedexContactName: data.data.fedexContactName || 'George Joseph',
          fedexEmail: data.data.fedexEmail || 'indianflowers2020@gmail.com',
        });
      }
    } catch (err) {
      console.error('Failed to fetch settings', err);
    } finally {
      setLoadingSettings(false);
    }
  };

  // Delivery Mode Handlers
  const handleOpenAddDeliveryMode = () => {
    setEditingDeliveryMode(null);
    setDeliveryModeForm({
      id: `dm-${Date.now()}`,
      name: '',
      type: 'shipping',
      price: 0,
      description: '',
      pickupLocation: '',
      estimatedDays: '',
      active: true,
      order: (paymentSettings.deliveryModes?.length || 0) + 1,
    });
    setIsDeliveryModeModalOpen(true);
  };

  const handleOpenEditDeliveryMode = (mode: IDeliveryMode) => {
    setEditingDeliveryMode(mode);
    setDeliveryModeForm({ ...mode });
    setIsDeliveryModeModalOpen(true);
  };

  const handleSaveDeliveryModeModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryModeForm.name.trim()) return;

    const currentModes = [...(paymentSettings.deliveryModes || DEFAULT_DELIVERY_MODES)];
    const existingIndex = currentModes.findIndex((m) => m.id === deliveryModeForm.id);

    if (existingIndex >= 0) {
      currentModes[existingIndex] = { ...deliveryModeForm };
    } else {
      currentModes.push({ ...deliveryModeForm });
    }

    setPaymentSettings({ ...paymentSettings, deliveryModes: currentModes });
    setIsDeliveryModeModalOpen(false);
  };

  const handleDeleteDeliveryMode = (id: string) => {
    if (!confirm('Are you sure you want to delete this delivery mode?')) return;
    const filtered = (paymentSettings.deliveryModes || DEFAULT_DELIVERY_MODES).filter((m) => m.id !== id);
    setPaymentSettings({ ...paymentSettings, deliveryModes: filtered });
  };

  const handleToggleDeliveryModeActive = (id: string) => {
    const updated = (paymentSettings.deliveryModes || DEFAULT_DELIVERY_MODES).map((m) =>
      m.id === id ? { ...m, active: !m.active } : m
    );
    setPaymentSettings({ ...paymentSettings, deliveryModes: updated });
  };

  const handleResetDeliveryModes = () => {
    if (!confirm('Reset all delivery modes back to standard defaults (Southwest Air Cargo, FedEx, and 7 regional local pickups)?')) return;
    setPaymentSettings({ ...paymentSettings, deliveryModes: DEFAULT_DELIVERY_MODES });
  };

  const handleTestFedExRate = async () => {
    if (!testZipCode.trim()) return;
    setTestingRate(true);
    setTestRateError('');
    setTestRateResult(null);
    try {
      const res = await fetch('/api/shipping/fedex-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: {
            zipCode: testZipCode.trim(),
          },
          items: [{ name: 'Wedding Jasmine Garland (Sample)', quantity: 2, price: 45 }],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestRateResult(data);
      } else {
        setTestRateError(data.message || 'Failed to calculate rate');
      }
    } catch (err: any) {
      setTestRateError(err.message || 'Error querying rate calculation');
    } finally {
      setTestingRate(false);
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

  // Helper to upload image file to disk storage instead of storing Base64 in MongoDB
  const uploadAdminImage = async (file: File, folder: string = 'products'): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Upload failed');
    }
    return data.url;
  };

  // Handle Banner Image File Selection with Pure Path Upload (No Base64 in DB)
  const handleBannerImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const previewUrl = URL.createObjectURL(file);
        setBannerImagePreview(previewUrl);
        const uploadedUrl = await uploadAdminImage(file, 'banners');
        setNewBannerImage(uploadedUrl);
        setBannerImagePreview(uploadedUrl);
      } catch (err: any) {
        console.error('Banner image upload failed', err);
        alert(err.message || 'Banner upload failed');
      }
    }
  };

  const handleEditBannerImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const previewUrl = URL.createObjectURL(file);
        setEditBannerImagePreview(previewUrl);
        const uploadedUrl = await uploadAdminImage(file, 'banners');
        setEditBannerImage(uploadedUrl);
        setEditBannerImagePreview(uploadedUrl);
      } catch (err: any) {
        console.error('Edit banner image upload failed', err);
        alert(err.message || 'Banner upload failed');
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
          fetchInboxStats();
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

  // Handle Product Image Upload with Pure Path Storage (No Base64 in DB)
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const previewUrl = URL.createObjectURL(file);
        setImagePreview(previewUrl);
        const uploadedUrl = await uploadAdminImage(file, 'products');
        setProductForm((prev) => ({ ...prev, image: uploadedUrl }));
        setImagePreview(uploadedUrl);
      } catch (err: any) {
        console.error('Product image upload failed', err);
        alert(err.message || 'Product image upload failed');
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
      subcategory: product.subcategory || '',
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
      subcategory: '',
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
          subcategory: productForm.subcategory || '',
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

  // Category Image File Upload Handlers with Pure Path Storage (No Base64 in DB)
  const handleNewCatImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const previewUrl = URL.createObjectURL(file);
        setNewCatImagePreview(previewUrl);
        const uploadedUrl = await uploadAdminImage(file, 'categories');
        setNewCatImage(uploadedUrl);
        setNewCatImagePreview(uploadedUrl);
      } catch (err: any) {
        console.error('Category image upload failed', err);
        alert(err.message || 'Category image upload failed');
      }
    }
  };

  const handleEditCatImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const previewUrl = URL.createObjectURL(file);
        setEditCatImagePreview(previewUrl);
        const uploadedUrl = await uploadAdminImage(file, 'categories');
        setEditCatImage(uploadedUrl);
        setEditCatImagePreview(uploadedUrl);
      } catch (err: any) {
        console.error('Edit category image upload failed', err);
        alert(err.message || 'Edit category image upload failed');
      }
    }
  };

  const handleOpenEditCategory = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setEditCatName(cat.name);
    setEditCatImage(cat.image || '');
    setEditCatImagePreview(cat.image || '');
    setEditCatShowOnHome(cat.showOnHome !== false);
    setIsEditCatModalOpen(true);
  };

  // Toggle Category Homepage Status
  const handleToggleCategoryHome = async (cat: CategoryItem) => {
    const nextVal = !(cat.showOnHome !== false);
    setTogglingHomeCatId(cat._id);
    // Optimistic UI update
    setCategories((prev) =>
      prev.map((c) => (c._id === cat._id ? { ...c, showOnHome: nextVal } : c))
    );
    try {
      const res = await fetch(`/api/categories/${cat._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showOnHome: nextVal }),
      });
      const data = await res.json();
      if (!data.success) {
        // Rollback
        setCategories((prev) =>
          prev.map((c) => (c._id === cat._id ? { ...c, showOnHome: cat.showOnHome } : c))
        );
        alert(data.message || 'Failed to update homepage status');
      }
    } catch (err: any) {
      setCategories((prev) =>
        prev.map((c) => (c._id === cat._id ? { ...c, showOnHome: cat.showOnHome } : c))
      );
      alert(err.message || 'Error updating homepage status');
    } finally {
      setTogglingHomeCatId(null);
    }
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
          showOnHome: newCatShowOnHome,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewCatName('');
        setNewCatImage('');
        setNewCatImagePreview('');
        setNewCatShowOnHome(true);
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
          showOnHome: editCatShowOnHome,
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

    // Subcategory Actions
  const handleAddSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubcatError('');
    setSubcatSuccessMsg('');
    const targetCatId = selectedCatForSubcat || (categories.length > 0 ? categories[0]._id : '');
    if (!targetCatId || !newSubcatName.trim()) {
      setSubcatError('Please select a category and enter a subcategory name.');
      return;
    }

    try {
      setIsSubmittingSubcat(true);
      const res = await fetch(`/api/categories/${targetCatId}/subcategories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSubcatName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setNewSubcatName('');
        setSubcatSuccessMsg('Subcategory added successfully!');
        setTimeout(() => setSubcatSuccessMsg(''), 4000);
        await fetchCategories();
      } else {
        setSubcatError(data.message || 'Failed to add subcategory');
      }
    } catch (err: any) {
      setSubcatError(err.message || 'Error adding subcategory');
    } finally {
      setIsSubmittingSubcat(false);
    }
  };

  const handleAddInlineSubcategory = async (catId: string) => {
    if (!inlineSubcatName.trim()) return;
    try {
      setIsSubmittingInlineSubcat(true);
      const res = await fetch(`/api/categories/${catId}/subcategories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: inlineSubcatName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setInlineSubcatName('');
        setInlineSubcatCatId(null);
        await fetchCategories();
      } else {
        alert(data.message || 'Failed to add subcategory');
      }
    } catch (err: any) {
      alert(err.message || 'Error adding subcategory');
    } finally {
      setIsSubmittingInlineSubcat(false);
    }
  };

  const handleDeleteSubcategory = async (catId: string, subId?: string, subName?: string) => {
    if (!window.confirm(`Delete subcategory "${subName}" from this category?`)) return;
    try {
      const query = subId ? `subId=${encodeURIComponent(subId)}` : `name=${encodeURIComponent(subName || '')}`;
      const res = await fetch(`/api/categories/${catId}/subcategories?${query}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        await fetchCategories();
      } else {
        alert(data.message || 'Failed to delete subcategory');
      }
    } catch (err) {
      console.error('Delete subcategory error', err);
      alert('Error deleting subcategory');
    }
  };

  // Bulk Import Handlers (Solution 1: Excel + Multi-Image Dropzone + Separate Variants)
  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    setImportResult(null);

    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: 'array' });
      const sheetName = wb.SheetNames.includes('Products') ? 'Products' : wb.SheetNames[0];
      if (sheetName && wb.Sheets[sheetName]) {
        const rows = XLSX.utils.sheet_to_json<any>(wb.Sheets[sheetName], { defval: '' });
        setImportRawRows(rows);
        const parsed = parseExcelRowsToImportItems(rows, products, importImageFiles);
        setImportEnrichedRows(parsed);
      }
    } catch (err) {
      console.error('Failed to parse Excel preview:', err);
    }
  };

  const handleImportImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Combine with existing image files without duplicate filenames
    const existingNames = new Set(importImageFiles.map((f) => f.name.toLowerCase()));
    const newFiles = [...importImageFiles];
    files.forEach((f) => {
      if (!existingNames.has(f.name.toLowerCase())) {
        newFiles.push(f);
      }
    });

    setImportImageFiles(newFiles);
    if (importRawRows.length > 0) {
      const parsed = parseExcelRowsToImportItems(importRawRows, products, newFiles);
      setImportEnrichedRows(parsed);
    }
  };

  const handleClearImportImages = () => {
    setImportImageFiles([]);
    if (importRawRows.length > 0) {
      const parsed = parseExcelRowsToImportItems(importRawRows, products, []);
      setImportEnrichedRows(parsed);
    }
  };

  const handleExecuteBulkImport = async () => {
    if (importEnrichedRows.length === 0 && !importFile) return;
    try {
      setIsUploadingImport(true);
      setImportResult(null);
      setImportProgressStatus('Preparing product data...');

      const rowsToProcess = importEnrichedRows;
      const imagesToCompress = rowsToProcess.filter((r) => r.matchedImageFile);
      let compressedCount = 0;

      const payloadRows = [];

      for (let i = 0; i < rowsToProcess.length; i++) {
        const item = rowsToProcess[i];
        let finalImageBase64 = '';

        if (item.matchedImageFile) {
          compressedCount++;
          setImportProgressStatus(
            `Compressing images on device (${compressedCount}/${imagesToCompress.length}) — ${item.matchedImageFile.name}...`
          );
          try {
            finalImageBase64 = await compressImage(item.matchedImageFile, 800, 0.8);
          } catch (compErr) {
            console.error('Image compression failed for', item.matchedImageFile.name, compErr);
          }
        }

        payloadRows.push({
          name: item.name,
          description: item.description,
          category: item.category,
          subcategory: item.subcategory,
          price: item.price,
          mrp: item.mrp,
          quantity: item.quantity,
          gst: item.gst,
          image: finalImageBase64 || item.imageFilename,
          variants: item.variants,
        });
      }

      setImportProgressStatus(`Saving ${payloadRows.length} products to database...`);

      const res = await fetch('/api/products/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: payloadRows }),
      });

      const data = await res.json();
      setImportResult(data);
      if (data.success) {
        await fetchProducts();
        await fetchCategories();
      }
    } catch (err: any) {
      setImportResult({
        success: false,
        message: err.message || 'Bulk import failed due to network error.',
      });
    } finally {
      setIsUploadingImport(false);
      setImportProgressStatus('');
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
    } else if (orderStatusFilter === 'Delivered') {
      if (o.status !== 'Delivered' && o.status !== 'Completed') return false;
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
      p.subcategory?.toLowerCase().includes(q) ||
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
    | 'reports'
    | 'mail';

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
          id: 'mail',
          label: 'Mail & Communications',
          icon: Mail,
          count: inboxTotalCount > 0 ? inboxTotalCount : undefined,
          badge: inboxNewCount > 0 ? `${inboxNewCount} new` : undefined,
          badgeColor: 'bg-emerald-600 text-white',
          action: () => setActiveTab('mail'),
        },
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
          icon: Users,
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
    mail: {
      label: 'Mail & Communications Center',
      desc: 'Centralized customer inbox, MSG91 email logs, templates, and gateway settings',
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
                  src="/the-indian-flowers-emblem.webp"
                  alt="The Indian Flowers logo"
                  className="w-9 h-9 object-contain rounded-xl border border-[#E8EDF2]"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/the-indian-flowers-emblem.png';
                  }}
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="font-extrabold text-sm text-[#0B3B24]">The Indian Flowers</h2>
                    <span className="text-[9px] font-black uppercase tracking-wider bg-slate-900 text-emerald-400 px-1.5 py-0.5 rounded shadow-2xs">
                      NEXUS
                    </span>
                  </div>
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
              src="/the-indian-flowers-emblem.webp"
              alt="The Indian Flowers admin logo"
              className="w-10 h-10 object-contain rounded-xl shadow-xs border border-[#E8EDF2] shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/the-indian-flowers-emblem.png';
              }}
            />
            {!isSidebarCollapsed && (
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="font-extrabold text-sm text-[#0B3B24] truncate">
                    The Indian Flowers
                  </h2>

                </div>
                <span className="text-[11px] text-[#64748B] block truncate">
                  Storefront Management
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

          {/* Permanent NEXUS ECOMM CMS Badge Slot */}
          <div
            id="nexus-platform-badge-slot"
            className="pt-2 border-t border-slate-200/80 flex items-center justify-center min-h-[32px]"
          />
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
              <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
                <a
                  href="/api/products/template"
                  download="IndianFlowers_Products_Bulk_Import_Template.xlsx"
                  className="px-3.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 shrink-0"
                  title="Download sample Excel (.xlsx) file with categories, subcategories, instructions, and sample products"
                >
                  <Download className="w-4 h-4 text-emerald-700" />
                  <span>Excel Template</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setImportFile(null);
                    setImportRawRows([]);
                    setImportEnrichedRows([]);
                    setImportImageFiles([]);
                    setImportProgressStatus('');
                    setImportFilterTab('all');
                    setImportResult(null);
                    setIsBulkImportModalOpen(true);
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-[#0B3B24] hover:bg-[#134633] text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all active:scale-95 shrink-0"
                  title="Bulk Import products via latest Excel (.xlsx) format"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
                  <span>Bulk Import (.xlsx)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsWpImportModalOpen(true)}
                  className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-[#0B3B24] to-[#1C563F] hover:from-[#134633] hover:to-[#2F6B4F] text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all active:scale-95 shrink-0 border border-emerald-400/30"
                  title="Import all 1,946 products directly from live WordPress/WooCommerce site with exact slugs and zero SEO loss"
                >
                  <DownloadCloud className="w-4 h-4 text-emerald-300" />
                  <span>Import from Old WordPress</span>
                </button>
                <button
                  onClick={openAddProductModal}
                  className="px-4 py-2.5 rounded-xl bg-[#ED3500] hover:bg-[#D02E00] text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all active:scale-95 shrink-0"
                >
                  <Plus className="w-4 h-4" /> Add Product
                </button>
              </div>
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
                  type="button"
                  onClick={() => setIsWpImportModalOpen(true)}
                  className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-[#0B3B24] to-[#1C563F] hover:from-[#134633] hover:to-[#2F6B4F] text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all active:scale-95 shrink-0 border border-emerald-400/30"
                  title="Import all 1,946 products directly from live WordPress/WooCommerce site with exact slugs and zero SEO loss"
                >
                  <DownloadCloud className="w-4 h-4 text-emerald-300" />
                  <span>Import from Old WordPress</span>
                </button>
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
                          <td className="py-4 px-6 text-xs font-semibold text-[#163B5C]">
                            <div>{p.category}</div>
                            {p.subcategory && (
                              <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold text-[10px] border border-emerald-200">
                                {p.subcategory}
                              </span>
                            )}
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
            {/* Top Grid: Create Category & Add Subcategory */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Card 1: Create Category Card */}
              <div className="bg-white rounded-2xl border border-[#E8EDF2] p-6 space-y-4 shadow-sm">
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

                  {/* Show on Homepage Toggle */}
                  <label className="flex items-center justify-between p-3 rounded-xl border border-[#E8EDF2] bg-[#FAFDFB] hover:bg-emerald-50/40 cursor-pointer transition-colors">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-[#163B5C] block">
                        Show in Homepage Section
                      </span>
                      <span className="text-[11px] text-[#64748B] block">
                        Enable to feature this category and its product carousel on the store homepage.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={newCatShowOnHome}
                      onChange={(e) => setNewCatShowOnHome(e.target.checked)}
                      className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                    />
                  </label>

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

              {/* Card 2: Add Subcategory Card */}
              <div className="bg-white rounded-2xl border border-[#E8EDF2] p-6 space-y-4 shadow-sm">
                <div>
                  <h3 className="text-lg font-bold text-[#163B5C] flex items-center gap-2">
                    <FolderPlus className="w-5 h-5 text-emerald-700" />
                    <span>Add Subcategory</span>
                  </h3>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Attach subcategories to any parent category (e.g. Rose Petal Garlands under Indian Wedding Garlands).
                  </p>
                </div>

                {subcatSuccessMsg && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{subcatSuccessMsg}</span>
                  </div>
                )}

                {subcatError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                    {subcatError}
                  </div>
                )}

                <form onSubmit={handleAddSubcategory} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#163B5C] uppercase tracking-wider block">
                      Target Parent Category *
                    </label>
                    <select
                      value={selectedCatForSubcat || (categories[0]?._id ?? '')}
                      onChange={(e) => setSelectedCatForSubcat(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E8EDF2] text-sm focus:outline-none focus:border-emerald-600 bg-white"
                    >
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {cat.name} ({cat.subcategories?.length || 0} subcategories)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#163B5C] uppercase tracking-wider block">
                      Subcategory Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rose Petal Garlands, Button Rose Garlands..."
                      value={newSubcatName}
                      onChange={(e) => setNewSubcatName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E8EDF2] text-sm focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div className="pt-1 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmittingSubcat || !newSubcatName.trim()}
                      className="px-6 py-2.5 rounded-xl bg-[#0B3B24] hover:bg-[#134633] text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {isSubmittingSubcat ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Add Subcategory
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Category List with Subcategories Badges */}
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
              <div className="bg-white rounded-2xl border border-[#E8EDF2] overflow-hidden shadow-sm">
                <div className="p-4 bg-[#FFFCFB] border-b border-[#E8EDF2] font-bold text-xs text-[#64748B] uppercase tracking-wider grid grid-cols-12 gap-3 items-center">
                  <span className="col-span-2 sm:col-span-1">Icon</span>
                  <span className="col-span-4 sm:col-span-3">Category Name</span>
                  <span className="col-span-3 sm:col-span-4">Subcategories</span>
                  <span className="col-span-2 sm:col-span-2 text-center">Home Showcase</span>
                  <span className="col-span-1 sm:col-span-2 text-right">Actions</span>
                </div>
                <div className="divide-y divide-[#E8EDF2]">
                  {categories.map((cat) => (
                    <div key={cat._id} className="p-4 grid grid-cols-12 gap-3 items-center text-sm font-semibold text-[#163B5C] hover:bg-slate-50/50 transition-colors">
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
                      <div className="col-span-4 sm:col-span-3 flex flex-col justify-center">
                        <span className="font-bold text-gray-900 text-xs sm:text-sm">{cat.name}</span>
                        <span className="text-[10px] text-gray-400 font-normal">
                          Added {new Date(cat.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Subcategories Badges */}
                      <div className="col-span-3 sm:col-span-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {cat.subcategories && cat.subcategories.length > 0 ? (
                            cat.subcategories.map((sub) => (
                              <span
                                key={sub._id || sub.name}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200 shadow-2xs"
                              >
                                <span>{sub.name}</span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSubcategory(cat._id, sub._id, sub.name)}
                                  className="w-3.5 h-3.5 rounded-full hover:bg-emerald-200 flex items-center justify-center text-emerald-800 hover:text-rose-700 transition-colors"
                                  title="Remove subcategory"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-[#94A3B8] italic">No subcategories</span>
                          )}

                          {/* Inline Subcategory Quick Add */}
                          {inlineSubcatCatId === cat._id ? (
                            <div className="inline-flex items-center gap-1 bg-white border border-emerald-400 rounded-full pl-2 pr-1 py-0.5 shadow-xs">
                              <input
                                type="text"
                                autoFocus
                                placeholder="Subcategory..."
                                value={inlineSubcatName}
                                onChange={(e) => setInlineSubcatName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddInlineSubcategory(cat._id);
                                  } else if (e.key === 'Escape') {
                                    setInlineSubcatCatId(null);
                                    setInlineSubcatName('');
                                  }
                                }}
                                className="w-28 text-xs font-medium text-emerald-950 focus:outline-none"
                              />
                              <button
                                type="button"
                                disabled={isSubmittingInlineSubcat || !inlineSubcatName.trim()}
                                onClick={() => handleAddInlineSubcategory(cat._id)}
                                className="p-1 rounded-full bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-40"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setInlineSubcatCatId(null);
                                  setInlineSubcatName('');
                                }}
                                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setInlineSubcatCatId(cat._id);
                                setInlineSubcatName('');
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50/60 hover:bg-emerald-100 border border-dashed border-emerald-300 px-2.5 py-0.5 rounded-full transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Subcategory</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Home Showcase Toggle */}
                      <div className="col-span-2 sm:col-span-2 flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => handleToggleCategoryHome(cat)}
                          disabled={togglingHomeCatId === cat._id}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                            cat.showOnHome !== false
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 shadow-2xs'
                              : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                          }`}
                          title={cat.showOnHome !== false ? 'Featured on Homepage (Click to Hide)' : 'Hidden from Homepage (Click to Show)'}
                        >
                          <span className={`w-2 h-2 rounded-full ${cat.showOnHome !== false ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                          <span className="hidden sm:inline">
                            {cat.showOnHome !== false ? 'On Home' : 'Hidden'}
                          </span>
                        </button>
                      </div>

                      {/* Actions */}
                      <div className="col-span-1 sm:col-span-2 flex items-center justify-end gap-1.5">
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
                    {
                      id: 'Delivered',
                      label: 'Delivered (Completed)',
                      count: orders.filter((o) => o.status === 'Delivered' || o.status === 'Completed').length,
                    },
                    { id: 'Cancelled', label: 'Cancelled', count: orders.filter((o) => o.status === 'Cancelled').length },
                    {
                      id: 'Refunded',
                      label: 'Returned / Refunded',
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
                                {order.deliveryDate && (
                                  <div className="pt-0.5">
                                    <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                      <Calendar className="w-3 h-3 text-emerald-600 shrink-0" />
                                      <span>For: {order.deliveryDate}</span>
                                    </span>
                                  </div>
                                )}
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
                              {order.status === 'Completed' || order.status === 'Delivered' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-extrabold text-xs border border-emerald-200">
                                  <Check className="w-3.5 h-3.5 text-emerald-700" /> Delivered (Completed)
                                </span>
                              ) : order.status === 'Cancelled' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 font-extrabold text-xs">
                                  <X className="w-3.5 h-3.5" /> Cancelled
                                </span>
                              ) : order.status === 'Refunded' || order.status === 'Returned' || order.paymentStatus === 'Refunded' ? (
                                <span
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-extrabold text-xs"
                                  title={order.refundReason || 'Order Returned & Refunded'}
                                >
                                  <RotateCcw className="w-3.5 h-3.5" /> Returned / Refunded
                                </span>
                              ) : (
                                <select
                                  value={order.status}
                                  onChange={(e) =>
                                    handleUpdateOrderStatus(order._id, { status: e.target.value })
                                  }
                                  className="bg-[#FFFCFB] border border-[#E8EDF2] rounded-lg px-2.5 py-1 text-xs font-bold text-[#163B5C] focus:outline-none focus:border-[#ED3500]"
                                >
                                  <option value="Pending">Pending (Awaiting Pack)</option>
                                  <option value="Processing">Processing (Floral Prep)</option>
                                  <option value="Delivered">Delivered (Completed)</option>
                                  <option value="Cancelled">Cancelled</option>
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
                          src={paymentSettings.logoDataUrl || '/the-indian-flowers-logo.webp'}
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
                          placeholder="/the-indian-flowers-logo.webp"
                          className="mt-1 w-full rounded-xl border border-[#E8EDF2] bg-white px-3 py-2 text-xs font-medium outline-none focus:border-[#ED3500]"
                        />
                        <p className="text-[11px] text-[#64748B] mt-0.5">
                          Default: <code className="text-emerald-700">/the-indian-flowers-logo.webp</code> (renders high-resolution vector emblem on print).
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

                {/* Delivery Modes & Shipping Methods Configuration Card */}
                <div className="p-5 sm:p-6 rounded-2xl border border-[#E8EDF2] bg-[#FFFCFB] space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8EDF2]">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center font-black">
                        <Truck className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-[#163B5C]">Delivery Modes &amp; Shipping Rates</h3>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {(paymentSettings.deliveryModes || DEFAULT_DELIVERY_MODES).filter((m) => m.active !== false).length} Active
                          </span>
                        </div>
                        <p className="text-xs text-[#64748B] mt-0.5">
                          Manage air cargo, priority overnight rates, and regional in-person pickup hubs configured for cart and checkout.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={handleResetDeliveryModes}
                        className="px-3 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Reset to defaults"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset Defaults</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleOpenAddDeliveryMode}
                        className="px-4 py-2 rounded-xl bg-[#0B3B24] hover:bg-[#134633] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Delivery Mode</span>
                      </button>
                    </div>
                  </div>

                  {/* Delivery Modes List */}
                  <div className="space-y-3">
                    {(paymentSettings.deliveryModes || DEFAULT_DELIVERY_MODES).map((mode) => {
                      const isPickup = mode.type === 'pickup';
                      const isAir = mode.name.toLowerCase().includes('air') || mode.name.toLowerCase().includes('south');

                      return (
                        <div
                          key={mode.id}
                          className={`p-4 rounded-xl border transition-all ${
                            mode.active
                              ? 'border-gray-200 bg-white hover:border-[#0B3B24]/40 shadow-xs'
                              : 'border-gray-200 bg-gray-50/70 opacity-60'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                isPickup
                                  ? 'bg-amber-100 text-amber-800'
                                  : isAir
                                    ? 'bg-sky-100 text-sky-800'
                                    : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {isPickup ? (
                                  <MapPin className="w-4 h-4" />
                                ) : isAir ? (
                                  <Plane className="w-4 h-4" />
                                ) : (
                                  <Truck className="w-4 h-4" />
                                )}
                              </div>

                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-bold text-sm text-[#163B5C]">{mode.name}</span>
                                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                    isPickup
                                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                      : 'bg-sky-50 text-sky-800 border border-sky-200'
                                  }`}>
                                    {isPickup ? 'Local Pickup' : 'Express Shipping'}
                                  </span>
                                  {mode.estimatedDays && (
                                    <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                                      {mode.estimatedDays}
                                    </span>
                                  )}
                                </div>

                                {mode.description && (
                                  <p className={`text-xs mt-1 ${isPickup ? 'text-amber-800 font-medium' : 'text-gray-500'}`}>
                                    {mode.description}
                                  </p>
                                )}

                                {isPickup && mode.pickupLocation && (
                                  <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1 font-medium">
                                    <MapPin className="w-3 h-3 text-amber-600" />
                                    <span>Pickup Location: {mode.pickupLocation}</span>
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                              <div className="text-right">
                                <span className="text-sm font-extrabold text-[#0B3B24] tabular-nums">
                                  {mode.price > 0 ? formatCurrency(mode.price) : '$0.00 (Free)'}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                {/* Toggle Active */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleDeliveryModeActive(mode.id)}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                                    mode.active
                                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                  }`}
                                >
                                  {mode.active ? 'Active' : 'Disabled'}
                                </button>

                                {/* Edit Button */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditDeliveryMode(mode)}
                                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer"
                                  title="Edit Mode"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>

                                {/* Delete Button */}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteDeliveryMode(mode.id)}
                                  className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
                                  title="Delete Mode"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* FedEx Web Integration Solutions (WIS) & Location Rating Section */}
                <div className="pt-6 border-t border-[#E8EDF2] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-sm text-[#163B5C] flex items-center gap-2">
                        <Truck className="w-5 h-5 text-purple-600" /> FedEx Web Integration Solutions (WIS)
                      </h3>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        Dynamic location-based FedEx rate calculation & carrier settings. Rates scale automatically by US destination Zone.
                      </p>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200">
                      <input
                        type="checkbox"
                        checked={paymentSettings.fedexEnabled}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, fedexEnabled: e.target.checked })}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 accent-purple-600"
                      />
                      <span className="text-xs font-bold text-purple-900">Dynamic FedEx Active</span>
                    </label>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className="text-xs font-bold text-[#163B5C]">
                      FedEx 9-Digit Account Number
                      <input
                        type="text"
                        value={paymentSettings.fedexAccountNumber}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, fedexAccountNumber: e.target.value })}
                        placeholder="695333510"
                        className="mt-1.5 w-full rounded-xl border border-[#E8EDF2] bg-white px-3 py-2 text-sm font-medium outline-none focus:border-purple-600"
                      />
                    </label>

                    <label className="text-xs font-bold text-[#163B5C]">
                      Production Meter Number
                      <input
                        type="text"
                        value={paymentSettings.fedexProductionMeterNumber}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, fedexProductionMeterNumber: e.target.value })}
                        placeholder="256593981"
                        className="mt-1.5 w-full rounded-xl border border-[#E8EDF2] bg-white px-3 py-2 text-sm font-medium outline-none focus:border-purple-600"
                      />
                    </label>

                    <label className="text-xs font-bold text-[#163B5C]">
                      Test Meter Number
                      <input
                        type="text"
                        value={paymentSettings.fedexTestMeterNumber}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, fedexTestMeterNumber: e.target.value })}
                        placeholder="256456943"
                        className="mt-1.5 w-full rounded-xl border border-[#E8EDF2] bg-white px-3 py-2 text-sm font-medium outline-none focus:border-purple-600"
                      />
                    </label>

                    <label className="text-xs font-bold text-[#163B5C]">
                      Production Authentication Key
                      <input
                        type="text"
                        value={paymentSettings.fedexAuthKey}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, fedexAuthKey: e.target.value })}
                        placeholder="odhEUIQgzxYnhfOR"
                        className="mt-1.5 w-full rounded-xl border border-[#E8EDF2] bg-white px-3 py-2 text-sm font-medium outline-none focus:border-purple-600"
                      />
                    </label>

                    <label className="text-xs font-bold text-[#163B5C]">
                      Environment
                      <select
                        value={paymentSettings.fedexEnvironment}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, fedexEnvironment: e.target.value })}
                        className="mt-1.5 w-full rounded-xl border border-[#E8EDF2] bg-white px-3 py-2 text-sm font-medium outline-none focus:border-purple-600"
                      >
                        <option value="production">Production (WIS Live)</option>
                        <option value="test">Test / Sandbox</option>
                      </select>
                    </label>

                    <label className="text-xs font-bold text-[#163B5C]">
                      Shipper Origin Zip (Fontana Hub)
                      <input
                        type="text"
                        value={paymentSettings.fedexOriginZip}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, fedexOriginZip: e.target.value })}
                        placeholder="92336"
                        className="mt-1.5 w-full rounded-xl border border-[#E8EDF2] bg-white px-3 py-2 text-sm font-medium outline-none focus:border-purple-600"
                      />
                    </label>

                    <label className="text-xs font-bold text-[#163B5C]">
                      Company Name (Per WIS Form)
                      <input
                        type="text"
                        value={paymentSettings.fedexCompanyName}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, fedexCompanyName: e.target.value })}
                        placeholder="Malar Traders"
                        className="mt-1.5 w-full rounded-xl border border-[#E8EDF2] bg-white px-3 py-2 text-sm font-medium outline-none focus:border-purple-600"
                      />
                    </label>

                    <label className="text-xs font-bold text-[#163B5C]">
                      Authorized Contact Name
                      <input
                        type="text"
                        value={paymentSettings.fedexContactName}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, fedexContactName: e.target.value })}
                        placeholder="George Joseph"
                        className="mt-1.5 w-full rounded-xl border border-[#E8EDF2] bg-white px-3 py-2 text-sm font-medium outline-none focus:border-purple-600"
                      />
                    </label>

                    <label className="text-xs font-bold text-[#163B5C]">
                      Contact Email
                      <input
                        type="email"
                        value={paymentSettings.fedexEmail}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, fedexEmail: e.target.value })}
                        placeholder="indianflowers2020@gmail.com"
                        className="mt-1.5 w-full rounded-xl border border-[#E8EDF2] bg-white px-3 py-2 text-sm font-medium outline-none focus:border-purple-600"
                      />
                    </label>
                  </div>

                  {/* Interactive Live Rate Tester */}
                  <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-extrabold text-[#163B5C] flex items-center gap-1.5">
                          <Check className="w-4 h-4 text-emerald-600" /> Live ZIP Rate Calculator & Zone Tester
                        </span>
                        <p className="text-[11px] text-[#64748B]">
                          Test dynamic billing rates from Fontana, CA (92336) to any US location.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={testZipCode}
                        onChange={(e) => setTestZipCode(e.target.value)}
                        placeholder="e.g. 90210, 77001, 10001, 99501"
                        className="max-w-[180px] rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-purple-600"
                      />
                      <button
                        type="button"
                        onClick={handleTestFedExRate}
                        disabled={testingRate}
                        className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {testingRate ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Calculate Dynamic Rate'}
                      </button>
                    </div>

                    {testRateError && (
                      <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
                        {testRateError}
                      </div>
                    )}

                    {testRateResult && testRateResult.recommendedRate && (
                      <div className="p-3.5 rounded-xl bg-white border border-purple-200 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-purple-950 flex items-center gap-1">
                            <span>📍 Destination:</span>
                            <span className="text-purple-700 font-bold">{testRateResult.destination.zoneName}</span>
                          </span>
                          <span className="text-sm font-black text-emerald-700 tabular-nums">
                            {formatCurrency(testRateResult.recommendedRate.amount)}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-600 grid grid-cols-2 sm:grid-cols-3 gap-2">
                          <div>
                            <span className="text-gray-400 block">Service:</span>
                            <span className="font-semibold text-gray-800">{testRateResult.recommendedRate.serviceName}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block">Transit Time:</span>
                            <span className="font-semibold text-emerald-800">{testRateResult.recommendedRate.estimatedTransitDays}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block">Billed Weight:</span>
                            <span className="font-semibold text-gray-800">{testRateResult.recommendedRate.billedWeightLbs} lbs (Thermal Pack)</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
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
        {activeTab === 'mail' && <MailManagerTab />}
      {/* Modal: Add / Edit Delivery Mode */}
      {isDeliveryModeModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0B3B24]/10 text-[#0B3B24] flex items-center justify-center font-bold">
                  <Truck className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-[#163B5C]">
                  {editingDeliveryMode ? 'Edit Delivery Mode' : 'Add New Delivery Mode'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDeliveryModeModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDeliveryModeModal} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-[#163B5C] block mb-1">
                  Delivery Method Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. South West Airlines Priority Air Cargo"
                  value={deliveryModeForm.name}
                  onChange={(e) => setDeliveryModeForm({ ...deliveryModeForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#0B3B24]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#163B5C] block mb-1">
                    Type *
                  </label>
                  <select
                    value={deliveryModeForm.type}
                    onChange={(e) => setDeliveryModeForm({ ...deliveryModeForm, type: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#0B3B24]"
                  >
                    <option value="shipping">Express Shipping (Cargo/Courier)</option>
                    <option value="pickup">Local Pickup (In-Person Hub)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#163B5C] block mb-1">
                    Price / Fee (USD $) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.00"
                    value={deliveryModeForm.price}
                    onChange={(e) => setDeliveryModeForm({ ...deliveryModeForm, price: Math.max(0, parseFloat(e.target.value) || 0) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#0B3B24]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#163B5C] block mb-1">
                  Estimated Delivery / Readiness
                </label>
                <input
                  type="text"
                  placeholder="e.g. Same-Day / Next-Morning, or Ready for Pickup"
                  value={deliveryModeForm.estimatedDays || ''}
                  onChange={(e) => setDeliveryModeForm({ ...deliveryModeForm, estimatedDays: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#0B3B24]"
                />
              </div>

              {deliveryModeForm.type === 'pickup' && (
                <div>
                  <label className="font-bold text-[#163B5C] block mb-1">
                    Pickup Location / Hub Details
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Houston, TX or Inver Grove Heights, MN-55077"
                    value={deliveryModeForm.pickupLocation || ''}
                    onChange={(e) => setDeliveryModeForm({ ...deliveryModeForm, pickupLocation: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#0B3B24]"
                  />
                </div>
              )}

              <div>
                <label className="font-bold text-[#163B5C] block mb-1">
                  Customer Description / Helper Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. A few dollars are applicable during local pickup."
                  value={deliveryModeForm.description || ''}
                  onChange={(e) => setDeliveryModeForm({ ...deliveryModeForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#0B3B24]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="deliveryModeActive"
                  checked={deliveryModeForm.active}
                  onChange={(e) => setDeliveryModeForm({ ...deliveryModeForm, active: e.target.checked })}
                  className="w-4 h-4 rounded text-[#0B3B24] focus:ring-[#0B3B24] accent-[#0B3B24] cursor-pointer"
                />
                <label htmlFor="deliveryModeActive" className="font-semibold text-gray-800 cursor-pointer">
                  Active (Display this option to customers in cart and checkout)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsDeliveryModeModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#0B3B24] hover:bg-[#134633] text-white font-bold transition-all shadow-xs cursor-pointer"
                >
                  {editingDeliveryMode ? 'Update Delivery Mode' : 'Add Delivery Mode'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                    placeholder="e.g. Fresh Jasmine Strings (Mallipoo) 5ft"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E8EDF2] text-sm focus:outline-none focus:border-[#2F6B4F]"
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
                        onChange={(e) => {
                          const newCat = e.target.value;
                          setProductForm({ ...productForm, category: newCat, subcategory: '' });
                        }}
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

                  {/* Subcategory Select */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#163B5C] uppercase tracking-wider">
                      Subcategory (Optional)
                    </label>
                    {(() => {
                      const selectedCatObj = categories.find(
                        (c) => c.name.toLowerCase() === (productForm.category || '').toLowerCase()
                      );
                      const subcats = selectedCatObj?.subcategories || [];
                      return (
                        <select
                          value={productForm.subcategory || ''}
                          onChange={(e) => setProductForm({ ...productForm, subcategory: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-[#E8EDF2] text-sm focus:outline-none focus:border-[#ED3500]"
                        >
                          <option value="">None / General (No Subcategory)</option>
                          {subcats.map((sub) => (
                            <option key={sub._id || sub.name} value={sub.name}>
                              {sub.name}
                            </option>
                          ))}
                          {productForm.subcategory && !subcats.some((s) => s.name === productForm.subcategory) && (
                            <option value={productForm.subcategory}>{productForm.subcategory} (Custom)</option>
                          )}
                        </select>
                      );
                    })()}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-hidden">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[92vh] sm:max-h-[90vh] overflow-y-auto border border-[#E8EDF2] shadow-2xl p-6 sm:p-8 relative">
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

                {/* Show on Homepage Toggle in Edit Modal */}
                <label className="flex items-center justify-between p-3 rounded-xl border border-[#E8EDF2] bg-[#FAFDFB] hover:bg-emerald-50/40 cursor-pointer transition-colors">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-[#163B5C] block">
                      Show in Homepage Section
                    </span>
                    <span className="text-[11px] text-[#64748B] block">
                      Display this category and its product carousel on the store homepage.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={editCatShowOnHome}
                    onChange={(e) => setEditCatShowOnHome(e.target.checked)}
                    className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                  />
                </label>

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-hidden">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-[#E8EDF2] shadow-2xl p-6 sm:p-8 relative max-h-[92vh] sm:max-h-[90vh] overflow-y-auto">
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full max-h-[92vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl border border-[#E8EDF2] space-y-6 relative animate-in fade-in zoom-in duration-200">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-hidden">
          <div className="bg-white rounded-3xl border border-[#E8EDF2] shadow-2xl max-w-4xl w-full max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden relative">
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
                    ) : selectedOrderForDetails.status === 'Completed' || selectedOrderForDetails.status === 'Delivered' ? (
                      <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold flex items-center gap-1.5 border border-emerald-300">
                        <Check className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Delivered (Completed)</span>
                      </span>
                    ) : (
                      <select
                        value={selectedOrderForDetails.status}
                        onChange={(e) =>
                          handleUpdateOrderStatus(selectedOrderForDetails._id, { status: e.target.value })
                        }
                        className="bg-white border border-[#E8EDF2] rounded-xl px-3 py-1.5 text-xs font-bold text-[#163B5C] focus:outline-none focus:border-[#ED3500]"
                      >
                        <option value="Pending">Pending (Awaiting Pack)</option>
                        <option value="Processing">Processing (Floral Prep)</option>
                        <option value="Delivered">Delivered (Completed)</option>
                        <option value="Cancelled">Cancelled</option>
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

                {/* Status Guidance Banner */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span>
                      <strong className="text-slate-800">Fulfillment Stages:</strong> Tracks delivery logistics (<span className="text-[#163B5C] font-semibold">Pending</span> → <span className="text-[#163B5C] font-semibold">Processing</span> → <span className="text-emerald-700 font-bold">Delivered</span>). Customer loyalty points are credited once marked Delivered.
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                    <span>
                      <strong className="text-slate-800">Returns &amp; Refunds:</strong> For damaged florals or customer disputes, click <strong className="text-rose-700">Process Return / Refund</strong> to automatically restock inventory, reconcile ledger accounting, and reverse loyalty points.
                    </span>
                  </div>
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
                      {selectedOrderForDetails.deliveryDate && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-slate-500 flex items-center gap-1 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Requested Event / Delivery Date:</span>
                          </span>
                          <span className="font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                            {selectedOrderForDetails.deliveryDate}
                          </span>
                        </div>
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
                            <Tag className="w-3.5 h-3.5 text-purple-600" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-hidden">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] sm:max-h-[90vh] flex flex-col border border-[#E8EDF2] shadow-2xl overflow-hidden animate-fadeIn">
            {/* Header */}
            <div className="p-5 border-b border-[#E8EDF2] flex items-center justify-between bg-[#FFFCFB] shrink-0">
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
            <form id="process-refund-form" onSubmit={handleProcessRefundSubmit} className="p-5 space-y-4 text-xs flex-1 overflow-y-auto">
              {refundError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold shrink-0">
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

            </form>

            {/* Pinned Sticky Footer */}
            <div className="px-5 py-3.5 border-t border-[#E8EDF2] bg-[#FFFCFB] flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setRefundOrderTarget(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="process-refund-form"
                disabled={isProcessingRefund}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold flex items-center gap-2 shadow-md shadow-rose-600/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isProcessingRefund ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4" />
                )}
                <span>{isProcessingRefund ? 'Processing Refund...' : 'Confirm Return & Refund'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      
      {/* Bulk Product Import Modal (.xlsx) */}
      {isBulkImportModalOpen && (() => {
        const resetAndCloseModal = () => {
          setIsBulkImportModalOpen(false);
          setImportFile(null);
          setImportRawRows([]);
          setImportEnrichedRows([]);
          setImportImageFiles([]);
          setImportProgressStatus('');
          setImportFilterTab('all');
          setImportResult(null);
        };

        const totalCount = importEnrichedRows.length;
        const newCount = importEnrichedRows.filter((r) => !r.isUpdate).length;
        const updateCount = importEnrichedRows.filter((r) => r.isUpdate).length;
        const matchedCount = importEnrichedRows.filter((r) => Boolean(r.matchedImageFile)).length;
        const unmatchedCount = totalCount - matchedCount;

        const filteredImportRows = importEnrichedRows.filter((r) => {
          if (importFilterTab === 'new') return !r.isUpdate;
          if (importFilterTab === 'update') return r.isUpdate;
          if (importFilterTab === 'matched') return Boolean(r.matchedImageFile);
          if (importFilterTab === 'unmatched') return !r.matchedImageFile;
          return true;
        });

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-hidden">
            <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] sm:max-h-[90vh] overflow-y-auto border border-[#E8EDF2] shadow-2xl p-6 sm:p-8 relative">
              <button
                onClick={resetAndCloseModal}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-[#E8EDF2] text-[#64748B] transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-black text-[#163B5C] flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
                      <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
                    </div>
                    <span>Bulk Product Import (.xlsx)</span>
                  </h3>
                  <p className="text-xs text-[#64748B] mt-1">
                    Upload an Excel workbook with dedicated variant columns + drop product photos. Matches images automatically by filename, compresses to Base64 on device, and shows an instant preview of new products vs existing updates.
                  </p>
                </div>

                {/* Template Helper Callout */}
                <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Download the Official Store Excel Template
                    </span>
                    <p className="text-[11px] text-emerald-800/90">
                      Pre-formatted with color-coded headers, separate non-technical Variant columns (Variant 1, 2, 3, 4), and categories reference.
                    </p>
                  </div>
                  <a
                    href="/api/products/template"
                    download="IndianFlowers_Products_Bulk_Import_Template.xlsx"
                    className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all active:scale-95 shrink-0 self-start sm:self-auto"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .xlsx</span>
                  </a>
                </div>

                {/* Upload Zones: 2 Columns (Excel File + Product Images Dropzone) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Zone 1: Excel File */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#163B5C] uppercase tracking-wider flex items-center justify-between">
                      <span>1. Select Excel File (.xlsx, .xls)</span>
                      {importFile && (
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                          ✓ File Loaded
                        </span>
                      )}
                    </label>
                    <label className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-colors block ${importFile ? 'border-emerald-600 bg-emerald-50/20' : 'border-[#E8EDF2] hover:border-emerald-600 bg-[#FFFCFB]'}`}>
                      <Upload className={`w-7 h-7 mx-auto mb-2 ${importFile ? 'text-emerald-700' : 'text-emerald-600'}`} />
                      <span className="text-xs font-bold text-[#163B5C] block truncate max-w-xs mx-auto">
                        {importFile ? importFile.name : 'Click to select or drag .xlsx workbook'}
                      </span>
                      <span className="text-[11px] text-[#64748B] mt-1 block">
                        {importFile
                          ? `${(importFile.size / 1024).toFixed(1)} KB — ${totalCount} rows detected`
                          : 'Supports Microsoft Excel (.xlsx, .xls)'}
                      </span>
                      <input
                        type="file"
                        accept=".xlsx, .xls, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                        onChange={handleImportFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Zone 2: Product Images Multi-Drop (Solution 1) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#163B5C] uppercase tracking-wider flex items-center gap-1.5">
                        <span>2. Drop Product Photos</span>
                        <span className="text-[10px] lowercase text-[#64748B] font-normal">(optional)</span>
                      </label>
                      {importImageFiles.length > 0 && (
                        <button
                          type="button"
                          onClick={handleClearImportImages}
                          className="text-[10px] text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Clear ({importImageFiles.length})
                        </button>
                      )}
                    </div>
                    <label className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-colors block ${importImageFiles.length > 0 ? 'border-emerald-600 bg-emerald-50/20' : 'border-[#E8EDF2] hover:border-emerald-600 bg-[#FFFCFB]'}`}>
                      <ImageIcon className={`w-7 h-7 mx-auto mb-2 ${importImageFiles.length > 0 ? 'text-emerald-700' : 'text-emerald-600'}`} />
                      <span className="text-xs font-bold text-[#163B5C] block">
                        {importImageFiles.length > 0
                          ? `${importImageFiles.length} Photos Selected`
                          : 'Click or drop 1 to 50+ photos'}
                      </span>
                      <span className="text-[11px] text-[#64748B] mt-1 block">
                        {importImageFiles.length > 0
                          ? `${matchedCount} matched with Excel rows`
                          : 'Matches Excel "Image Filename" or Product Name'}
                      </span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImportImagesChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Selected Images Thumbnail Scroller if photos chosen */}
                {importImageFiles.length > 0 && (
                  <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-[#163B5C]">
                      <span>Selected Photos ({importImageFiles.length})</span>
                      <span className="text-[11px] text-emerald-700 font-semibold">
                        {matchedCount} / {importImageFiles.length} matched with sheet rows
                      </span>
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
                      {importImageFiles.slice(0, 16).map((file, fIdx) => {
                        const isMatched = importEnrichedRows.some((r) => r.matchedImageFile?.name === file.name);
                        return (
                          <div
                            key={fIdx}
                            className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-semibold border ${
                              isMatched
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-white text-slate-600 border-slate-200'
                            }`}
                            title={file.name}
                          >
                            <span className="w-2 h-2 rounded-full shrink-0 bg-current" />
                            <span className="truncate max-w-[120px]">{file.name}</span>
                          </div>
                        );
                      })}
                      {importImageFiles.length > 16 && (
                        <span className="text-[10px] text-slate-500 font-bold shrink-0 px-2">
                          +{importImageFiles.length - 16} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Pre-Import Verification & Duplicate Check Section */}
                {totalCount > 0 && (
                  <div className="space-y-3 pt-1">
                    {/* Stat Badges */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                          Total Products
                        </span>
                        <span className="text-lg font-black text-[#163B5C]">{totalCount}</span>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-center">
                        <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">
                          + New Products
                        </span>
                        <span className="text-lg font-black text-emerald-800">{newCount}</span>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5 text-center">
                        <span className="text-[10px] text-blue-700 font-bold uppercase tracking-wider block">
                          ↻ Existing Updates
                        </span>
                        <span className="text-lg font-black text-blue-800">{updateCount}</span>
                      </div>
                      <div className="bg-teal-50 border border-teal-200 rounded-xl p-2.5 text-center">
                        <span className="text-[10px] text-teal-700 font-bold uppercase tracking-wider block">
                          📷 Photos Matched
                        </span>
                        <span className="text-lg font-black text-teal-800">
                          {matchedCount} / {totalCount}
                        </span>
                      </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold border-b border-[#E8EDF2]">
                      <button
                        type="button"
                        onClick={() => setImportFilterTab('all')}
                        className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                          importFilterTab === 'all'
                            ? 'bg-[#0B3B24] text-white'
                            : 'text-[#64748B] hover:bg-slate-100'
                        }`}
                      >
                        All ({totalCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setImportFilterTab('new')}
                        className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                          importFilterTab === 'new'
                            ? 'bg-emerald-700 text-white'
                            : 'text-emerald-800 hover:bg-emerald-50'
                        }`}
                      >
                        + New ({newCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setImportFilterTab('update')}
                        className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                          importFilterTab === 'update'
                            ? 'bg-blue-700 text-white'
                            : 'text-blue-800 hover:bg-blue-50'
                        }`}
                      >
                        ↻ Updates ({updateCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setImportFilterTab('matched')}
                        className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                          importFilterTab === 'matched'
                            ? 'bg-teal-700 text-white'
                            : 'text-teal-800 hover:bg-teal-50'
                        }`}
                      >
                        📷 Matched ({matchedCount})
                      </button>
                      {unmatchedCount > 0 && (
                        <button
                          type="button"
                          onClick={() => setImportFilterTab('unmatched')}
                          className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                            importFilterTab === 'unmatched'
                              ? 'bg-amber-600 text-white'
                              : 'text-amber-800 hover:bg-amber-50'
                          }`}
                        >
                          ⚠ Missing Photos ({unmatchedCount})
                        </button>
                      )}
                    </div>

                    {/* Verification Table */}
                    <div className="border border-[#E8EDF2] rounded-2xl overflow-hidden max-h-64 overflow-y-auto">
                      <table className="w-full text-left text-[11px] border-collapse">
                        <thead className="bg-[#F8FAFC] border-b border-[#E8EDF2] sticky top-0 z-10">
                          <tr className="font-bold text-[#64748B]">
                            <th className="py-2 px-3">Status</th>
                            <th className="py-2 px-3">Product Name & Category</th>
                            <th className="py-2 px-3">Base Price / MRP</th>
                            <th className="py-2 px-3">Variants</th>
                            <th className="py-2 px-3">Photo Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E8EDF2]">
                          {filteredImportRows.map((r, i) => (
                            <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                              {/* Status Badge */}
                              <td className="py-2 px-3 align-top">
                                {r.isUpdate ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
                                    ↻ UPDATE
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    + NEW
                                  </span>
                                )}
                              </td>

                              {/* Product Name & Category */}
                              <td className="py-2 px-3 align-top max-w-[220px]">
                                <div className="font-bold text-[#163B5C] truncate">{r.name}</div>
                                <div className="text-[10px] text-emerald-700 font-medium truncate">
                                  {r.category}
                                  {r.subcategory ? ` • ${r.subcategory}` : ''}
                                </div>
                              </td>

                              {/* Pricing & MRP */}
                              <td className="py-2 px-3 align-top whitespace-nowrap">
                                <div className="font-bold text-[#ED3500]">{formatCurrency(r.price)}</div>
                                <div className="text-[10px] line-through text-[#64748B]">
                                  {formatCurrency(r.mrp)}
                                </div>
                                {r.isUpdate && r.existingProduct && (
                                  <div className="text-[9px] text-blue-700 font-semibold mt-0.5">
                                    Current: {formatCurrency(r.existingProduct.price)}
                                  </div>
                                )}
                              </td>

                              {/* Variants (Separate Columns) */}
                              <td className="py-2 px-3 align-top max-w-[180px]">
                                {r.variants && r.variants.length > 0 ? (
                                  <div className="space-y-1">
                                    <span className="inline-block px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200 text-[10px] font-bold">
                                      {r.variants.length} Variant{r.variants.length > 1 ? 's' : ''}
                                    </span>
                                    <div className="text-[9.5px] text-slate-600 truncate">
                                      {r.variants.map((v) => `${v.name}: ${formatCurrency(v.price)}`).join(' • ')}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 text-[10px]">No variants</span>
                                )}
                              </td>

                              {/* Photo / Image Status */}
                              <td className="py-2 px-3 align-top">
                                {r.matchedPreviewUrl ? (
                                  <div className="flex items-center gap-2">
                                    <img
                                      src={r.matchedPreviewUrl}
                                      alt={r.name}
                                      className="w-8 h-8 rounded-lg object-cover border border-emerald-300 shrink-0"
                                    />
                                    <div className="text-[10px] leading-tight">
                                      <span className="text-emerald-700 font-bold block">✓ Photo Matched</span>
                                      <span className="text-slate-500 truncate block max-w-[110px]">
                                        {r.matchedImageFile?.name}
                                      </span>
                                    </div>
                                  </div>
                                ) : r.isUpdate ? (
                                  <div className="flex items-center gap-2">
                                    {r.existingProduct?.image && (
                                      <img
                                        src={r.existingProduct.image}
                                        alt={r.name}
                                        className="w-8 h-8 rounded-lg object-cover border border-blue-200 shrink-0"
                                      />
                                    )}
                                    <div className="text-[10px] leading-tight">
                                      <span className="text-blue-700 font-bold block">✓ Existing Photo</span>
                                      <span className="text-slate-500 block">Safely preserved</span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-[10px] text-amber-700 font-medium leading-tight">
                                    <span>⚠ Default placeholder</span>
                                    <span className="text-slate-400 block text-[9px]">
                                      {r.imageFilename ? `(File: ${r.imageFilename})` : ''}
                                    </span>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Progress Notification During Execution */}
                {isUploadingImport && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-3">
                    <RefreshCw className="w-5 h-5 text-emerald-700 animate-spin shrink-0" />
                    <div>
                      <span className="font-bold block">Bulk Import In Progress</span>
                      <p className="text-[11px] text-emerald-800">
                        {importProgressStatus || 'Processing products and compressing images on device...'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Results Banner */}
                {importResult && (
                  <div
                    className={`p-4 rounded-2xl border text-xs ${
                      importResult.success
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold mb-1">
                      {importResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600" />
                      )}
                      <span>{importResult.message}</span>
                    </div>
                    {importResult.errors && importResult.errors.length > 0 && (
                      <div className="mt-2 pl-4 border-l-2 border-rose-300 space-y-1 text-[11px]">
                        <span className="font-bold block">Warnings / Skipped:</span>
                        {importResult.errors.map((err, ei) => (
                          <p key={ei}>{err}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={resetAndCloseModal}
                    className="px-5 py-2.5 rounded-xl border border-[#E8EDF2] text-xs font-bold text-[#64748B] hover:bg-gray-50 transition-colors"
                  >
                    {importResult?.success ? 'Done & Close' : 'Cancel'}
                  </button>
                  {!importResult?.success && (
                    <button
                      type="button"
                      disabled={isUploadingImport || totalCount === 0}
                      onClick={handleExecuteBulkImport}
                      className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs uppercase tracking-wider shadow-md shadow-emerald-700/20 flex items-center gap-2 disabled:opacity-50 transition-all active:scale-95"
                    >
                      {isUploadingImport ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Importing Products...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>Import {totalCount > 0 ? `${totalCount} Products` : 'Now'}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Instant POS / Tax Receipt Slip Modal */}
      {receiptOrder && (
        <POSReceipt
          order={receiptOrder}
          onClose={() => setReceiptOrder(null)}
        />
      )}

      {/* WordPress / WooCommerce Migration Modal */}
      <WordPressImportModal
        isOpen={isWpImportModalOpen}
        onClose={() => setIsWpImportModalOpen(false)}
        onImportComplete={fetchProducts}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-[#E8EDF2] py-3.5 px-6 text-xs text-[#64748B] flex items-center justify-center">
        <p className="text-[11px] text-slate-500">
          &copy; {new Date().getFullYear()} The Indian Flowers. Storefront &amp; Order Management Console.
        </p>
      </footer>
    </div>
  </div>
  );
}
