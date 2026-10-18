'use client';

import React, { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/currency';
import Link from 'next/link';
import {
  FileText,
  ShoppingBag,
  Receipt,
  PieChart,
  ArrowLeft,
  RefreshCw,
  Plus,
  Users,
  Eye,
  Edit,
  Lock,
  FileSpreadsheet,
} from 'lucide-react';
import SalesTabContainer from '@/components/billing/sales/SalesTabContainer';
import PurchaseTabContainer from '@/components/billing/purchase/PurchaseTabContainer';
import ExpenseTabContainer from '@/components/billing/expenses/ExpenseTabContainer';
import ReportsTabContainer from '@/components/billing/reports/ReportsTabContainer';
import PartyModal from '@/components/billing/shared/PartyModal';
import CustomerLedgerModal from '@/components/billing/parties/CustomerLedgerModal';

export default function AdminBillingPage() {
  const [activeTab, setActiveTab] = useState<'sales' | 'purchase' | 'expenses' | 'reports' | 'parties'>('sales');
  const [partyFilter, setPartyFilter] = useState<'ALL' | 'CUSTOMER' | 'VENDOR'>('ALL');
  const [products, setProducts] = useState<any[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [licenseState, setLicenseState] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPartyModalOpen, setIsPartyModalOpen] = useState(false);
  const [selectedPartyForLedger, setSelectedPartyForLedger] = useState<any>(null);
  const [editingParty, setEditingParty] = useState<any>(null);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const timestamp = Date.now();
      const [prodRes, partyRes] = await Promise.all([
        fetch(`/api/products?t=${timestamp}`, { cache: 'no-store' }),
        fetch(`/api/billing/parties?t=${timestamp}`, { cache: 'no-store' }),
      ]);

      const prodData = await prodRes.json();
      const partyData = await partyRes.json();

      if (prodData.success) setProducts(prodData.data);
      if (partyData.success) setParties(partyData.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
    fetch('/api/license/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setLicenseState(data.license);
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="min-h-screen bg-[#FFFCFB] text-[#163B5C] flex flex-col justify-between">
      {/* Billing Header Bar */}
      <header className="bg-white border-b border-[#E8EDF2] sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/dashboard"
              className="p-2 rounded-xl border border-[#E8EDF2] text-[#64748B] hover:text-[#ED3500] hover:bg-[#FFF8F5] transition-all"
              title="Return to Main Admin Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <img
              src="/nexus-mark.svg"
              alt="Nexus Ecom logo"
              className="w-9 h-9 object-contain rounded-xl border border-[#E8EDF2]"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div>
              <h1 className="font-extrabold text-base sm:text-xl text-[#163B5C]">
                Nexus Ecom Billing & Accounting
              </h1>
              <span className="text-xs text-[#64748B] hidden sm:block">
                Invoices, Purchases, Daily Expenses & Profit & Loss Statement
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={fetchInitialData}
              className="px-3 py-2 rounded-xl border border-[#E8EDF2] bg-white hover:bg-gray-50 text-[#163B5C] font-bold text-xs flex items-center gap-1.5 shadow-2xs"
              title="Refresh All Billing Data"
            >
              <RefreshCw className={`w-4 h-4 text-[#ED3500] ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh Data</span>
            </button>

            <Link
              href="/admin/dashboard?tab=customers"
              className="px-3 py-2 rounded-xl border border-[#E8EDF2] bg-white hover:bg-gray-50 text-[#163B5C] font-bold text-xs flex items-center gap-1.5 shadow-2xs"
            >
              <Users className="w-4 h-4 text-emerald-700" />
              <span className="hidden sm:inline">Store Customers</span>
            </Link>

            <Link
              href="/admin/dashboard?tab=reports"
              className="px-3 py-2 rounded-xl border border-[#E8EDF2] bg-white hover:bg-gray-50 text-[#163B5C] font-bold text-xs flex items-center gap-1.5 shadow-2xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span className="hidden sm:inline">Reports &amp; Excel ↗</span>
            </Link>

            <button
              onClick={() => setIsPartyModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-[#163B5C] hover:bg-[#0F2A42] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
            >
              <Users className="w-4 h-4" /> + Add Customer / Vendor Party
            </button>
          </div>
        </div>
      </header>

      {/* Main Billing Portal Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#E8EDF2] pb-1 overflow-x-auto scrollbar-none scroll-smooth">
          <button
            onClick={() => setActiveTab('sales')}
            className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'sales'
                ? 'border-[#ED3500] text-[#ED3500] bg-[#FFF8F5]'
                : 'border-transparent text-[#64748B] hover:text-[#163B5C]'
            }`}
          >
            <FileText className="w-4 h-4" /> 1. Sales Module
          </button>
          <button
            onClick={() => setActiveTab('purchase')}
            className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'purchase'
                ? 'border-[#ED3500] text-[#ED3500] bg-[#FFF8F5]'
                : 'border-transparent text-[#64748B] hover:text-[#163B5C]'
            }`}
          >
            <ShoppingBag className="w-4 h-4" /> 2. Purchase Module
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'expenses'
                ? 'border-[#ED3500] text-[#ED3500] bg-[#FFF8F5]'
                : 'border-transparent text-[#64748B] hover:text-[#163B5C]'
            }`}
          >
            <Receipt className="w-4 h-4" /> 3. Daily Expenses
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'reports'
                ? 'border-[#ED3500] text-[#ED3500] bg-[#FFF8F5]'
                : 'border-transparent text-[#64748B] hover:text-[#163B5C]'
            }`}
          >
            <PieChart className="w-4 h-4" /> 4. P&L & Tax Reports
          </button>
          <button
            onClick={() => setActiveTab('parties')}
            className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'parties'
                ? 'border-[#ED3500] text-[#ED3500] bg-[#FFF8F5]'
                : 'border-transparent text-[#64748B] hover:text-[#163B5C]'
            }`}
          >
            <Users className="w-4 h-4" /> 5. Parties Ledger ({parties.length})
          </button>
        </div>

        {/* Tab Views */}
        {loading ? (
          <div className="py-20 text-center">
            <RefreshCw className="w-8 h-8 text-[#ED3500] animate-spin mx-auto" />
          </div>
        ) : licenseState?.features?.invoicingEnabled === false ? (
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-12 text-center max-w-xl mx-auto space-y-4 my-12 shadow-2xl">
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black">Billing & Invoicing Feature Locked</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              GST Invoicing & Accounting is not enabled in your current subscription plan ({licenseState?.planName || 'Current Plan'}).
            </p>
            <div className="pt-2">
              <Link
                href="/admin/dashboard"
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition inline-block"
              >
                Return to Dashboard & Upgrade Plan ↗
              </Link>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'sales' && <SalesTabContainer products={products} />}
            {activeTab === 'purchase' && <PurchaseTabContainer products={products} />}
            {activeTab === 'expenses' && <ExpenseTabContainer />}
            {activeTab === 'reports' && <ReportsTabContainer />}
            {activeTab === 'parties' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-black text-lg text-[#163B5C]">Customers & Suppliers Directory</h3>
                    <p className="text-xs text-[#64748B]">Manage customer accounts, vendor ledgers, and balances</p>
                  </div>
                  <button
                    onClick={() => setIsPartyModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-[#163B5C] hover:bg-[#0F2A42] text-white font-bold text-xs uppercase shadow-xs"
                  >
                    + Add New Party
                  </button>
                </div>

                {/* Sub-Filter Tabs: All, Customers, Vendors */}
                <div className="flex items-center gap-2 border-b border-[#E8EDF2] pb-2 overflow-x-auto">
                  {[
                    { id: 'ALL', label: `All Parties (${parties.length})` },
                    {
                      id: 'CUSTOMER',
                      label: `Customers (${parties.filter((p) => p.partyType === 'CUSTOMER' || p.partyType === 'BOTH').length})`,
                    },
                    {
                      id: 'VENDOR',
                      label: `Vendors / Suppliers (${parties.filter((p) => p.partyType === 'VENDOR' || p.partyType === 'BOTH').length})`,
                    },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setPartyFilter(tab.id as any)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
                        partyFilter === tab.id
                          ? 'bg-[#163B5C] text-white shadow-2xs'
                          : 'bg-white border border-[#E8EDF2] text-[#64748B] hover:text-[#163B5C]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="bg-white rounded-2xl border border-[#E8EDF2] overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#FFFCFB] border-b border-[#E8EDF2] text-[#64748B] font-bold uppercase">
                          <th className="p-4">Party Type</th>
                          <th className="p-4">Name</th>
                          <th className="p-4">Mobile Phone</th>
                          <th className="p-4">GSTIN</th>
                          <th className="p-4 text-right">Account Balance</th>
                          <th className="p-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E8EDF2]">
                        {parties
                          .filter((p) => {
                            if (partyFilter === 'CUSTOMER') return p.partyType === 'CUSTOMER' || p.partyType === 'BOTH';
                            if (partyFilter === 'VENDOR') return p.partyType === 'VENDOR' || p.partyType === 'BOTH';
                            return true;
                          })
                          .map((p) => (
                            <tr key={p._id} className="hover:bg-[#FFFCFB]/80">
                              <td className="p-4">
                                <span
                                  className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                    p.partyType === 'VENDOR'
                                      ? 'bg-amber-100 text-amber-800'
                                      : p.partyType === 'BOTH'
                                      ? 'bg-purple-100 text-purple-800'
                                      : 'bg-blue-100 text-blue-800'
                                  }`}
                                >
                                  {p.partyType}
                                </span>
                              </td>
                              <td className="p-4 font-bold text-[#163B5C]">{p.name}</td>
                              <td className="p-4 font-semibold text-gray-600">{p.phone}</td>
                              <td className="p-4 font-mono text-gray-500">{p.gstin || 'Unregistered'}</td>
                              <td className="p-4 text-right">
                                {p.currentBalance > 0 ? (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-rose-50 text-rose-700 border border-rose-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                    + {formatCurrency(p.currentBalance)} (To Receive)
                                  </span>
                                ) : p.currentBalance < 0 ? (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    - {formatCurrency(Math.abs(p.currentBalance))} (To Pay / Credit)
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold bg-slate-100 text-slate-600 border border-slate-200">
                                    $0 (Settled)
                                  </span>
                                )}
                              </td>
                              <td className="p-4 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => setSelectedPartyForLedger(p)}
                                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#163B5C] hover:text-white text-[#163B5C] font-bold text-xs inline-flex items-center gap-1.5 transition-colors shadow-2xs"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-[#ED3500]" /> View Orders
                                  </button>
                                  <button
                                    onClick={() => setEditingParty(p)}
                                    className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-blue-600 hover:text-white text-blue-700 font-bold text-xs inline-flex items-center gap-1.5 transition-colors shadow-2xs"
                                    title="Edit Customer / Vendor Details"
                                  >
                                    <Edit className="w-3.5 h-3.5" /> Edit
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {isPartyModalOpen && (
        <PartyModal
          onClose={() => setIsPartyModalOpen(false)}
          onSuccess={() => fetchInitialData()}
        />
      )}

      {editingParty && (
        <PartyModal
          initialData={editingParty}
          onClose={() => setEditingParty(null)}
          onSuccess={() => fetchInitialData()}
        />
      )}

      {selectedPartyForLedger && (
        <CustomerLedgerModal
          party={selectedPartyForLedger}
          onClose={() => setSelectedPartyForLedger(null)}
        />
      )}
    </div>
  );
}
