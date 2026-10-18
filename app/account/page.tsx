'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BrandLogo from '@/components/BrandLogo';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Building,
  Package,
  LogOut,
  Edit3,
  Save,
  X,
  AlertCircle,
  CheckCircle2,
  Clock,
  Truck,
  ShoppingBag,
} from 'lucide-react';
import { US_STATES } from '@/lib/tax/jurisdiction';
import { formatCurrency } from '@/lib/currency';

export default function AccountPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'profile' | 'orders'>('profile');
  const [customer, setCustomer] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    address: '',
    aptSuite: '',
    city: '',
    district: '',
    state: 'CA',
    zipCode: '',
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tabParam = new URLSearchParams(window.location.search).get('tab');
      if (tabParam === 'orders') {
        setActiveTab('orders');
        fetchOrders();
      }
    }
    fetchCustomer();
  }, []);

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/customer/me');
      const data = await res.json();
      if (res.ok && data.success && data.customer) {
        setCustomer(data.customer);
        setEditForm({
          name: data.customer.name || '',
          phone: data.customer.phone || '',
          address: data.customer.address || '',
          aptSuite: data.customer.aptSuite || '',
          city: data.customer.city || '',
          district: data.customer.district || '',
          state: data.customer.state || 'CA',
          zipCode: data.customer.zipCode || '',
        });
      } else {
        router.push('/login?redirect=account');
      }
    } catch {
      router.push('/login?redirect=account');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      const res = await fetch('/api/customer/orders');
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.orders)) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleTabChange = (tab: 'profile' | 'orders') => {
    setActiveTab(tab);
    if (tab === 'orders' && orders.length === 0) {
      fetchOrders();
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError('');
    setEditSuccess('');

    try {
      setEditLoading(true);
      const res = await fetch('/api/customer/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCustomer(data.customer);
        setIsEditing(false);
        setEditSuccess('Your profile and shipping details have been updated.');
      } else {
        setEditError(data.message || 'Failed to update profile.');
      }
    } catch {
      setEditError('Connection error. Please try again.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/customer/logout', { method: 'POST' });
      router.push('/');
      router.refresh();
    } catch {
      router.push('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex items-center justify-center font-sans">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-[#0B3B24] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs sm:text-sm text-gray-600 font-medium">Loading customer account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col justify-between font-sans">
      {/* Storefront Header */}
      <Header customer={customer} onCustomerChange={setCustomer} />

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-3.5 sm:p-6 my-4 sm:my-6">
        {/* Welcome Card */}
        <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs p-4 sm:p-6 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-lg sm:text-xl font-bold text-[#0B3B24] shrink-0 shadow-2xs">
              {customer?.name ? customer.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 tracking-tight truncate">
                {customer?.name}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 truncate">{customer?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Verified US Customer
                </span>
                <span className="text-[11px] text-gray-400">
                  Member since {customer?.createdAt ? new Date(customer.createdAt).toLocaleDateString() : '2026'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-stone-200 text-xs font-semibold text-gray-700 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 mb-6 overflow-x-auto scrollbar-none">
          <button
            onClick={() => handleTabChange('profile')}
            className={`pb-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'profile'
                ? 'border-[#0B3B24] text-[#0B3B24]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile &amp; Delivery Address</span>
          </button>
          <button
            onClick={() => handleTabChange('orders')}
            className={`pb-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'orders'
                ? 'border-[#0B3B24] text-[#0B3B24]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Order History</span>
          </button>
        </div>

        {/* Tab 1: Profile & Delivery Address */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900">Delivery Address &amp; Contact Info</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  This address is automatically pre-filled when you checkout on Indian-Flowers.com
                </p>
              </div>
              {!isEditing && (
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setEditSuccess('');
                    setEditError('');
                  }}
                  className="self-start sm:self-auto shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#0B3B24] text-[#0B3B24] hover:bg-emerald-50 text-xs font-semibold transition-colors shadow-2xs whitespace-nowrap cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Details</span>
                </button>
              )}
            </div>

            {editSuccess && (
              <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{editSuccess}</span>
              </div>
            )}

            {editError && (
              <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-xs sm:text-sm text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            {isEditing ? (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:border-[#0B3B24] focus:ring-2 focus:ring-[#0B3B24]/10"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Phone Number (US)
                    </label>
                    <input
                      type="tel"
                      required
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:border-[#0B3B24] focus:ring-2 focus:ring-[#0B3B24]/10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:border-[#0B3B24] focus:ring-2 focus:ring-[#0B3B24]/10"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Apartment / Suite (Optional)
                  </label>
                  <input
                    type="text"
                    value={editForm.aptSuite}
                    onChange={(e) => setEditForm({ ...editForm, aptSuite: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:border-[#0B3B24] focus:ring-2 focus:ring-[#0B3B24]/10"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.city}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:border-[#0B3B24] focus:ring-2 focus:ring-[#0B3B24]/10"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      District / County
                    </label>
                    <input
                      type="text"
                      value={editForm.district}
                      onChange={(e) => setEditForm({ ...editForm, district: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:border-[#0B3B24] focus:ring-2 focus:ring-[#0B3B24]/10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      US State
                    </label>
                    <select
                      value={editForm.state}
                      onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm bg-white focus:outline-none focus:border-[#0B3B24] focus:ring-2 focus:ring-[#0B3B24]/10"
                    >
                      {Object.entries(US_STATES).map(([code, name]) => (
                        <option key={code} value={code}>
                          {code} — {name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      ZIP Code (5 Digits)
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={10}
                      value={editForm.zipCode}
                      onChange={(e) => setEditForm({ ...editForm, zipCode: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:border-[#0B3B24] focus:ring-2 focus:ring-[#0B3B24]/10"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="px-5 py-2.5 rounded-xl bg-[#0B3B24] hover:bg-[#1C563F] text-white text-xs sm:text-sm font-semibold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editLoading ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs sm:text-sm font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div className="p-4 rounded-xl bg-stone-50/80 border border-stone-200/80">
                  <span className="block text-[11px] uppercase tracking-wider text-gray-500 font-bold mb-1.5">
                    Contact Person
                  </span>
                  <p className="font-bold text-gray-900 text-sm sm:text-base">{customer?.name}</p>
                  <p className="text-gray-700 mt-1 font-medium">{customer?.phone}</p>
                  <p className="text-gray-600 font-medium">{customer?.email}</p>
                </div>

                <div className="p-4 rounded-xl bg-stone-50/80 border border-stone-200/80">
                  <span className="block text-[11px] uppercase tracking-wider text-gray-500 font-bold mb-1.5">
                    US Shipping Address
                  </span>
                  <p className="font-bold text-gray-900">{customer?.address}</p>
                  {customer?.aptSuite && (
                    <p className="text-gray-600 font-medium">{customer.aptSuite}</p>
                  )}
                  <p className="text-gray-800 mt-0.5 font-medium">
                    {customer?.city}
                    {customer?.district ? `, ${customer.district}` : ''},{' '}
                    {customer?.state} {customer?.zipCode}
                  </p>
                  <p className="text-emerald-800 font-semibold text-xs mt-1.5 flex items-center gap-1">
                    <span>🇺🇸 United States (Domestic Delivery)</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Order History */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {ordersLoading ? (
              <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
                <div className="w-7 h-7 border-3 border-[#0B3B24] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs sm:text-sm text-gray-500">Loading your orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
                <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-gray-800">No Orders Placed Yet</h3>
                <p className="text-xs sm:text-sm text-gray-500 max-w-sm mx-auto mt-1 mb-5">
                  When you order fresh garlands, flowers, or puja essentials, your order status and tracking details will appear here.
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B3B24] hover:bg-[#1C563F] text-white text-xs sm:text-sm font-semibold transition-all shadow-xs"
                >
                  Start Shopping
                </Link>
              </div>
            ) : (
              orders.map((ord: any) => (
                <div
                  key={ord._id || ord.orderId}
                  className="bg-white rounded-2xl border border-stone-200 shadow-xs p-5 sm:p-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-sm sm:text-base">
                          {ord.orderId}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            ord.status === 'Completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ord.status === 'Processing'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {ord.status || 'Pending'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Placed on {new Date(ord.createdAt).toLocaleDateString()} at{' '}
                        {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-xs text-gray-400 block">Total Amount (USD)</span>
                      <span className="text-base sm:text-lg font-bold text-[#0B3B24]">
                        {formatCurrency(ord.totalAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="py-3 divide-y divide-gray-50">
                    {ord.items?.map((item: any, idx: number) => (
                      <div key={idx} className="py-2 flex items-center justify-between text-xs sm:text-sm">
                        <div className="flex items-center gap-2.5">
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-10 h-10 object-cover rounded-lg border border-gray-100"
                            />
                          )}
                          <div>
                            <span className="font-semibold text-gray-800 block">{item.name}</span>
                            <span className="text-gray-400 text-xs">Qty: {item.quantity}</span>
                          </div>
                        </div>
                        <span className="font-bold text-gray-700">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Shipping & Payment summary */}
                  <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row justify-between text-xs text-gray-500 gap-2">
                    <div>
                      <strong className="text-gray-700">Delivery Address:</strong>{' '}
                      <span>{ord.shippingAddress || ord.streetAddress}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span>
                        Payment: <strong>{ord.paymentMethod}</strong> ({ord.paymentStatus})
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Storefront Footer */}
      <Footer />
    </div>
  );
}
