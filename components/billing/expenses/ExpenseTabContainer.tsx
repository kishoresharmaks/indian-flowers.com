'use client';

import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, Filter, Receipt, Trash2, Layers } from 'lucide-react';
import ExpenseFormModal from './ExpenseFormModal';
import ExpenseCategoryManager from './ExpenseCategoryManager';
import { formatCurrency } from '@/lib/currency';

export default function ExpenseTabContainer() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/billing/expenses?category=${encodeURIComponent(selectedCategory)}`);
      const data = await res.json();
      if (data.success) setExpenses(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/billing/expense-categories');
      const data = await res.json();
      if (data.success) setCategories(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [selectedCategory]);

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense entry?')) return;
    try {
      const res = await fetch(`/api/billing/expenses?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) fetchExpenses();
    } catch (err) {
      console.error(err);
    }
  };

  const totalExpenseAmount = expenses.reduce((s, e) => s + (e.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Category Filter & Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#E8EDF2] shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none w-full sm:w-auto">
          <span className="text-xs font-bold text-[#64748B] flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Category:
          </span>
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
              selectedCategory === 'All'
                ? 'bg-[#163B5C] text-white'
                : 'bg-gray-50 border border-[#E8EDF2] text-[#64748B]'
            }`}
          >
            All Categories
          </button>
          {categories.map((c) => (
            <button
              key={c._id || c.name}
              onClick={() => setSelectedCategory(c.name)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
                selectedCategory === c.name
                  ? 'bg-[#163B5C] text-white'
                  : 'bg-gray-50 border border-[#E8EDF2] text-[#64748B]'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-[#E8EDF2] hover:bg-gray-50 text-[#163B5C] font-bold text-xs flex items-center gap-1.5"
          >
            <Layers className="w-4 h-4 text-[#163B5C]" /> Manage Categories
          </button>
          <button
            onClick={() => setIsLogModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#ED3500] hover:bg-[#D02E00] text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" /> Log Daily Expense
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center font-bold">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs uppercase font-extrabold opacity-80 block">
              Total Logged Expenses ({selectedCategory})
            </span>
            <span className="text-2xl font-black">{formatCurrency(totalExpenseAmount)}</span>
          </div>
        </div>
        <span className="text-xs font-bold bg-white/20 px-3 py-1.5 rounded-xl">
          {expenses.length} Expense Entries
        </span>
      </div>

      {/* Expense History Table */}
      {loading ? (
        <div className="py-20 text-center">
          <RefreshCw className="w-8 h-8 text-[#ED3500] animate-spin mx-auto" />
        </div>
      ) : expenses.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-[#E8EDF2] p-8 space-y-3">
          <Receipt className="w-12 h-12 text-[#64748B] mx-auto opacity-40" />
          <h3 className="text-lg font-bold text-[#163B5C]">No expense entries recorded</h3>
          <p className="text-xs text-[#64748B]">Click above to log your daily operational expenses.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E8EDF2] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-[#FFFCFB] border-b border-[#E8EDF2] text-[#64748B] font-bold uppercase">
                  <th className="p-4">Exp No & Date</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Title / Description</th>
                  <th className="p-4">Payment Mode</th>
                  <th className="p-4">Paid To</th>
                  <th className="p-4 text-right">Amount ($)</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8EDF2]">
                {expenses.map((e) => (
                  <tr key={e._id} className="hover:bg-[#FFFCFB]/80">
                    <td className="p-4">
                      <span className="font-extrabold text-[#163B5C] block">{e.expenseNumber}</span>
                      <span className="text-[11px] text-[#64748B]">
                        {new Date(e.date || e.createdAt).toLocaleDateString('en-US')}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-bold text-[10px] uppercase">
                        {e.categoryName}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-[#163B5C]">{e.title}</td>
                    <td className="p-4 font-bold text-slate-700">{e.paymentMode}</td>
                    <td className="p-4 text-gray-500">{e.paidTo || '—'}</td>
                    <td className="p-4 text-right font-black text-rose-600 text-sm">
                      {formatCurrency(e.amount)}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDeleteExpense(e._id)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50"
                        title="Delete Expense Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {isLogModalOpen && (
        <ExpenseFormModal
          categories={categories}
          onClose={() => setIsLogModalOpen(false)}
          onSuccess={() => {
            fetchExpenses();
            fetchCategories();
          }}
        />
      )}

      {isCategoryModalOpen && (
        <ExpenseCategoryManager
          categories={categories}
          onClose={() => setIsCategoryModalOpen(false)}
          onRefresh={fetchCategories}
        />
      )}
    </div>
  );
}
