'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Table,
  Printer,
  Copy,
  Check,
  Share2,
  MessageCircle,
  Calendar,
  Filter,
  Users,
  Package,
  Tag,
  Phone,
  Layers,
  Clock,
  Sparkles,
} from 'lucide-react';

interface ConsolidatedPackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: any[];
  products: any[];
}

export default function ConsolidatedPackingModal({
  isOpen,
  onClose,
  orders,
  products,
}: ConsolidatedPackingModalProps) {
  // Filter States
  const [dateField, setDateField] = useState<'deliveryDate' | 'createdAt' | 'all'>('deliveryDate');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING'>('ALL');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'ALL' | 'PENDING' | 'PROCESSING' | 'COMPLETED'>('ALL');
  const [excludeCancelled, setExcludeCancelled] = useState<boolean>(true);
  const [channelFilter, setChannelFilter] = useState<'ALL' | 'ONLINE' | 'POS'>('ALL');
  const [viewMode, setViewMode] = useState<'customer' | 'procurement'>('customer');

  const [copiedText, setCopiedText] = useState<boolean>(false);

  // Quick Date Presets
  const setToday = () => {
    const today = new Date().toISOString().slice(0, 10);
    setDateField('deliveryDate');
    setStartDate(today);
    setEndDate(today);
  };

  const setTomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const tomorrow = d.toISOString().slice(0, 10);
    setDateField('deliveryDate');
    setStartDate(tomorrow);
    setEndDate(tomorrow);
  };

  const setNext7Days = () => {
    const today = new Date();
    const future = new Date();
    future.setDate(today.getDate() + 7);
    setDateField('deliveryDate');
    setStartDate(today.toISOString().slice(0, 10));
    setEndDate(future.toISOString().slice(0, 10));
  };

  const clearDateFilter = () => {
    setDateField('all');
    setStartDate('');
    setEndDate('');
  };

  // Helper to normalize any date into YYYY-MM-DD
  const normalizeToDateStr = (dateVal: any): string => {
    if (!dateVal) return '';
    if (typeof dateVal === 'string') {
      const match = dateVal.match(/^\d{4}-\d{2}-\d{2}/);
      if (match) return match[0];
    }
    try {
      const parsed = new Date(dateVal);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().slice(0, 10);
      }
    } catch (e) {}
    return String(dateVal).trim();
  };

  // Filter Orders
  const filteredOrders = useMemo(() => {
    if (!orders || !orders.length) return [];

    return orders.filter((order) => {
      // 1. Exclude Cancelled / Refunded / Returned
      if (excludeCancelled) {
        if (
          order.status === 'Cancelled' ||
          order.status === 'Refunded' ||
          order.status === 'Returned' ||
          order.paymentStatus === 'Refunded'
        ) {
          return false;
        }
      }

      // 2. Channel Filter
      if (channelFilter === 'ONLINE' && order.orderType === 'POS') return false;
      if (channelFilter === 'POS' && order.orderType !== 'POS') return false;

      // 3. Payment Status Filter
      if (paymentStatusFilter === 'PAID') {
        if (order.paymentStatus !== 'Paid') return false;
      } else if (paymentStatusFilter === 'PENDING') {
        if (order.paymentStatus === 'Paid') return false;
      }

      // 4. Fulfillment / Order Status Filter
      if (orderStatusFilter === 'PENDING') {
        if (order.status !== 'Pending') return false;
      } else if (orderStatusFilter === 'PROCESSING') {
        if (order.status !== 'Processing') return false;
      } else if (orderStatusFilter === 'COMPLETED') {
        if (order.status !== 'Completed' && order.status !== 'Delivered') return false;
      }

      // 5. Date Filter
      if (dateField !== 'all') {
        const orderDateStr =
          dateField === 'deliveryDate'
            ? normalizeToDateStr(order.deliveryDate || order.createdAt)
            : normalizeToDateStr(order.createdAt);

        if (startDate && endDate) {
          if (orderDateStr < startDate || orderDateStr > endDate) return false;
        } else if (startDate) {
          if (orderDateStr < startDate) return false;
        } else if (endDate) {
          if (orderDateStr > endDate) return false;
        }
      }

      return true;
    });
  }, [
    orders,
    dateField,
    startDate,
    endDate,
    paymentStatusFilter,
    orderStatusFilter,
    excludeCancelled,
    channelFilter,
  ]);

  // Group Filtered Orders by Customer (Image 2 style)
  const customerGroups = useMemo(() => {
    const map = new Map<string, {
      customerKey: string;
      customerName: string;
      customerPhone: string;
      deliveryDate: string;
      orderIds: string[];
      items: Array<{
        name: string;
        variantName: string;
        category: string;
        quantity: number;
        price: number;
      }>;
      totalUnits: number;
    }>();

    filteredOrders.forEach((order) => {
      const name = (order.customerName || 'Walk-in Guest').trim();
      const phone = (order.customerPhone || '').trim();
      const key = `${name}__${phone}`;

      let group = map.get(key);
      if (!group) {
        group = {
          customerKey: key,
          customerName: name,
          customerPhone: phone,
          deliveryDate: order.deliveryDate || '',
          orderIds: [],
          items: [],
          totalUnits: 0,
        };
        map.set(key, group);
      }

      if (order.orderId && !group.orderIds.includes(order.orderId)) {
        group.orderIds.push(order.orderId);
      }
      if (order.deliveryDate && !group.deliveryDate) {
        group.deliveryDate = order.deliveryDate;
      }

      // Process order items
      (order.items || []).forEach((it: any) => {
        const matchedProduct = products.find(
          (p) => p._id === it.productId || p.name?.toLowerCase().trim() === it.name?.toLowerCase().trim()
        );
        const resolvedVariant =
          (it.variantName && it.variantName.trim().length > 0)
            ? it.variantName
            : matchedProduct?.variants?.find((v: any) => Number(v.price) === Number(it.price))?.name || '';
        const categoryName = matchedProduct?.category || it.category || '';
        const qty = Number(it.quantity) || 1;

        // Check if item with same name & variant already exists in customer group
        const existingItem = group!.items.find(
          (item) =>
            item.name.toLowerCase().trim() === it.name?.toLowerCase().trim() &&
            item.variantName.toLowerCase().trim() === resolvedVariant.toLowerCase().trim()
        );

        if (existingItem) {
          existingItem.quantity += qty;
        } else {
          group!.items.push({
            name: it.name,
            variantName: resolvedVariant,
            category: categoryName,
            quantity: qty,
            price: Number(it.price) || 0,
          });
        }

        group!.totalUnits += qty;
      });
    });

    return Array.from(map.values()).sort((a, b) => a.customerName.localeCompare(b.customerName));
  }, [filteredOrders, products]);

  // Overall Procurement Summary (Total counts per product across all filtered orders)
  const procurementSummary = useMemo(() => {
    const itemMap = new Map<string, {
      name: string;
      variantName: string;
      category: string;
      quantity: number;
    }>();

    customerGroups.forEach((cust) => {
      cust.items.forEach((it) => {
        const key = `${it.name.toLowerCase().trim()}__${it.variantName.toLowerCase().trim()}`;
        const existing = itemMap.get(key);
        if (existing) {
          existing.quantity += it.quantity;
        } else {
          itemMap.set(key, {
            name: it.name,
            variantName: it.variantName,
            category: it.category,
            quantity: it.quantity,
          });
        }
      });
    });

    return Array.from(itemMap.values()).sort((a, b) => b.quantity - a.quantity);
  }, [customerGroups]);

  // Grand Total Units
  const grandTotalUnits = useMemo(() => {
    return customerGroups.reduce((sum, c) => sum + c.totalUnits, 0);
  }, [customerGroups]);

  // Format Text for WhatsApp / Clipboard
  const formatConsolidatedTextForSharing = () => {
    const lines: string[] = [];
    lines.push(`🌸 INDIAN-FLOWERS.COM — CONSOLIDATED PACKING LIST`);
    if (dateField !== 'all' && (startDate || endDate)) {
      lines.push(`📅 Date: ${startDate || 'Any'} to ${endDate || 'Any'} (${dateField === 'deliveryDate' ? 'Delivery Date' : 'Order Placed'})`);
    } else {
      lines.push(`📅 Scope: All Available Dates`);
    }
    lines.push(`🏷️ Filters: Payment: ${paymentStatusFilter} | Status: ${orderStatusFilter}${excludeCancelled ? ' | Excl. Cancelled' : ''}`);
    lines.push(`📦 Summary: ${filteredOrders.length} Orders across ${customerGroups.length} Customers`);
    lines.push(`══════════════════════════════════════`);

    customerGroups.forEach((cust, cIdx) => {
      lines.push(`\n👤 [${cIdx + 1}] ${cust.customerName.toUpperCase()}  (Total: ${cust.totalUnits} Units)`);
      if (cust.customerPhone) lines.push(`   📞 Phone: ${cust.customerPhone}`);
      if (cust.deliveryDate) lines.push(`   🚚 Delivery Date: ${cust.deliveryDate}`);
      lines.push(`   🧾 Orders: ${cust.orderIds.join(', ')}`);
      lines.push(`   ──────────────────────────────────`);

      cust.items.forEach((it, iIdx) => {
        const variantStr = it.variantName ? ` [${it.variantName}]` : '';
        lines.push(`   ${iIdx + 1}. ${it.name}${variantStr}  -->  Qty: ${it.quantity}`);
      });
    });

    lines.push(`\n══════════════════════════════════════`);
    lines.push(`⭐ GRAND TOTAL: ${grandTotalUnits} UNITS ACROSS ${customerGroups.length} CUSTOMERS`);
    return lines.join('\n');
  };

  // Copy to Clipboard
  const handleCopy = async () => {
    const text = formatConsolidatedTextForSharing();
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2200);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  // Share via WhatsApp
  const handleShareWhatsApp = () => {
    const text = formatConsolidatedTextForSharing();
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Print Consolidated Packing Slip (Exact Image 2 format)
  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=950');
    if (!printWindow) {
      window.print();
      return;
    }

    const dateLabel =
      dateField !== 'all' && (startDate || endDate)
        ? `${startDate || 'Start'} to ${endDate || 'End'} (${dateField === 'deliveryDate' ? 'Delivery Date' : 'Placed Date'})`
        : 'All Dates';

    let tableRowsHtml = '';

    if (viewMode === 'customer') {
      customerGroups.forEach((cust) => {
        // Customer Header Row (matching Image 2: "Aishwarya Flowers | 130")
        tableRowsHtml += `
          <tr style="background: #e5e7eb; border-top: 2px solid #000; border-bottom: 2px solid #000;">
            <th style="padding: 10px 14px; text-align: left; font-size: 15px; font-weight: 800; border-right: 2px solid #000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              ${cust.customerName}
              ${cust.customerPhone ? `<span style="font-weight: 600; font-size: 12px; color: #444; margin-left: 8px;">(${cust.customerPhone})</span>` : ''}
              ${cust.deliveryDate ? `<span style="font-weight: 600; font-size: 12px; color: #166534; margin-left: 8px;">• Delivery: ${cust.deliveryDate}</span>` : ''}
            </th>
            <th style="padding: 10px 14px; text-align: center; font-size: 17px; font-weight: 900; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              ${cust.totalUnits}
            </th>
          </tr>
        `;

        cust.items.forEach((it) => {
          tableRowsHtml += `
            <tr style="border-bottom: 1.5px solid #000;">
              <td style="padding: 9px 14px; border-right: 2px solid #000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <div style="font-weight: 700; font-size: 13.5px; color: #000; line-height: 1.3;">${it.name}</div>
                ${it.variantName ? `<div style="font-size: 11.5px; font-weight: 700; color: #581c87; margin-top: 2px;">Variant: ${it.variantName}</div>` : ''}
              </td>
              <td style="padding: 9px 14px; text-align: center; font-weight: 800; font-size: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #000;">
                ${it.quantity}
              </td>
            </tr>
          `;
        });
      });
    } else {
      // Procurement Summary Rows
      procurementSummary.forEach((it) => {
        tableRowsHtml += `
          <tr style="border-bottom: 1.5px solid #000;">
            <td style="padding: 9px 14px; border-right: 2px solid #000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              <div style="font-weight: 700; font-size: 13.5px; color: #000; line-height: 1.3;">${it.name}</div>
              ${it.variantName ? `<div style="font-size: 11.5px; font-weight: 700; color: #581c87; margin-top: 2px;">Variant: ${it.variantName}</div>` : ''}
            </td>
            <td style="padding: 9px 14px; text-align: center; font-weight: 800; font-size: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #000;">
              ${it.quantity}
            </td>
          </tr>
        `;
      });
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Consolidated Packing List — Indian-Flowers.com</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #000; background: #fff; margin: 0; }
            .header { margin-bottom: 16px; border-bottom: 2px solid #000; padding-bottom: 12px; }
            .header h2 { margin: 0 0 6px 0; font-size: 20px; font-weight: 900; }
            .header p { margin: 3px 0; font-size: 12.5px; color: #222; }
            table { width: 100%; border-collapse: collapse; border: 2px solid #000; margin-top: 14px; }
            th { border-bottom: 2px solid #000; padding: 10px 14px; font-size: 12px; text-align: left; }
            th.qty { text-align: center; width: 100px; }
            tfoot td { font-weight: 900; border-top: 2px solid #000; padding: 12px 14px; background: #f3f4f6; }
            @media print {
              body { padding: 10px; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>🌸 Indian-Flowers.com — Consolidated Packing &amp; Dispatch Slip</h2>
            <p><strong>Filter Scope:</strong> ${dateLabel} • <strong>Payment:</strong> ${paymentStatusFilter} • <strong>Status:</strong> ${orderStatusFilter}</p>
            <p><strong>Orders Count:</strong> ${filteredOrders.length} orders across ${customerGroups.length} customers • <strong>Generated:</strong> ${new Date().toLocaleString('en-US')}</p>
          </div>
          <table>
            <thead>
              <tr style="background: #111827; color: #ffffff;">
                <th style="border-right: 2px solid #000; font-size: 12px; text-transform: uppercase; color: #fff;">
                  ${viewMode === 'customer' ? 'Customer / Product & Variant Description' : 'Item Description & Variant'}
                </th>
                <th class="qty" style="border-left: none; text-transform: uppercase; color: #fff;">Quantity</th>
              </tr>
            </thead>
            <tbody>
              ${tableRowsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td style="border-right: 2px solid #000; text-transform: uppercase; font-size: 14px;">
                  GRAND TOTAL UNITS (${customerGroups.length} Customers)
                </td>
                <td style="text-align: center; font-size: 19px; font-weight: 900;">
                  ${grandTotalUnits}
                </td>
              </tr>
            </tfoot>
          </table>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-hidden">
      <div className="bg-white rounded-3xl border border-[#E8EDF2] shadow-2xl max-w-5xl w-full max-h-[94vh] flex flex-col overflow-hidden relative">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-[#FFFCFB] border-b border-[#E8EDF2] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#163B5C]/10 text-[#163B5C] flex items-center justify-center shrink-0">
              <Table className="w-5 h-5 text-[#163B5C]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-[#163B5C]">
                  Consolidated Packing &amp; Dispatch List
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Image 2 Table Format
                </span>
              </div>
              <p className="text-xs text-[#64748B]">
                Date-wise multi-order item breakdown separated by customer names with instant print &amp; WhatsApp share
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Filters & Table Container */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Filter Controls Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-[#163B5C]">
                <Filter className="w-3.5 h-3.5 text-[#ED3500]" />
                <span>Packing Sheet Filters</span>
              </div>
              {/* Quick Date Presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-slate-500 mr-1">Quick Dates:</span>
                <button
                  type="button"
                  onClick={setToday}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-slate-300 font-bold text-[11px] text-[#163B5C] transition-colors shadow-2xs"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={setTomorrow}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-slate-300 font-bold text-[11px] text-[#163B5C] transition-colors shadow-2xs"
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={setNext7Days}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-slate-300 font-bold text-[11px] text-[#163B5C] transition-colors shadow-2xs"
                >
                  Next 7 Days
                </button>
                <button
                  type="button"
                  onClick={clearDateFilter}
                  className="px-2.5 py-1 rounded-lg bg-slate-200/80 hover:bg-slate-300 font-bold text-[11px] text-slate-700 transition-colors"
                >
                  All Dates
                </button>
              </div>
            </div>

            {/* Filter Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-200/80">
              {/* 1. Date Type & Inputs */}
              <div className="space-y-1.5">
                <label className="font-bold text-[#163B5C] block text-[11px]">
                  Date Filter Mode
                </label>
                <select
                  value={dateField}
                  onChange={(e) => setDateField(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white font-medium text-xs focus:ring-1 focus:ring-[#163B5C]"
                >
                  <option value="deliveryDate">🚚 Requested Delivery Date</option>
                  <option value="createdAt">📅 Order Placed Date</option>
                  <option value="all">🌐 All Available Dates</option>
                </select>

                {dateField !== 'all' && (
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-2 py-1 rounded-lg border border-slate-300 bg-white text-[11px]"
                      title="Start Date"
                    />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-2 py-1 rounded-lg border border-slate-300 bg-white text-[11px]"
                      title="End Date"
                    />
                  </div>
                )}
              </div>

              {/* 2. Payment Status Filter */}
              <div className="space-y-1.5">
                <label className="font-bold text-[#163B5C] block text-[11px]">
                  Payment Status
                </label>
                <select
                  value={paymentStatusFilter}
                  onChange={(e) => setPaymentStatusFilter(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white font-medium text-xs focus:ring-1 focus:ring-[#163B5C]"
                >
                  <option value="ALL">All Payment Statuses</option>
                  <option value="PAID">✅ Paid (Verified Only)</option>
                  <option value="PENDING">⏳ Pending / Unpaid / COD</option>
                </select>
                <span className="text-[10px] text-slate-500 block">
                  {paymentStatusFilter === 'PAID' ? 'Filtering strictly paid orders' : 'Showing all payment stages'}
                </span>
              </div>

              {/* 3. Order / Fulfillment Status Filter */}
              <div className="space-y-1.5">
                <label className="font-bold text-[#163B5C] block text-[11px]">
                  Order Fulfillment Status
                </label>
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white font-medium text-xs focus:ring-1 focus:ring-[#163B5C]"
                >
                  <option value="ALL">All Order Stages</option>
                  <option value="PENDING">🟡 Pending Orders</option>
                  <option value="PROCESSING">🔵 Processing (Floral Prep)</option>
                  <option value="COMPLETED">🟢 Completed / Delivered</option>
                </select>

                <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-700 font-semibold select-none pt-0.5">
                  <input
                    type="checkbox"
                    checked={excludeCancelled}
                    onChange={(e) => setExcludeCancelled(e.target.checked)}
                    className="rounded border-slate-300 text-[#163B5C] focus:ring-0 w-3.5 h-3.5"
                  />
                  <span>Exclude Cancelled &amp; Refunded</span>
                </label>
              </div>

              {/* 4. Sales Channel */}
              <div className="space-y-1.5">
                <label className="font-bold text-[#163B5C] block text-[11px]">
                  Channel Filter
                </label>
                <select
                  value={channelFilter}
                  onChange={(e) => setChannelFilter(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white font-medium text-xs focus:ring-1 focus:ring-[#163B5C]"
                >
                  <option value="ALL">All Channels (Online + POS)</option>
                  <option value="ONLINE">🌐 Online Delivery Only</option>
                  <option value="POS">🏪 In-store POS Sales Only</option>
                </select>
                <span className="text-[10px] text-slate-500 block">
                  Select fulfillment pipeline
                </span>
              </div>
            </div>
          </div>

          {/* Results Bar & Actions Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm text-[#163B5C]">
                  {filteredOrders.length} Orders
                </span>
                <span className="text-slate-400">•</span>
                <span className="font-black text-sm text-[#163B5C]">
                  {customerGroups.length} Customers
                </span>
                <span className="text-slate-400">•</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-black text-xs border border-emerald-200">
                  {grandTotalUnits} Total Units
                </span>
              </div>
            </div>

            {/* Layout Toggle & Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Segmented View Switcher */}
              <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setViewMode('customer')}
                  className={`px-3 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all ${
                    viewMode === 'customer'
                      ? 'bg-white text-[#163B5C] shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Grouped by Customer (Image 2 style)"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>By Customer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('procurement')}
                  className={`px-3 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all ${
                    viewMode === 'procurement'
                      ? 'bg-white text-[#163B5C] shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Total Procurement Summary (All Items Combined)"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Procurement Total</span>
                </button>
              </div>

              {/* Copy Button */}
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                title="Copy Packing List to Clipboard"
              >
                {copiedText ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              {/* WhatsApp Share Button */}
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                title="Share formatted packing list to WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp</span>
              </button>

              {/* Print Slip Button */}
              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-1.5 rounded-xl bg-[#163B5C] hover:bg-[#112F4A] text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                title="Print 2-Column Packing Sheets (Image 2 style)"
              >
                <Printer className="w-3.5 h-3.5 text-amber-300" />
                <span>Print Packing Slip</span>
              </button>
            </div>
          </div>

          {/* Table Container (Exact Image 2 High-Contrast Styling) */}
          {customerGroups.length === 0 ? (
            <div className="py-12 px-4 text-center rounded-2xl bg-white border border-slate-200 space-y-2">
              <Package className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-extrabold text-sm text-[#163B5C]">
                No orders match your filter criteria
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Try selecting "All Dates" or adjusting your payment and fulfillment status filters above.
              </p>
              <button
                type="button"
                onClick={clearDateFilter}
                className="mt-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs inline-flex items-center gap-1"
              >
                Clear Date Filter
              </button>
            </div>
          ) : (
            <div className="border-2 border-black bg-white shadow-sm overflow-hidden">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-100 border-b-2 border-black text-[11px] font-black uppercase tracking-wider text-black">
                    <th className="py-2.5 px-3 sm:px-4 border-r-2 border-black">
                      {viewMode === 'customer'
                        ? 'Customer / Product Name & Variant Description'
                        : 'Product Name & Variant Description'}
                    </th>
                    <th className="py-2.5 px-3 sm:px-4 text-center w-24 sm:w-32 shrink-0">
                      Quantity
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {viewMode === 'customer' ? (
                    customerGroups.map((cust) => (
                      <React.Fragment key={cust.customerKey}>
                        {/* Customer Header Row matching Image 2 ("Aishwarya Flowers | 130") */}
                        <tr className="bg-slate-200/95 border-y-2 border-black font-black text-xs sm:text-sm text-black">
                          <td className="py-2 px-3 sm:px-4 border-r-2 border-black">
                            <div className="flex flex-wrap items-center justify-between gap-1">
                              <span className="font-black uppercase tracking-wide text-black text-sm sm:text-base">
                                {cust.customerName}
                              </span>
                              <div className="flex items-center gap-2 text-[11px] text-slate-700 font-semibold">
                                {cust.customerPhone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="w-3 h-3 text-slate-500" />
                                    <span>{cust.customerPhone}</span>
                                  </span>
                                )}
                                {cust.deliveryDate && (
                                  <span className="px-1.5 py-0.2 rounded bg-white border border-slate-300 text-emerald-800">
                                    Delivery: {cust.deliveryDate}
                                  </span>
                                )}
                                <span className="text-slate-500">
                                  ({cust.orderIds.map((id) => '#' + id.slice(-6)).join(', ')})
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-2 px-3 sm:px-4 text-center font-black text-base sm:text-lg border-black tabular-nums">
                            {cust.totalUnits}
                          </td>
                        </tr>

                        {/* Customer's Ordered Items */}
                        {cust.items.map((it, itemIdx) => (
                          <tr
                            key={itemIdx}
                            className="border-b border-black hover:bg-slate-50/90 transition-colors"
                          >
                            <td className="py-2.5 px-3 sm:px-4 border-r-2 border-black align-middle">
                              <div className="font-bold text-xs sm:text-sm text-black leading-snug">
                                {it.name}
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                {it.variantName ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-purple-800">
                                    <Tag className="w-3 h-3 text-purple-700 shrink-0" />
                                    <span>Variant: {it.variantName}</span>
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-500">Standard</span>
                                )}
                                {it.category && (
                                  <span className="text-[9px] uppercase tracking-wider font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                    {it.category}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 sm:px-4 text-center align-middle font-black text-sm sm:text-base text-black tabular-nums">
                              {it.quantity}
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))
                  ) : (
                    // Procurement Summary View (Total Items Combined)
                    procurementSummary.map((it, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-black hover:bg-slate-50/90 transition-colors"
                      >
                        <td className="py-2.5 px-3 sm:px-4 border-r-2 border-black align-middle">
                          <div className="font-bold text-xs sm:text-sm text-black leading-snug">
                            {it.name}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                            {it.variantName ? (
                              <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-purple-800">
                                <Tag className="w-3 h-3 text-purple-700 shrink-0" />
                                <span>Variant: {it.variantName}</span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500">Standard</span>
                            )}
                            {it.category && (
                              <span className="text-[9px] uppercase tracking-wider font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                {it.category}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 sm:px-4 text-center align-middle font-black text-base sm:text-lg text-black tabular-nums">
                          {it.quantity}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>

                <tfoot>
                  <tr className="bg-slate-100 border-t-2 border-black font-black text-xs sm:text-sm text-black">
                    <td className="py-3 px-3 sm:px-4 border-r-2 border-black uppercase tracking-wider">
                      GRAND TOTAL UNITS ({customerGroups.length} Customers)
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center font-black text-base sm:text-xl text-black tabular-nums">
                      {grandTotalUnits}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-4 bg-[#FFFCFB] border-t border-[#E8EDF2] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
            <span>
              Showing <strong className="text-[#163B5C]">{filteredOrders.length}</strong> matching orders
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-xl bg-[#163B5C] hover:bg-[#112F4A] text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              <span>Print Packing Slip</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
