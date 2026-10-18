'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { formatCurrency } from '@/lib/currency';
import { US_STATES } from '@/lib/tax/jurisdiction';
import {
  FileSpreadsheet,
  Download,
  Filter,
  RefreshCw,
  ShoppingBag,
  CreditCard,
  Users,
  TrendingUp,
  TrendingDown,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  ChevronDown,
  RotateCcw,
  DollarSign,
  Package,
  Layers,
  MapPin,
  ShieldCheck,
  Search,
  X,
} from 'lucide-react';

type ReportTab = 'orders' | 'payments' | 'customers' | 'pnl';

export default function ReportsTab() {
  const [activeTab, setActiveTab] = useState<ReportTab>('orders');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Global KPI Metrics
  const [kpiStats, setKpiStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    netProfit: 0,
    isProfit: true,
  });

  // Filter States
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [datePreset, setDatePreset] = useState<'ALL' | 'TODAY' | 'YESTERDAY' | 'LAST_7' | 'THIS_MONTH' | 'LAST_30' | 'THIS_YEAR'>('ALL');

  // Orders & Payments Common Filters
  const [orderStatus, setOrderStatus] = useState('ALL');
  const [paymentStatus, setPaymentStatus] = useState('ALL');
  const [orderChannel, setOrderChannel] = useState('ALL');
  const [refundFilter, setRefundFilter] = useState('ALL'); // 'ALL' | 'REFUNDED_ONLY' | 'EXCLUDE_REFUNDS'

  // Payments Filters
  const [payMethod, setPayMethod] = useState('ALL');

  // Customers Filters
  const [customerStatus, setCustomerStatus] = useState('ALL');
  const [customerState, setCustomerState] = useState('ALL');

  // Data States
  const [ordersData, setOrdersData] = useState<any[]>([]);
  const [ordersSummary, setOrdersSummary] = useState<any>(null);

  const [paymentsData, setPaymentsData] = useState<any[]>([]);
  const [paymentsSummary, setPaymentsSummary] = useState<any>(null);

  const [customersData, setCustomersData] = useState<any[]>([]);
  const [customersSummary, setCustomersSummary] = useState<any>(null);

  const [pnlSummary, setPnlSummary] = useState<any>(null);
  const [pnlExpenses, setPnlExpenses] = useState<any[]>([]);
  const [pnlPurchases, setPnlPurchases] = useState<any[]>([]);

  // Search filter for preview table
  const [tableSearch, setTableSearch] = useState('');

  // Handle Preset Date selection
  const handleDatePreset = (preset: typeof datePreset) => {
    setDatePreset(preset);
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const toYMD = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (preset === 'ALL') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'TODAY') {
      const todayStr = toYMD(now);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'YESTERDAY') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yStr = toYMD(y);
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (preset === 'LAST_7') {
      const past = new Date();
      past.setDate(past.getDate() - 7);
      setStartDate(toYMD(past));
      setEndDate(toYMD(now));
    } else if (preset === 'THIS_MONTH') {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(toYMD(first));
      setEndDate(toYMD(now));
    } else if (preset === 'LAST_30') {
      const past = new Date();
      past.setDate(past.getDate() - 30);
      setStartDate(toYMD(past));
      setEndDate(toYMD(now));
    } else if (preset === 'THIS_YEAR') {
      const first = new Date(now.getFullYear(), 0, 1);
      setStartDate(toYMD(first));
      setEndDate(toYMD(now));
    }
  };

  // Reset all filters to "All Without Filter"
  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setDatePreset('ALL');
    setOrderStatus('ALL');
    setPaymentStatus('ALL');
    setOrderChannel('ALL');
    setRefundFilter('ALL');
    setPayMethod('ALL');
    setCustomerStatus('ALL');
    setCustomerState('ALL');
    setTableSearch('');
  };

  // Fetch report data
  const fetchReportData = async (tabToFetch: ReportTab = activeTab) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('type', tabToFetch);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      if (tabToFetch === 'orders') {
        if (orderStatus !== 'ALL') params.append('status', orderStatus);
        if (paymentStatus !== 'ALL') params.append('paymentStatus', paymentStatus);
        if (orderChannel !== 'ALL') params.append('orderType', orderChannel);
        if (refundFilter !== 'ALL') params.append('refundFilter', refundFilter);
      } else if (tabToFetch === 'payments') {
        if (paymentStatus !== 'ALL') params.append('paymentStatus', paymentStatus);
        if (payMethod !== 'ALL') params.append('paymentMethod', payMethod);
        if (orderChannel !== 'ALL') params.append('orderType', orderChannel);
        if (refundFilter !== 'ALL') params.append('refundFilter', refundFilter);
      } else if (tabToFetch === 'customers') {
        if (customerStatus !== 'ALL') params.append('customerStatus', customerStatus);
        if (customerState !== 'ALL') params.append('state', customerState);
      }

      const res = await fetch(`/api/admin/reports?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to load report data');
      }

      const data = await res.json();
      if (data.success) {
        if (tabToFetch === 'orders') {
          setOrdersData(data.data || []);
          setOrdersSummary(data.summary || null);
        } else if (tabToFetch === 'payments') {
          setPaymentsData(data.data || []);
          setPaymentsSummary(data.summary || null);
        } else if (tabToFetch === 'customers') {
          setCustomersData(data.data || []);
          setCustomersSummary(data.summary || null);
        } else if (tabToFetch === 'pnl') {
          setPnlSummary(data.summary || null);
          setPnlExpenses(data.expenses || []);
          setPnlPurchases(data.purchases || []);
        }
      }
    } catch (err) {
      console.error('Fetch report error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch KPI Stats on mount
  const fetchKPIs = async () => {
    try {
      const [ordRes, custRes, pnlRes] = await Promise.all([
        fetch('/api/admin/reports?type=orders'),
        fetch('/api/admin/reports?type=customers'),
        fetch('/api/admin/reports?type=pnl'),
      ]);
      const ord = await ordRes.json();
      const cust = await custRes.json();
      const pnl = await pnlRes.json();

      setKpiStats({
        totalOrders: ord.summary?.totalOrders || 0,
        totalRevenue: ord.summary?.totalRevenue || 0,
        totalCustomers: cust.summary?.totalCustomers || 0,
        netProfit: pnl.summary?.netProfit || 0,
        isProfit: pnl.summary?.isProfit ?? true,
      });
    } catch (e) {
      console.error('Failed to load KPIs:', e);
    }
  };

  useEffect(() => {
    fetchKPIs();
  }, []);

  useEffect(() => {
    fetchReportData(activeTab);
  }, [
    activeTab,
    startDate,
    endDate,
    orderStatus,
    paymentStatus,
    orderChannel,
    refundFilter,
    payMethod,
    customerStatus,
    customerState,
  ]);

  // Direct Excel Download Handler
  const handleDownloadExcel = () => {
    setDownloading(true);
    try {
      const params = new URLSearchParams();
      params.append('type', activeTab);
      params.append('format', 'excel');
      params.append('download', 'true');
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      if (activeTab === 'orders') {
        if (orderStatus !== 'ALL') params.append('status', orderStatus);
        if (paymentStatus !== 'ALL') params.append('paymentStatus', paymentStatus);
        if (orderChannel !== 'ALL') params.append('orderType', orderChannel);
        if (refundFilter !== 'ALL') params.append('refundFilter', refundFilter);
      } else if (activeTab === 'payments') {
        if (paymentStatus !== 'ALL') params.append('paymentStatus', paymentStatus);
        if (payMethod !== 'ALL') params.append('paymentMethod', payMethod);
        if (orderChannel !== 'ALL') params.append('orderType', orderChannel);
        if (refundFilter !== 'ALL') params.append('refundFilter', refundFilter);
      } else if (activeTab === 'customers') {
        if (customerStatus !== 'ALL') params.append('customerStatus', customerStatus);
        if (customerState !== 'ALL') params.append('state', customerState);
      }

      const downloadUrl = `/api/admin/reports?${params.toString()}`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', '');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('Download error:', e);
    } finally {
      setTimeout(() => setDownloading(false), 1200);
    }
  };

  // Filtered Preview Data
  const filteredOrders = useMemo(() => {
    if (!tableSearch.trim()) return ordersData;
    const q = tableSearch.toLowerCase();
    return ordersData.filter(
      (o) =>
        (o.orderId && o.orderId.toLowerCase().includes(q)) ||
        (o.customerName && o.customerName.toLowerCase().includes(q)) ||
        (o.customerPhone && o.customerPhone.includes(q)) ||
        (o.customerEmail && o.customerEmail.toLowerCase().includes(q)) ||
        (o.city && o.city.toLowerCase().includes(q)) ||
        (o.state && o.state.toLowerCase().includes(q))
    );
  }, [ordersData, tableSearch]);

  const filteredPayments = useMemo(() => {
    if (!tableSearch.trim()) return paymentsData;
    const q = tableSearch.toLowerCase();
    return paymentsData.filter(
      (p) =>
        (p.orderId && p.orderId.toLowerCase().includes(q)) ||
        (p.transactionId && p.transactionId.toLowerCase().includes(q)) ||
        (p.customerName && p.customerName.toLowerCase().includes(q)) ||
        (p.paymentMethod && p.paymentMethod.toLowerCase().includes(q))
    );
  }, [paymentsData, tableSearch]);

  const filteredCustomers = useMemo(() => {
    if (!tableSearch.trim()) return customersData;
    const q = tableSearch.toLowerCase();
    return customersData.filter(
      (c) =>
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q)) ||
        (c.city && c.city.toLowerCase().includes(q)) ||
        (c.state && c.state.toLowerCase().includes(q)) ||
        (c.zipCode && c.zipCode.includes(q))
    );
  }, [customersData, tableSearch]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (startDate || endDate) count++;
    if (activeTab === 'orders') {
      if (orderStatus !== 'ALL') count++;
      if (paymentStatus !== 'ALL') count++;
      if (orderChannel !== 'ALL') count++;
      if (refundFilter !== 'ALL') count++;
    } else if (activeTab === 'payments') {
      if (paymentStatus !== 'ALL') count++;
      if (payMethod !== 'ALL') count++;
      if (orderChannel !== 'ALL') count++;
      if (refundFilter !== 'ALL') count++;
    } else if (activeTab === 'customers') {
      if (customerStatus !== 'ALL') count++;
      if (customerState !== 'ALL') count++;
    }
    return count;
  }, [
    startDate,
    endDate,
    activeTab,
    orderStatus,
    paymentStatus,
    orderChannel,
    refundFilter,
    payMethod,
    customerStatus,
    customerState,
  ]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. TOP KPI SUMMARY METRICS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-[#E8EDF2] p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
              Total Orders
            </span>
            <span className="text-xl sm:text-2xl font-black text-[#163B5C] mt-1 block">
              {kpiStats.totalOrders}
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">
              Online store &amp; POS sales
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8EDF2] p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
              Total Sales Revenue
            </span>
            <span className="text-xl sm:text-2xl font-black text-[#ED3500] mt-1 block">
              {formatCurrency(kpiStats.totalRevenue)}
            </span>
            <span className="text-[10px] text-[#64748B] font-medium mt-0.5 block">
              Verified paid orders
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#FFF8F5] text-[#ED3500] flex items-center justify-center shrink-0 shadow-2xs">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8EDF2] p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
              Registered Customers
            </span>
            <span className="text-xl sm:text-2xl font-black text-[#163B5C] mt-1 block">
              {kpiStats.totalCustomers}
            </span>
            <span className="text-[10px] text-[#64748B] font-medium mt-0.5 block">
              US customer profiles
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 shadow-2xs">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8EDF2] p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
              Net Operating Result
            </span>
            <span
              className={`text-xl sm:text-2xl font-black mt-1 block ${
                kpiStats.isProfit ? 'text-emerald-700' : 'text-rose-600'
              }`}
            >
              {formatCurrency(kpiStats.netProfit)}
            </span>
            <span className="text-[10px] text-[#64748B] font-medium mt-0.5 block">
              P&amp;L (Sales − COGS − Exp)
            </span>
          </div>
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${
              kpiStats.isProfit ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'
            }`}
          >
            {kpiStats.isProfit ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
          </div>
        </div>
      </div>

      {/* 2. REPORT TYPE SUB-TABS */}
      <div className="bg-white rounded-2xl border border-[#E8EDF2] p-1.5 shadow-xs flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        {[
          {
            id: 'orders' as ReportTab,
            label: 'Orders Report Export',
            icon: ShoppingBag,
            desc: 'Fulfillment & items breakdown',
            count: ordersData.length,
          },
          {
            id: 'payments' as ReportTab,
            label: 'Payment Reports Export',
            icon: CreditCard,
            desc: 'Gateways, tax & net revenue',
            count: paymentsData.length,
          },
          {
            id: 'customers' as ReportTab,
            label: 'User Data Export',
            icon: Users,
            desc: 'Customer addresses & spend',
            count: customersData.length,
          },
          {
            id: 'pnl' as ReportTab,
            label: 'P&L Statement Export',
            icon: TrendingUp,
            desc: 'COGS, expenses & net profit',
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[190px] px-3.5 py-2.5 rounded-xl text-left transition-all ${
                isActive
                  ? 'bg-[#163B5C] text-white shadow-xs'
                  : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#ED3500]' : 'text-slate-400'}`} />
                  <span className="text-xs font-extrabold">{tab.label}</span>
                </div>
                {tab.count !== undefined && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </div>
              <p className={`text-[10.5px] mt-0.5 truncate ${isActive ? 'text-white/80' : 'text-[#64748B]'}`}>
                {tab.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* 3. FILTERS & EXPORT CONTROLS */}
      <div className="bg-white rounded-2xl border border-[#E8EDF2] p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8EDF2] pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#ED3500]" />
            <h3 className="text-xs font-bold text-[#163B5C] uppercase tracking-wider">
              Export Filters ({activeFiltersCount > 0 ? `${activeFiltersCount} Active` : 'All Without Filter'})
            </h3>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3 py-1.5 rounded-xl border border-[#E8EDF2] text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Reset (All Without Filter)
              </button>
            )}

            {/* Main Export to Excel Button */}
            <button
              type="button"
              onClick={handleDownloadExcel}
              disabled={downloading}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs flex items-center gap-2 shadow-md shadow-emerald-700/20 transition-all disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#86efac]" />
              <span>{downloading ? 'Preparing Excel File...' : 'Export to Excel (.xlsx)'}</span>
              <Download className="w-3.5 h-3.5 opacity-80" />
            </button>
          </div>
        </div>

        {/* Quick Date Range Preset Buttons */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-[#64748B] block">
            Quick Date Range Presets:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'ALL', label: 'All Time (No Filter)' },
              { id: 'TODAY', label: 'Today' },
              { id: 'YESTERDAY', label: 'Yesterday' },
              { id: 'LAST_7', label: 'Last 7 Days' },
              { id: 'THIS_MONTH', label: 'This Month' },
              { id: 'LAST_30', label: 'Last 30 Days' },
              { id: 'THIS_YEAR', label: 'This Year' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleDatePreset(p.id as any)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  datePreset === p.id
                    ? 'bg-[#163B5C] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
          {/* Start Date */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#64748B] block">Start Date (From)</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDatePreset('ALL');
              }}
              className="w-full px-3 py-1.5 rounded-xl border border-[#E8EDF2] text-xs font-semibold focus:outline-none focus:border-[#ED3500] bg-slate-50/60"
            />
          </div>

          {/* End Date */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#64748B] block">End Date (To)</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setDatePreset('ALL');
              }}
              className="w-full px-3 py-1.5 rounded-xl border border-[#E8EDF2] text-xs font-semibold focus:outline-none focus:border-[#ED3500] bg-slate-50/60"
            />
          </div>

          {/* Tab Specific Filters */}
          {activeTab === 'orders' && (
            <>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#64748B] block">Order Status</label>
                <select
                  value={orderStatus}
                  onChange={(e) => setOrderStatus(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-[#E8EDF2] text-xs font-semibold focus:outline-none focus:border-[#ED3500] bg-white"
                >
                  <option value="ALL">All Order Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Processing">Processing</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Refunded">Refunded / Returned</option>
                  <option value="Returned">Returned Only</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#64748B] block">Payment Status</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-[#E8EDF2] text-xs font-semibold focus:outline-none focus:border-[#ED3500] bg-white"
                >
                  <option value="ALL">All Payment Statuses</option>
                  <option value="Paid">Paid / Verified</option>
                  <option value="Pending">Pending Verification</option>
                  <option value="Failed">Failed</option>
                  <option value="Refunded">Refunded (Full)</option>
                  <option value="Partially_Refunded">Partially Refunded</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#64748B] block">Refund Filter</label>
                <select
                  value={refundFilter}
                  onChange={(e) => setRefundFilter(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-[#E8EDF2] text-xs font-semibold focus:outline-none focus:border-[#ED3500] bg-white text-rose-700 font-bold"
                >
                  <option value="ALL" className="text-slate-800 font-normal">All Orders (With &amp; Without Refunds)</option>
                  <option value="REFUNDED_ONLY" className="text-rose-700 font-bold">Refunded &amp; Returned Only</option>
                  <option value="EXCLUDE_REFUNDS" className="text-emerald-700 font-medium">Non-Refunded Orders Only</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#64748B] block">Sales Channel</label>
                <select
                  value={orderChannel}
                  onChange={(e) => setOrderChannel(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-[#E8EDF2] text-xs font-semibold focus:outline-none focus:border-[#ED3500] bg-white"
                >
                  <option value="ALL">All Channels</option>
                  <option value="ONLINE">Online Store</option>
                  <option value="POS">POS Counter</option>
                </select>
              </div>
            </>
          )}

          {activeTab === 'payments' && (
            <>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#64748B] block">Payment Status</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-[#E8EDF2] text-xs font-semibold focus:outline-none focus:border-[#ED3500] bg-white"
                >
                  <option value="ALL">All Payment Statuses</option>
                  <option value="Paid">Paid (Verified)</option>
                  <option value="Pending">Pending Verification</option>
                  <option value="Failed">Failed</option>
                  <option value="Refunded">Refunded (Full)</option>
                  <option value="Partially_Refunded">Partially Refunded</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#64748B] block">Refund Filter</label>
                <select
                  value={refundFilter}
                  onChange={(e) => setRefundFilter(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-[#E8EDF2] text-xs font-semibold focus:outline-none focus:border-[#ED3500] bg-white text-rose-700 font-bold"
                >
                  <option value="ALL" className="text-slate-800 font-normal">All Payments</option>
                  <option value="REFUNDED_ONLY" className="text-rose-700 font-bold">Refunded &amp; Partial Only</option>
                  <option value="EXCLUDE_REFUNDS" className="text-emerald-700 font-medium">Settled Only (Exclude Refunds)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#64748B] block">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-[#E8EDF2] text-xs font-semibold focus:outline-none focus:border-[#ED3500] bg-white"
                >
                  <option value="ALL">All Methods</option>
                  <option value="Razorpay">Razorpay / Online</option>
                  <option value="COD">Cash on Delivery (COD)</option>
                  <option value="CASH">In-Store Cash (POS)</option>
                  <option value="CreditCard">Credit Card</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#64748B] block">Sales Channel</label>
                <select
                  value={orderChannel}
                  onChange={(e) => setOrderChannel(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-[#E8EDF2] text-xs font-semibold focus:outline-none focus:border-[#ED3500] bg-white"
                >
                  <option value="ALL">All Channels</option>
                  <option value="ONLINE">Online Store</option>
                  <option value="POS">POS Counter</option>
                </select>
              </div>
            </>
          )}

          {activeTab === 'customers' && (
            <>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#64748B] block">Account Status</label>
                <select
                  value={customerStatus}
                  onChange={(e) => setCustomerStatus(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-[#E8EDF2] text-xs font-semibold focus:outline-none focus:border-[#ED3500] bg-white"
                >
                  <option value="ALL">All Accounts (Active &amp; Suspended)</option>
                  <option value="ACTIVE">Active Accounts Only</option>
                  <option value="SUSPENDED">Suspended Accounts Only</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#64748B] block">US State Filter</label>
                <select
                  value={customerState}
                  onChange={(e) => setCustomerState(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-[#E8EDF2] text-xs font-semibold focus:outline-none focus:border-[#ED3500] bg-white"
                >
                  <option value="ALL">All 50 US States</option>
                  {Object.entries(US_STATES).map(([code, name]) => (
                    <option key={code} value={code}>
                      {code} — {name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {activeTab === 'pnl' && (
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[11px] font-bold text-[#64748B] block">P&amp;L Scope</label>
              <div className="p-2 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-900 font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Includes Sales Revenue, COGS, Category Expenses &amp; Audited Sales Tax</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. PREVIEW DATA TABLE */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl border border-[#E8EDF2] shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-[#E8EDF2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#163B5C]">Orders Report Preview</h4>
                <span className="text-[11px] text-[#64748B]">
                  {filteredOrders.length} matching orders ready for Excel export
                </span>
              </div>
            </div>

            {ordersSummary && (
              <div className="flex items-center gap-3 text-xs flex-wrap">
                <span className="text-[#64748B]">Units: <strong>{ordersSummary.totalUnits}</strong></span>
                <span className="text-[#64748B]">Tax: <strong>{formatCurrency(ordersSummary.totalTax)}</strong></span>
                {Number(ordersSummary.totalRefunds) > 0 && (
                  <span className="text-rose-600 font-bold">
                    Refunds: -{formatCurrency(ordersSummary.totalRefunds)}
                  </span>
                )}
                <span className="font-extrabold text-emerald-700 text-sm">
                  Net: {formatCurrency(ordersSummary.netRevenue ?? ordersSummary.totalRevenue)}
                </span>
              </div>
            )}
          </div>

          {/* Search Bar */}
          <div className="p-3 border-b border-[#E8EDF2] flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search orders in preview..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[#E8EDF2] text-xs font-medium focus:outline-none focus:border-[#ED3500]"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-[#64748B]">
              <RefreshCw className="w-6 h-6 text-[#ED3500] animate-spin mx-auto mb-2" />
              <p className="text-xs font-bold">Loading orders data...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-12 text-center text-[#64748B]">
              <p className="text-xs font-bold text-[#163B5C]">No orders matching current filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#FFFCFB] border-b border-[#E8EDF2] text-[#64748B] font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-4">Order ID</th>
                    <th className="py-2.5 px-4">Customer</th>
                    <th className="py-2.5 px-4">Items</th>
                    <th className="py-2.5 px-4">Total ($ USD)</th>
                    <th className="py-2.5 px-4">Refund ($)</th>
                    <th className="py-2.5 px-4">Net Settled</th>
                    <th className="py-2.5 px-4">Payment</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8EDF2]">
                  {filteredOrders.slice(0, 50).map((ord) => {
                    const total = Number(ord.totalAmount) || 0;
                    const refund = Number(
                      ord.refundAmount !== undefined && ord.refundAmount !== null
                        ? ord.refundAmount
                        : ord.status === 'Refunded' || ord.paymentStatus === 'Refunded'
                        ? total
                        : 0
                    );
                    const net = Math.max(0, total - refund);

                    return (
                      <tr key={ord._id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-bold text-[#163B5C]">
                          {ord.orderId}
                          <span className="block text-[10px] text-[#64748B]">
                            {new Date(ord.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-[#163B5C]">
                          {ord.customerName}
                          <span className="block text-[10px] text-[#64748B]">{ord.city}, {ord.state}</span>
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate text-[#64748B]">
                          {(ord.items || []).map((i: any) => `${i.name} (x${i.quantity})`).join(', ')}
                        </td>
                        <td className="py-3 px-4 font-bold text-[#163B5C]">
                          {formatCurrency(total)}
                        </td>
                        <td className="py-3 px-4">
                          {refund > 0 ? (
                            <div>
                              <span className="font-extrabold text-rose-600 block">-{formatCurrency(refund)}</span>
                              {ord.refundReason && (
                                <span className="block text-[9.5px] text-rose-500 font-normal truncate max-w-[120px]" title={ord.refundReason}>
                                  {ord.refundReason}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[#94A3B8] font-mono">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-extrabold text-emerald-700">
                          {formatCurrency(net)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              ord.paymentStatus === 'Paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : ord.paymentStatus === 'Refunded'
                                ? 'bg-rose-100 text-rose-800'
                                : ord.paymentStatus === 'Partially_Refunded'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {ord.paymentStatus === 'Partially_Refunded' ? 'Part. Refunded' : ord.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              ord.status === 'Completed'
                                ? 'bg-emerald-50 text-emerald-700'
                                : ord.status === 'Refunded' || ord.status === 'Returned'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {ord.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 5. PREVIEW PAYMENTS */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-2xl border border-[#E8EDF2] shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-[#E8EDF2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#163B5C]">Payments Audit Preview</h4>
                <span className="text-[11px] text-[#64748B]">
                  {filteredPayments.length} transactions ready for Excel export
                </span>
              </div>
            </div>

            {paymentsSummary && (
              <div className="flex items-center gap-3 text-xs flex-wrap">
                <span className="text-[#64748B]">Gross: <strong>{formatCurrency(paymentsSummary.totalGross)}</strong></span>
                <span className="text-amber-600">Tax: <strong>{formatCurrency(paymentsSummary.totalTax)}</strong></span>
                {Number(paymentsSummary.totalRefunds) > 0 && (
                  <span className="text-rose-600 font-bold">
                    Refunds: -{formatCurrency(paymentsSummary.totalRefunds)}
                  </span>
                )}
                <span className="font-extrabold text-emerald-700 text-sm">
                  Net: {formatCurrency(paymentsSummary.totalNet)}
                </span>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FFFCFB] border-b border-[#E8EDF2] text-[#64748B] font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-4">Transaction / Order</th>
                  <th className="py-2.5 px-4">Customer</th>
                  <th className="py-2.5 px-4">Method &amp; Status</th>
                  <th className="py-2.5 px-4">Gross Total</th>
                  <th className="py-2.5 px-4">Sales Tax</th>
                  <th className="py-2.5 px-4">Refund</th>
                  <th className="py-2.5 px-4">Net Settlement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8EDF2]">
                {filteredPayments.slice(0, 50).map((p) => {
                  const gross = Number(p.totalAmount) || 0;
                  const tax = Number(p.totalTax || p.taxSnapshot?.taxAmount || 0);
                  const refund = Number(
                    p.refundAmount !== undefined && p.refundAmount !== null
                      ? p.refundAmount
                      : p.paymentStatus === 'Refunded' || p.status === 'Refunded'
                      ? gross
                      : 0
                  );
                  const net = Math.max(0, gross - tax - refund);
                  return (
                    <tr key={p._id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <span className="font-bold text-[#163B5C] block">{p.orderId}</span>
                        <span className="font-mono text-[10px] text-[#64748B]">{p.transactionId || 'Direct'}</span>
                      </td>
                      <td className="py-3 px-4 font-medium text-[#163B5C]">{p.customerName}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold block">{p.paymentMethod}</span>
                        <span
                          className={`inline-flex px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            p.paymentStatus === 'Paid'
                              ? 'text-emerald-700'
                              : p.paymentStatus === 'Refunded'
                              ? 'text-rose-700 font-extrabold'
                              : p.paymentStatus === 'Partially_Refunded'
                              ? 'text-amber-700 font-extrabold'
                              : 'text-slate-600'
                          }`}
                        >
                          {p.paymentStatus === 'Partially_Refunded' ? 'Part. Refunded' : p.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold">{formatCurrency(gross)}</td>
                      <td className="py-3 px-4 text-[#B45309] font-medium">{formatCurrency(tax)}</td>
                      <td className="py-3 px-4 font-bold text-rose-600">
                        {refund > 0 ? `-${formatCurrency(refund)}` : <span className="text-[#94A3B8] font-mono">-</span>}
                      </td>
                      <td className="py-3 px-4 font-extrabold text-emerald-700">{formatCurrency(net)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. PREVIEW CUSTOMERS */}
      {activeTab === 'customers' && (
        <div className="bg-white rounded-2xl border border-[#E8EDF2] shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-[#E8EDF2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#163B5C]">Customer Directory Preview</h4>
                <span className="text-[11px] text-[#64748B]">
                  {filteredCustomers.length} registered profiles ready for Excel export
                </span>
              </div>
            </div>

            {customersSummary && (
              <div className="flex items-center gap-3 text-xs">
                <span className="text-[#64748B]">Active: <strong>{customersSummary.activeCustomers}</strong></span>
                <span className="text-[#64748B]">Orders: <strong>{customersSummary.totalOrders}</strong></span>
                <span className="font-extrabold text-emerald-700 text-sm">
                  Spend: {formatCurrency(customersSummary.totalSpent)}
                </span>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FFFCFB] border-b border-[#E8EDF2] text-[#64748B] font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-4">Customer</th>
                  <th className="py-2.5 px-4">Contact</th>
                  <th className="py-2.5 px-4">Address</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                  <th className="py-2.5 px-4 text-right">Orders</th>
                  <th className="py-2.5 px-4 text-right">Lifetime Spend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8EDF2]">
                {filteredCustomers.slice(0, 50).map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-bold text-[#163B5C]">{c.name}</td>
                    <td className="py-3 px-4 text-[#64748B]">{c.email}</td>
                    <td className="py-3 px-4 text-[#64748B]">{c.city}, {c.state} {c.zipCode}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.isActive !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {c.isActive !== false ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold">{c.totalOrders || 0}</td>
                    <td className="py-3 px-4 text-right font-extrabold text-emerald-700">
                      {formatCurrency(c.totalSpent || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. PREVIEW PNL */}
      {activeTab === 'pnl' && pnlSummary && (
        <div className="space-y-4">
          <div
            className={`p-5 rounded-2xl text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              pnlSummary.isProfit
                ? 'bg-gradient-to-r from-emerald-700 to-[#163B5C]'
                : 'bg-gradient-to-r from-rose-700 to-rose-900'
            }`}
          >
            <div>
              <span className="text-[11px] uppercase font-bold tracking-wider opacity-80 block">
                Net Operating Financial Result
              </span>
              <h3 className="text-2xl sm:text-3xl font-black mt-0.5">
                {formatCurrency(pnlSummary.netProfit)}
              </h3>
              <p className="text-xs opacity-80 mt-0.5">
                {pnlSummary.isProfit ? 'Operational Net Profit' : 'Operational Net Loss'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleDownloadExcel}
              disabled={downloading}
              className="px-4 py-2 rounded-xl bg-white text-[#163B5C] font-extrabold text-xs flex items-center gap-2 shadow-sm transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>{downloading ? 'Exporting...' : 'Export Complete P&L Workbook (.xlsx)'}</span>
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-[#E8EDF2] p-4 space-y-2 text-xs">
              <span className="font-bold text-[#163B5C] uppercase block">Sales Revenue</span>
              {Number(pnlSummary.b2bSaleInvoices) > 0 && (
                <div className="flex justify-between text-[#64748B]">
                  <span>B2B Wholesale</span>
                  <span className="font-bold text-[#163B5C]">{formatCurrency(pnlSummary.b2bSaleInvoices)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#64748B]">
                <span>Online Store</span>
                <span className="font-bold text-[#163B5C]">{formatCurrency(pnlSummary.onlineStoreSales)}</span>
              </div>
              <div className="flex justify-between text-[#64748B]">
                <span>POS Counter</span>
                <span className="font-bold text-[#163B5C]">{formatCurrency(pnlSummary.posCounterSales)}</span>
              </div>
              <div className={`flex justify-between pt-1 border-t border-[#E8EDF2] font-semibold ${Number(pnlSummary.salesReturnTotal) > 0 ? 'text-rose-600' : 'text-[#64748B]'}`}>
                <span>Returns &amp; Refunds</span>
                <span>{Number(pnlSummary.salesReturnTotal) > 0 ? `- ${formatCurrency(pnlSummary.salesReturnTotal)}` : '$0.00'}</span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-[#E8EDF2] font-black text-sm text-[#163B5C]">
                <span>Net Sales Revenue</span>
                <span>{formatCurrency(pnlSummary.netSalesRevenue)}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#E8EDF2] p-4 space-y-2 text-xs">
              <span className="font-bold text-[#163B5C] uppercase block">Cost of Goods (COGS)</span>
              <div className="flex justify-between text-[#64748B]">
                <span>Purchase Bills</span>
                <span className="font-bold text-[#163B5C]">{formatCurrency(pnlSummary.purchaseBillTotal)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#E8EDF2] font-bold text-sm text-[#163B5C]">
                <span>Total COGS</span>
                <span>{formatCurrency(pnlSummary.costOfGoodsSold)}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#E8EDF2] p-4 space-y-2 text-xs">
              <span className="font-bold text-[#163B5C] uppercase block">Operating Expenses</span>
              <div className="flex justify-between text-[#64748B]">
                <span>Total Logged</span>
                <span className="font-bold text-[#163B5C]">{formatCurrency(pnlSummary.totalExpenses)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#E8EDF2] font-bold text-sm text-emerald-700">
                <span>Gross Profit</span>
                <span>{formatCurrency(pnlSummary.grossProfit)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
