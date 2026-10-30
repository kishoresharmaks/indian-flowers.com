'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageSquareQuote,
  Star,
  Plus,
  Edit,
  Trash2,
  MapPin,
  Building2,
  Navigation,
  Clock,
  Check,
  X,
  RefreshCw,
  Eye,
  EyeOff,
  Sparkles,
  Phone,
  Mail,
  Save,
  RotateCcw,
  ExternalLink,
  Layers,
  Flower2,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';
import { ReviewItem, DEFAULT_CUSTOMER_REVIEWS } from '@/lib/defaultReviews';
import { IDeliveryMode, DEFAULT_DELIVERY_MODES, IPickupHub, DEFAULT_PICKUP_HUBS } from '@/models/Settings';

interface CMSManagerTabProps {
  paymentSettings: any;
  setPaymentSettings: (settings: any) => void;
  onSavePaymentSettings?: (customSettings?: any) => Promise<boolean>;
  isSavingSettings?: boolean;
}

export default function CMSManagerTab({
  paymentSettings,
  setPaymentSettings,
  onSavePaymentSettings,
  isSavingSettings = false,
}: CMSManagerTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'reviews' | 'footerHubs' | 'localPickup'>('reviews');

  // ==========================================
  // 1. REVIEWS MANAGEMENT STATE
  // ==========================================
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [reviewsError, setReviewsError] = useState('');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<ReviewItem | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [togglingReviewId, setTogglingReviewId] = useState<string | null>(null);

  // Review Form State
  const [reviewForm, setReviewForm] = useState<{
    customerName: string;
    location: string;
    comment: string;
    rating: number;
    productName: string;
    featured: boolean;
    order: number;
  }>({
    customerName: '',
    location: 'USA',
    comment: '',
    rating: 5,
    productName: '',
    featured: true,
    order: 0,
  });

  // Fetch all reviews from API
  const fetchReviews = async () => {
    try {
      setLoadingReviews(true);
      setReviewsError('');
      const res = await fetch('/api/reviews?all=true', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setReviews(data.data);
      } else {
        setReviews(DEFAULT_CUSTOMER_REVIEWS);
      }
    } catch (err: any) {
      console.warn('Failed to load reviews in CMS tab:', err);
      setReviewsError(err.message || 'Failed to load reviews');
      setReviews(DEFAULT_CUSTOMER_REVIEWS);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const openAddReviewModal = () => {
    setEditingReview(null);
    setReviewForm({
      customerName: '',
      location: 'USA',
      comment: '',
      rating: 5,
      productName: '',
      featured: true,
      order: reviews.length + 1,
    });
    setIsReviewModalOpen(true);
  };

  const openEditReviewModal = (rev: ReviewItem) => {
    setEditingReview(rev);
    setReviewForm({
      customerName: rev.customerName || '',
      location: rev.location || 'USA',
      comment: rev.comment || '',
      rating: rev.rating || 5,
      productName: rev.productName || '',
      featured: rev.featured !== false,
      order: rev.order || 0,
    });
    setIsReviewModalOpen(true);
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.customerName.trim() || !reviewForm.comment.trim()) {
      alert('Please provide customer name and review comment.');
      return;
    }

    try {
      setIsSubmittingReview(true);
      const isEdit = Boolean(editingReview && editingReview._id);
      const url = isEdit ? `/api/reviews/${editingReview!._id}` : '/api/reviews';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewForm),
      });

      const data = await res.json();
      if (data.success) {
        setIsReviewModalOpen(false);
        setEditingReview(null);
        await fetchReviews();
      } else {
        alert(data.message || 'Failed to save review');
      }
    } catch (err: any) {
      alert(err.message || 'Network error while saving review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (id?: string) => {
    if (!id) return;
    if (!confirm('Are you sure you want to delete this customer review card?')) return;

    try {
      setReviews((prev) => prev.filter((r) => r._id !== id));
      const res = await fetch(`/api/reviews/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) {
        await fetchReviews();
      }
    } catch {
      await fetchReviews();
    }
  };

  const handleToggleReviewFeatured = async (rev: ReviewItem) => {
    if (!rev._id) return;
    const nextVal = !(rev.featured !== false);
    setTogglingReviewId(rev._id);
    // Optimistic UI update
    setReviews((prev) =>
      prev.map((r) => (r._id === rev._id ? { ...r, featured: nextVal } : r))
    );

    try {
      const res = await fetch(`/api/reviews/${rev._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: nextVal }),
      });
      const data = await res.json();
      if (!data.success) {
        await fetchReviews();
      }
    } catch {
      await fetchReviews();
    } finally {
      setTogglingReviewId(null);
    }
  };

  // ==========================================
  // 2. FOOTER PICKUP HUBS & LOCATIONS STATE
  // ==========================================
  const currentHubs: IPickupHub[] =
    Array.isArray(paymentSettings?.pickupHubs) && paymentSettings.pickupHubs.length > 0
      ? paymentSettings.pickupHubs
      : DEFAULT_PICKUP_HUBS;

  const currentDeliveryModes: IDeliveryMode[] =
    Array.isArray(paymentSettings?.deliveryModes) && paymentSettings.deliveryModes.length > 0
      ? paymentSettings.deliveryModes
      : DEFAULT_DELIVERY_MODES;

  const [hubsList, setHubsList] = useState<IPickupHub[]>(currentHubs);
  const [newCityInput, setNewCityInput] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  useEffect(() => {
    if (Array.isArray(paymentSettings?.pickupHubs) && paymentSettings.pickupHubs.length > 0) {
      setHubsList(paymentSettings.pickupHubs);
    }
  }, [paymentSettings?.pickupHubs]);

  const handleUpdateHub = (index: number, field: keyof IPickupHub, value: any) => {
    const updated = [...hubsList];
    updated[index] = { ...updated[index], [field]: value };
    setHubsList(updated);
    setPaymentSettings({ ...paymentSettings, pickupHubs: updated });
  };

  const handleAddHub = () => {
    const newHub: IPickupHub = {
      id: `hub-${Date.now()}`,
      title: 'New Regional Hub',
      address: '',
      hours: 'Mon – Sat: 8:00 AM – 7:00 PM',
      active: true,
      order: hubsList.length + 1,
    };
    const updated = [...hubsList, newHub];
    setHubsList(updated);
    setPaymentSettings({ ...paymentSettings, pickupHubs: updated });
  };

  const handleDeleteHub = (index: number) => {
    const updated = hubsList.filter((_, i) => i !== index);
    setHubsList(updated);
    setPaymentSettings({ ...paymentSettings, pickupHubs: updated });
  };

  const handleSaveHubsToSettings = async () => {
    if (onSavePaymentSettings) {
      const ok = await onSavePaymentSettings({ ...paymentSettings, pickupHubs: hubsList });
      if (ok) {
        setSaveSuccessMsg('Footer locations and pickup hubs saved successfully!');
        setTimeout(() => setSaveSuccessMsg(''), 4000);
      }
    } else {
      try {
        const res = await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...paymentSettings, pickupHubs: hubsList }),
        });
        const data = await res.json();
        if (data.success) {
          setSaveSuccessMsg('Footer locations and pickup hubs saved successfully!');
          setTimeout(() => setSaveSuccessMsg(''), 4000);
        } else {
          alert(data.message || 'Failed to save settings');
        }
      } catch (err: any) {
        alert(err.message || 'Error saving settings');
      }
    }
  };

  // Toggle delivery mode active state directly from CMS tab
  const handleTogglePickupMode = async (modeId: string) => {
    const updatedModes = currentDeliveryModes.map((m) =>
      m.id === modeId ? { ...m, active: !m.active } : m
    );
    setPaymentSettings({ ...paymentSettings, deliveryModes: updatedModes });
    if (onSavePaymentSettings) {
      await onSavePaymentSettings({ ...paymentSettings, deliveryModes: updatedModes });
    }
  };

  // Add new pickup city to delivery options
  const handleAddPickupCity = async () => {
    if (!newCityInput.trim()) return;
    const cleanCity = newCityInput.trim();
    const newMode: IDeliveryMode = {
      id: `pickup-${cleanCity.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name: `Local pickup (${cleanCity})`,
      type: 'pickup',
      price: 0.0,
      description: 'A few dollars are applicable during local pickup.',
      pickupLocation: cleanCity,
      estimatedDays: 'Ready for Pickup',
      active: true,
      order: currentDeliveryModes.length + 1,
    };
    const updatedModes = [...currentDeliveryModes, newMode];
    setPaymentSettings({ ...paymentSettings, deliveryModes: updatedModes });
    setNewCityInput('');
    if (onSavePaymentSettings) {
      await onSavePaymentSettings({ ...paymentSettings, deliveryModes: updatedModes });
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-3xl border border-[#E8EDF2] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-[#0B3B24]">Storefront CMS &amp; Content Management</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-[#0B3B24] border border-emerald-300">
              Live Storefront
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Manage customer reviews displayed on the homepage, and update footer pickup hubs and local delivery locations dynamically.
          </p>
        </div>

        {/* View Live Storefront Link */}
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 self-start sm:self-auto"
        >
          <span>View Live Store</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Subtabs Switcher */}
      <div className="flex items-center gap-2 border-b border-[#E8EDF2] pb-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSubTab('reviews')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'reviews'
              ? 'bg-[#0B3B24] text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <MessageSquareQuote className="w-4 h-4 text-emerald-300" />
          <span>Customer Reviews &amp; Testimonials ({reviews.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('footerHubs')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'footerHubs'
              ? 'bg-[#0B3B24] text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Building2 className="w-4 h-4 text-emerald-300" />
          <span>Footer Locations &amp; Pickup Hubs ({hubsList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('localPickup')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'localPickup'
              ? 'bg-[#0B3B24] text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Navigation className="w-4 h-4 text-emerald-300" />
          <span>Footer Local Pickup Cities ({currentDeliveryModes.filter((m) => m.type === 'pickup' && m.active !== false).length})</span>
        </button>

        <a
          href="/admin/dashboard?tab=blogs"
          className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap text-stone-600 hover:text-stone-900 hover:bg-stone-100"
        >
          <BookOpen className="w-4 h-4 text-emerald-600" />
          <span>Blog &amp; SEO Guides</span>
        </a>
      </div>

      {saveSuccessMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 1: CUSTOMER REVIEWS MANAGEMENT                                    */}
      {/* ========================================================================= */}
      {activeSubTab === 'reviews' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E8EDF2]">
            <div>
              <h3 className="text-sm font-bold text-[#163B5C]">Homepage Customer Review Cards</h3>
              <p className="text-xs text-[#64748B]">
                These reviews render on the homepage above the footer to build deep buyer trust and devotion across the US.
              </p>
            </div>
            <button
              type="button"
              onClick={openAddReviewModal}
              className="px-4 py-2 rounded-xl bg-[#ED3500] hover:bg-[#D02E00] text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-all active:scale-95 shrink-0 self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Review Card</span>
            </button>
          </div>

          {loadingReviews ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-[#E8EDF2]">
              <RefreshCw className="w-8 h-8 text-[#0B3B24] animate-spin mx-auto" />
              <p className="text-xs text-[#64748B] mt-2 font-medium">Loading reviews...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-[#E8EDF2] p-8 space-y-3">
              <MessageSquareQuote className="w-12 h-12 text-[#64748B] mx-auto opacity-30" />
              <h4 className="text-base font-bold text-[#163B5C]">No reviews found</h4>
              <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                Add authentic testimonials to inspire confidence in floral freshness, packaging, and timely delivery.
              </p>
              <button
                type="button"
                onClick={openAddReviewModal}
                className="px-4 py-2 rounded-xl bg-[#0B3B24] text-white text-xs font-bold"
              >
                + Add First Review
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reviews.map((rev) => (
                <div
                  key={rev._id}
                  className="bg-white rounded-2xl border border-[#E8EDF2] p-5 shadow-xs hover:border-[#0B3B24]/40 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Header: Rating & Featured Toggle */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3.5 h-3.5 ${
                              star <= (rev.rating || 5)
                                ? 'fill-amber-400 text-amber-400'
                                : 'fill-gray-200 text-gray-200'
                            }`}
                          />
                        ))}
                        <span className="text-xs font-bold text-gray-700 ml-1.5">{rev.rating || 5}.0</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleReviewFeatured(rev)}
                        disabled={togglingReviewId === rev._id}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold transition-all cursor-pointer ${
                          rev.featured !== false
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                            : 'bg-stone-100 text-stone-500 border border-stone-200'
                        }`}
                        title={rev.featured !== false ? 'Featured on Homepage (Click to Hide)' : 'Hidden (Click to Feature)'}
                      >
                        {rev.featured !== false ? (
                          <>
                            <Eye className="w-3 h-3 text-emerald-600" />
                            <span>Featured</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3 text-stone-400" />
                            <span>Hidden</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Comment */}
                    <p className="text-xs text-stone-700 leading-relaxed font-normal line-clamp-4">
                      &ldquo;{rev.comment}&rdquo;
                    </p>
                  </div>

                  {/* Customer Info & Actions */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs text-[#0B3B24] truncate">{rev.customerName}</h4>
                      <p className="text-[11px] text-gray-500 truncate flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5 text-[#C85A78]" />
                        <span>{rev.location || 'USA'}</span>
                      </p>
                      {rev.productName && (
                        <span className="inline-block mt-1 text-[10px] text-emerald-700 font-semibold truncate max-w-[170px]">
                          {rev.productName}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditReviewModal(rev)}
                        className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer"
                        title="Edit Review"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteReview(rev._id)}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Review"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: FOOTER LOCATIONS & PICKUP HUBS MANAGEMENT                      */}
      {/* ========================================================================= */}
      {activeSubTab === 'footerHubs' && (
        <div className="space-y-5">
          <div className="bg-white p-5 rounded-3xl border border-[#E8EDF2] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#163B5C] flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#0B3B24]" />
                  <span>Locations &amp; Pickup Hubs (Footer Box)</span>
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  These physical hub locations appear in Column 4 of the footer across desktop and mobile storefront pages.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddHub}
                  className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Location Hub</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveHubsToSettings}
                  disabled={isSavingSettings}
                  className="px-4 py-2 rounded-xl bg-[#0B3B24] hover:bg-[#134633] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSavingSettings ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>Save Hubs</span>
                </button>
              </div>
            </div>

            {/* List of Hubs */}
            <div className="space-y-4 pt-2">
              {hubsList.map((hub, idx) => (
                <div
                  key={hub.id || idx}
                  className="p-4 rounded-2xl border border-gray-200 bg-stone-50/60 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#0B3B24] flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#0B3B24] flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      <span>{hub.title || 'Location Hub'}</span>
                    </span>

                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 text-xs text-stone-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hub.active !== false}
                          onChange={(e) => handleUpdateHub(idx, 'active', e.target.checked)}
                          className="rounded text-[#0B3B24] focus:ring-[#0B3B24]"
                        />
                        <span>Active on Footer</span>
                      </label>

                      {hubsList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteHub(idx)}
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Remove Hub"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#163B5C] uppercase tracking-wider block">
                        Hub Title / Label *
                      </label>
                      <input
                        type="text"
                        value={hub.title}
                        onChange={(e) => handleUpdateHub(idx, 'title', e.target.value)}
                        placeholder="e.g. Main Location (HQ)"
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white text-xs font-medium focus:outline-none focus:border-[#0B3B24]"
                      />
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[11px] font-bold text-[#163B5C] uppercase tracking-wider block">
                        Full Address *
                      </label>
                      <input
                        type="text"
                        value={hub.address}
                        onChange={(e) => handleUpdateHub(idx, 'address', e.target.value)}
                        placeholder="e.g. 14922 Bobcat lane, Fontana, CA 92336, USA"
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white text-xs font-medium focus:outline-none focus:border-[#0B3B24]"
                      />
                    </div>

                    <div className="space-y-1 md:col-span-3">
                      <label className="text-[11px] font-bold text-[#163B5C] uppercase tracking-wider block">
                        Operating Hours / Schedule (Optional)
                      </label>
                      <input
                        type="text"
                        value={hub.hours || ''}
                        onChange={(e) => handleUpdateHub(idx, 'hours', e.target.value)}
                        placeholder="e.g. Mon – Sun: 7:00 AM – 8:00 PM PST"
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white text-xs font-medium focus:outline-none focus:border-[#0B3B24]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Footer Preview Box */}
            <div className="mt-4 p-4 rounded-2xl bg-[#0B3B24] text-white space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#8FE7B8] block">
                Live Footer Box Preview:
              </span>
              <div className="bg-emerald-950/80 border border-emerald-800/70 rounded-xl p-3.5 space-y-2 text-xs">
                {hubsList.filter((h) => h.active !== false).map((hub, idx) => (
                  <div key={idx} className={idx > 0 ? 'border-t border-emerald-800/50 pt-2' : ''}>
                    <span className="text-[11px] uppercase tracking-wider font-bold text-[#F5C542] flex items-center gap-1.5">
                      {idx === 0 ? <MapPin className="w-3.5 h-3.5" /> : <Building2 className="w-3.5 h-3.5" />}
                      <span>{hub.title}</span>
                    </span>
                    <p className="text-white font-semibold text-xs leading-snug pl-5 mt-1">
                      {hub.address || 'Address not specified'}
                    </p>
                    {hub.hours && (
                      <p className="text-[11px] text-emerald-100 pl-5 mt-1 flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-[#F5C542]" />
                        <span>{hub.hours}</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 3: FOOTER LOCAL PICKUP CITIES (FROM DELIVERY OPTIONS)             */}
      {/* ========================================================================= */}
      {activeSubTab === 'localPickup' && (
        <div className="bg-white p-5 rounded-3xl border border-[#E8EDF2] space-y-5">
          <div>
            <h3 className="text-base font-bold text-[#163B5C] flex items-center gap-2">
              <Navigation className="w-4 h-4 text-[#0B3B24]" />
              <span>Local Pickup Cities (Footer Bottom Strip)</span>
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              These cities populate the horizontal pill bar at the very bottom of the footer. As requested, they are dynamically synced from your Store Settings &rarr; Delivery Options.
            </p>
          </div>

          {/* Quick Add City Input */}
          <div className="p-4 rounded-2xl bg-[#F4F8F4] border border-emerald-900/10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <input
              type="text"
              placeholder="e.g. Phoenix, AZ or Seattle, WA..."
              value={newCityInput}
              onChange={(e) => setNewCityInput(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-xs font-semibold text-stone-800 focus:outline-none focus:border-[#0B3B24]"
            />
            <button
              type="button"
              onClick={handleAddPickupCity}
              className="px-4 py-2.5 rounded-xl bg-[#0B3B24] hover:bg-[#134633] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Pickup City</span>
            </button>
          </div>

          {/* Grid of Pickup Modes */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-[#163B5C] block uppercase tracking-wider">
              Active Store Delivery Options (Type: Pickup)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {currentDeliveryModes
                .filter((m) => m.type === 'pickup')
                .map((mode) => (
                  <div
                    key={mode.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                      mode.active
                        ? 'border-emerald-200 bg-emerald-50/50 text-[#0B3B24]'
                        : 'border-gray-200 bg-stone-50 text-gray-400 opacity-60'
                    }`}
                  >
                    <div className="min-w-0">
                      <span className="font-bold text-xs truncate block">
                        {mode.pickupLocation || mode.name}
                      </span>
                      <span className="text-[10px] text-gray-500 truncate block">
                        {mode.name}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleTogglePickupMode(mode.id)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer shrink-0 ${
                        mode.active
                          ? 'bg-emerald-600 text-white'
                          : 'bg-stone-200 text-stone-600'
                      }`}
                    >
                      {mode.active ? 'Visible' : 'Hidden'}
                    </button>
                  </div>
                ))}
            </div>
          </div>

          {/* Live Footer Strip Preview */}
          <div className="p-4 rounded-2xl bg-[#0B3B24] text-white space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#8FE7B8] block">
              Live Footer Strip Preview:
            </span>
            <div className="py-2.5 px-3.5 rounded-xl bg-white/[0.04] border border-white/10 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-white/90 text-xs flex items-center gap-1.5 shrink-0">
                <Navigation className="w-3.5 h-3.5 text-[#8FE7B8]" />
                <span>Local Pickup Locations:</span>
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {currentDeliveryModes
                  .filter((m) => m.type === 'pickup' && m.active !== false)
                  .map((m) => (
                    <span
                      key={m.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 border border-white/15 text-[11px] text-white/95 font-medium"
                    >
                      <span>{m.pickupLocation || m.name}</span>
                    </span>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD / EDIT REVIEW MODAL                                                  */}
      {/* ========================================================================= */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-[#E8EDF2] shadow-2xl p-6 sm:p-7 relative space-y-5">
            <button
              onClick={() => setIsReviewModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-stone-100 text-stone-500"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-xl font-black text-[#0B3B24]">
                {editingReview ? 'Edit Customer Review Card' : 'Add New Customer Review'}
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Enter genuine customer feedback from temple, wedding, or home puja celebrations.
              </p>
            </div>

            <form onSubmit={handleSaveReview} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#163B5C] uppercase tracking-wider block">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priya Sharma"
                    value={reviewForm.customerName}
                    onChange={(e) => setReviewForm({ ...reviewForm, customerName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold focus:outline-none focus:border-[#0B3B24]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#163B5C] uppercase tracking-wider block">
                    Location / State *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dallas, TX or Bay Area, CA"
                    value={reviewForm.location}
                    onChange={(e) => setReviewForm({ ...reviewForm, location: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold focus:outline-none focus:border-[#0B3B24]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#163B5C] uppercase tracking-wider block">
                    Star Rating (1 - 5)
                  </label>
                  <select
                    value={reviewForm.rating}
                    onChange={(e) => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-[#0B3B24] focus:outline-none focus:border-[#0B3B24]"
                  >
                    <option value="5">★★★★★ (5 Stars - Exceptional)</option>
                    <option value="4">★★★★☆ (4 Stars - Great)</option>
                    <option value="3">★★★☆☆ (3 Stars - Average)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#163B5C] uppercase tracking-wider block">
                    Floral Product (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Fresh Madurai Jasmine (Mallipoo)"
                    value={reviewForm.productName}
                    onChange={(e) => setReviewForm({ ...reviewForm, productName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-medium focus:outline-none focus:border-[#0B3B24]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#163B5C] uppercase tracking-wider block">
                  Customer Review Comment *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="The garlands arrived cold and dewy fresh for our temple wedding..."
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs leading-relaxed focus:outline-none focus:border-[#0B3B24]"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                <div>
                  <span className="text-xs font-bold text-[#163B5C] block">Featured on Homepage</span>
                  <span className="text-[10.5px] text-[#64748B] block">Show this review in the public homepage carousel.</span>
                </div>
                <input
                  type="checkbox"
                  checked={reviewForm.featured}
                  onChange={(e) => setReviewForm({ ...reviewForm, featured: e.target.checked })}
                  className="w-4 h-4 rounded text-[#0B3B24] focus:ring-[#0B3B24]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="px-6 py-2.5 rounded-xl bg-[#0B3B24] hover:bg-[#134633] text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmittingReview ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>{editingReview ? 'Save Changes' : 'Publish Review Card'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
