'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { formatCurrency } from '@/lib/currency';
import { US_STATES } from '@/lib/tax/jurisdiction';
import {
  Users,
  Search,
  RefreshCw,
  ShoppingBag,
  DollarSign,
  MapPin,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  XCircle,
  Eye,
  Download,
  Filter,
  Package,
  Clock,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  ChevronDown,
  X,
} from 'lucide-react';

interface OrderItem {
  productId?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CustomerOrder {
  _id: string;
  orderId: string;
  createdAt: string;
  totalAmount: number;
  deliveryCharge: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  deliveryAddress: string;
  district?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  items: OrderItem[];
}

interface CustomerRecord {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  aptSuite?: string;
  city: string;
  district?: string;
  state: string;
  zipCode: string;
  country: string;
  isActive: boolean;
  role: string;
  createdAt: string;
  updatedAt: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string | null;
  orders: CustomerOrder[];
}

export default function CustomersTab() {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');
  const [stateFilter, setStateFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'SPENT_DESC' | 'ORDERS_DESC' | 'NAME_ASC'>('NEWEST');

  // Selected customer for modal
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  const fetchCustomers = async (showRefreshSpinner = false) => {
    try {
      if (showRefreshSpinner) setRefreshing(true);
      else setLoading(true);

      const res = await fetch(`/api/admin/customers?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setCustomers(data.data);
        if (data.stats) setStats(data.stats);

        if (selectedCustomer) {
          const updated = data.data.find((c: CustomerRecord) => c._id === selectedCustomer._id);
          if (updated) setSelectedCustomer(updated);
        }
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleToggleCustomerStatus = async (customer: CustomerRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newStatus = !customer.isActive;
    const confirmMsg = newStatus
      ? `Re-activate customer account for "${customer.name}"?`
      : `Suspend customer account for "${customer.name}"? They will not be able to log in.`;

    if (!confirm(confirmMsg)) return;

    try {
      setUpdatingStatusId(customer._id);
      const res = await fetch('/api/admin/customers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customer._id,
          isActive: newStatus,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCustomers((prev) =>
          prev.map((c) => (c._id === customer._id ? { ...c, isActive: newStatus } : c))
        );
        if (selectedCustomer && selectedCustomer._id === customer._id) {
          setSelectedCustomer((prev) => (prev ? { ...prev, isActive: newStatus } : null));
        }
      } else {
        alert(data.message || 'Failed to update customer status.');
      }
    } catch (err) {
      console.error('Error updating customer status:', err);
      alert('Network error while updating customer status.');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // Filter and Sort Customers
  const filteredCustomers = useMemo(() => {
    return customers
      .filter((c) => {
        if (statusFilter === 'ACTIVE' && !c.isActive) return false;
        if (statusFilter === 'SUSPENDED' && c.isActive) return false;
        if (stateFilter !== 'ALL' && c.state.toUpperCase() !== stateFilter.toUpperCase()) return false;

        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim();
          const matchName = c.name.toLowerCase().includes(query);
          const matchEmail = c.email.toLowerCase().includes(query);
          const matchPhone = c.phone.includes(query);
          const matchCity = c.city.toLowerCase().includes(query);
          const matchState = c.state.toLowerCase().includes(query);
          const matchZip = c.zipCode.includes(query);
          const matchDistrict = (c.district || '').toLowerCase().includes(query);
          return matchName || matchEmail || matchPhone || matchCity || matchState || matchZip || matchDistrict;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'NEWEST') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'SPENT_DESC') {
          return b.totalSpent - a.totalSpent;
        }
        if (sortBy === 'ORDERS_DESC') {
          return b.totalOrders - a.totalOrders;
        }
        if (sortBy === 'NAME_ASC') {
          return a.name.localeCompare(b.name);
        }
        return 0;
      });
  }, [customers, statusFilter, stateFilter, searchQuery, sortBy]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Customer ID',
      'Name',
      'Email',
      'Phone',
      'Address',
      'Apt/Suite',
      'City',
      'District',
      'State',
      'ZIP Code',
      'Country',
      'Status',
      'Total Orders',
      'Total Spent ($)',
      'Joined Date',
      'Last Order Date',
    ];

    const rows = filteredCustomers.map((c) => [
      `"${c._id}"`,
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.email.replace(/"/g, '""')}"`,
      `"${c.phone.replace(/"/g, '""')}"`,
      `"${(c.address || '').replace(/"/g, '""')}"`,
      `"${(c.aptSuite || '').replace(/"/g, '""')}"`,
      `"${(c.city || '').replace(/"/g, '""')}"`,
      `"${(c.district || '').replace(/"/g, '""')}"`,
      `"${c.state || ''}"`,
      `"${c.zipCode || ''}"`,
      `"${c.country || 'US'}"`,
      `"${c.isActive ? 'Active' : 'Suspended'}"`,
      c.totalOrders,
      c.totalSpent.toFixed(2),
      `"${new Date(c.createdAt).toLocaleDateString()}"`,
      `"${c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString() : 'N/A'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `indian_flowers_customers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. METRIC CARDS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Customers */}
        <div className="bg-white rounded-2xl border border-[#E8EDF2] p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
              Registered Users
            </span>
            <span className="text-xl sm:text-2xl font-black text-[#163B5C] mt-1 block">
              {stats.totalCustomers}
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">
              100% US Customer Accounts
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Active Accounts */}
        <div className="bg-white rounded-2xl border border-[#E8EDF2] p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
              Active Accounts
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-700 mt-1 block">
              {stats.activeCustomers}
            </span>
            <span className="text-[10px] text-[#64748B] font-medium mt-0.5 block">
              {stats.totalCustomers > 0
                ? `${Math.round((stats.activeCustomers / stats.totalCustomers) * 100)}% active rate`
                : 'Zero registered'}
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Customer Orders */}
        <div className="bg-white rounded-2xl border border-[#E8EDF2] p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
              Customer Orders
            </span>
            <span className="text-xl sm:text-2xl font-black text-[#163B5C] mt-1 block">
              {stats.totalOrders}
            </span>
            <span className="text-[10px] text-[#64748B] font-medium mt-0.5 block">
              Online &amp; Walk-In orders
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 shadow-2xs">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        {/* Total Spend */}
        <div className="bg-white rounded-2xl border border-[#E8EDF2] p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
              Lifetime Revenue
            </span>
            <span className="text-xl sm:text-2xl font-black text-[#ED3500] mt-1 block">
              {formatCurrency(stats.totalRevenue)}
            </span>
            <span className="text-[10px] text-emerald-700 font-semibold mt-0.5 block">
              $ USD Verified
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#FFF8F5] text-[#ED3500] flex items-center justify-center shrink-0 shadow-2xs">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. FILTER & SEARCH CONTROLS CARD */}
      <div className="bg-white rounded-2xl border border-[#E8EDF2] p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by customer name, email, phone, city, state, or ZIP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#E8EDF2] text-xs font-medium focus:outline-none focus:border-[#ED3500] bg-slate-50/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="appearance-none bg-slate-50/70 border border-[#E8EDF2] text-[#163B5C] text-xs font-bold py-2 pl-3 pr-8 rounded-xl focus:outline-none focus:border-[#ED3500]"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Only</option>
                <option value="SUSPENDED">Suspended Only</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* US State Filter */}
            <div className="relative">
              <select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="appearance-none bg-slate-50/70 border border-[#E8EDF2] text-[#163B5C] text-xs font-bold py-2 pl-3 pr-8 rounded-xl focus:outline-none focus:border-[#ED3500]"
              >
                <option value="ALL">All States</option>
                {Object.entries(US_STATES).map(([code, name]) => (
                  <option key={code} value={code}>
                    {code} — {name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="appearance-none bg-slate-50/70 border border-[#E8EDF2] text-[#163B5C] text-xs font-bold py-2 pl-3 pr-8 rounded-xl focus:outline-none focus:border-[#ED3500]"
              >
                <option value="NEWEST">Newest Registered</option>
                <option value="SPENT_DESC">Highest Spend</option>
                <option value="ORDERS_DESC">Most Orders</option>
                <option value="NAME_ASC">Name (A-Z)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Actions */}
            <button
              onClick={handleExportCSV}
              disabled={filteredCustomers.length === 0}
              className="px-3.5 py-2 rounded-xl bg-white border border-[#E8EDF2] hover:bg-slate-50 text-[#163B5C] text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-2xs"
              title="Export Customer Data to CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <button
              onClick={() => fetchCustomers(true)}
              disabled={refreshing}
              className="p-2 rounded-xl bg-white border border-[#E8EDF2] hover:bg-slate-50 text-[#163B5C] text-xs font-bold transition-colors disabled:opacity-50 shadow-2xs"
              title="Refresh Customer List"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#ED3500] ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Active Filter Tags */}
        <div className="flex items-center justify-between text-xs text-[#64748B] pt-1">
          <span>
            Showing <strong className="text-[#163B5C]">{filteredCustomers.length}</strong> of{' '}
            <strong className="text-[#163B5C]">{customers.length}</strong> registered customer accounts
          </span>
          {(searchQuery || statusFilter !== 'ALL' || stateFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
                setStateFilter('ALL');
              }}
              className="text-[#ED3500] hover:underline font-bold"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* 3. CUSTOMERS DATA TABLE & RESPONSIVE CARDS */}
      <div className="bg-white rounded-2xl border border-[#E8EDF2] shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-[#64748B]">
            <RefreshCw className="w-8 h-8 text-[#ED3500] animate-spin mx-auto mb-2" />
            <p className="text-xs font-bold text-[#163B5C]">Loading customer accounts...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="py-16 text-center text-[#64748B]">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-[#163B5C]">No Customers Found</h3>
            <p className="text-xs mt-1">
              {searchQuery || statusFilter !== 'ALL' || stateFilter !== 'ALL'
                ? 'No customer accounts match your current filter settings.'
                : 'No customers have registered on Indian-Flowers.com yet.'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#FFFCFB] border-b border-[#E8EDF2] text-[#64748B] font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Contact Info</th>
                    <th className="py-3 px-4">US Postal Address</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Orders</th>
                    <th className="py-3 px-4 text-right">Lifetime Spend</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8EDF2]">
                  {filteredCustomers.map((c) => (
                    <tr
                      key={c._id}
                      onClick={() => setSelectedCustomer(c)}
                      className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                    >
                      {/* Name & Joined */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center font-extrabold text-sm shrink-0">
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-[#163B5C] block text-sm">{c.name}</span>
                            <span className="text-[10px] text-[#64748B]">
                              Joined {new Date(c.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-[#163B5C] block">{c.email}</span>
                        <span className="text-[11px] text-[#64748B]">{c.phone}</span>
                      </td>

                      {/* Address */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <span className="text-[#374151] block truncate">{c.address}</span>
                        <span className="text-[11px] text-[#64748B] block">
                          {c.city}, {c.state} {c.zipCode}
                          {c.district ? ` (${c.district})` : ''}
                        </span>
                      </td>

                      {/* Status Toggle */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={(e) => handleToggleCustomerStatus(c, e)}
                          disabled={updatingStatusId === c._id}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold transition-all ${
                            c.isActive
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                          }`}
                          title="Click to toggle account status"
                        >
                          {updatingStatusId === c._id ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : c.isActive ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          <span>{c.isActive ? 'Active' : 'Suspended'}</span>
                        </button>
                      </td>

                      {/* Orders */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-extrabold text-[#163B5C] text-sm">{c.totalOrders}</span>
                        <span className="text-[10px] text-[#64748B] block">
                          {c.lastOrderDate ? `Last: ${new Date(c.lastOrderDate).toLocaleDateString()}` : 'No orders'}
                        </span>
                      </td>

                      {/* Total Spend */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-extrabold text-emerald-700 text-sm block">
                          {formatCurrency(c.totalSpent)}
                        </span>
                        <span className="text-[10px] text-[#64748B]">USD ($)</span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCustomer(c);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#163B5C] text-xs font-bold inline-flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#ED3500]" />
                          <span>Details</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards (Visible on screens < md) */}
            <div className="md:hidden divide-y divide-[#E8EDF2]">
              {filteredCustomers.map((c) => (
                <div
                  key={c._id}
                  onClick={() => setSelectedCustomer(c)}
                  className="p-4 space-y-3 hover:bg-slate-50/60 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center font-extrabold text-sm shrink-0">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-bold text-[#163B5C] text-sm block">{c.name}</span>
                        <span className="text-[10px] text-[#64748B]">
                          Joined {new Date(c.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {c.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </div>

                  <div className="text-xs text-[#374151] space-y-1 bg-slate-50 p-2.5 rounded-xl">
                    <div className="flex items-center gap-1.5 text-[#64748B]">
                      <Mail className="w-3.5 h-3.5 text-[#ED3500]" />
                      <span className="text-[#163B5C] font-medium truncate">{c.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#64748B]">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-[#163B5C] font-medium">{c.phone}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#64748B]">
                      <MapPin className="w-3.5 h-3.5 text-purple-600" />
                      <span className="truncate">
                        {c.city}, {c.state} {c.zipCode}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-4 text-xs">
                      <div>
                        <span className="text-[10px] text-[#64748B] block uppercase">Orders</span>
                        <span className="font-bold text-[#163B5C]">{c.totalOrders}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#64748B] block uppercase">Spent</span>
                        <span className="font-bold text-emerald-700">{formatCurrency(c.totalSpent)}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCustomer(c);
                      }}
                      className="px-3 py-1 rounded-lg bg-[#163B5C] text-white text-xs font-bold flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" /> Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* 4. CUSTOMER PROFILE & ORDER HISTORY MODAL */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#E8EDF2] w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-[#163B5C] to-[#0F2A42] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center font-black text-lg">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base sm:text-lg">{selectedCustomer.name}</h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        selectedCustomer.isActive
                          ? 'bg-emerald-500 text-white'
                          : 'bg-rose-500 text-white'
                      }`}
                    >
                      {selectedCustomer.isActive ? 'ACTIVE' : 'SUSPENDED'}
                    </span>
                  </div>
                  <span className="text-xs text-white/70 block">
                    Registered on {new Date(selectedCustomer.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Profile Details Card */}
              <div className="bg-slate-50 rounded-2xl border border-[#E8EDF2] p-4 sm:p-5 space-y-4">
                <h4 className="text-xs font-bold text-[#163B5C] uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#ED3500]" />
                  <span>US Registration &amp; Contact Details</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="bg-white p-3 rounded-xl border border-[#E8EDF2]">
                    <span className="text-[10px] font-bold text-[#64748B] uppercase block">Email Address</span>
                    <span className="font-bold text-[#163B5C] text-sm break-all">{selectedCustomer.email}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-[#E8EDF2]">
                    <span className="text-[10px] font-bold text-[#64748B] uppercase block">Phone Number</span>
                    <span className="font-bold text-[#163B5C] text-sm">{selectedCustomer.phone}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-[#E8EDF2]">
                    <span className="text-[10px] font-bold text-[#64748B] uppercase block">Account ID</span>
                    <span className="font-mono text-[11px] text-[#64748B] break-all">{selectedCustomer._id}</span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-[#E8EDF2] space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#163B5C]">
                    <MapPin className="w-3.5 h-3.5 text-[#ED3500]" />
                    <span>Default US Shipping &amp; Delivery Address:</span>
                  </div>
                  <div className="text-sm font-medium text-[#111827] pl-5 space-y-0.5">
                    <p>{selectedCustomer.address}</p>
                    {selectedCustomer.aptSuite && <p className="text-xs text-[#64748B]">{selectedCustomer.aptSuite}</p>}
                    <p className="text-xs font-bold text-[#163B5C]">
                      {selectedCustomer.city}, {selectedCustomer.state} {selectedCustomer.zipCode}
                    </p>
                    {selectedCustomer.district && (
                      <p className="text-xs text-[#64748B]">District / County: {selectedCustomer.district}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-[#64748B]">
                    Status: <strong>{selectedCustomer.isActive ? 'Active customer' : 'Suspended customer'}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggleCustomerStatus(selectedCustomer)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                      selectedCustomer.isActive
                        ? 'bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    {selectedCustomer.isActive ? 'Suspend Account' : 'Reactivate Account'}
                  </button>
                </div>
              </div>

              {/* Order History */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#163B5C] uppercase tracking-wider flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-purple-600" />
                    <span>Customer Order History ({selectedCustomer.orders.length} orders)</span>
                  </h4>
                  <span className="text-xs font-extrabold text-emerald-700">
                    Total Spend: {formatCurrency(selectedCustomer.totalSpent)}
                  </span>
                </div>

                {selectedCustomer.orders.length === 0 ? (
                  <div className="p-8 rounded-2xl border border-dashed border-[#E8EDF2] text-center text-[#64748B]">
                    <ShoppingBag className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs font-medium">This customer has not placed any orders yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedCustomer.orders.map((order) => (
                      <div
                        key={order._id}
                        className="bg-white rounded-2xl border border-[#E8EDF2] p-4 shadow-xs space-y-2.5"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E8EDF2] pb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-[#163B5C]">{order.orderId}</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                order.status === 'Completed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : order.status === 'Cancelled'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {order.status}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                order.paymentStatus === 'Paid'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {order.paymentStatus} ({order.paymentMethod})
                            </span>
                          </div>
                          <span className="text-[11px] text-[#64748B]">
                            {new Date(order.createdAt).toLocaleString()}
                          </span>
                        </div>

                        {/* Order Items */}
                        <div className="space-y-1.5 pl-1">
                          {order.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs">
                              <span className="text-[#163B5C] font-semibold">
                                {it.name} <span className="text-[#64748B]">× {it.quantity}</span>
                              </span>
                              <span className="font-bold text-[#163B5C]">
                                {formatCurrency(it.price * it.quantity)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Total Footer */}
                        <div className="flex justify-between items-center pt-2 border-t border-[#E8EDF2] font-bold text-xs">
                          <span className="text-[#64748B]">Order Total:</span>
                          <span className="text-sm font-extrabold text-[#ED3500]">
                            {formatCurrency(order.totalAmount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-[#E8EDF2] flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="px-5 py-2 rounded-xl bg-[#163B5C] text-white text-xs font-bold hover:bg-[#0F2A42] transition-colors"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
