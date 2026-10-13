'use client';

import React, { useState } from 'react';
import { X, Plus, Layers, CheckCircle2 } from 'lucide-react';

interface ExpenseCategoryManagerProps {
  categories: any[];
  onClose: () => void;
  onRefresh: () => void;
}

export default function ExpenseCategoryManager({
  categories,
  onClose,
  onRefresh,
}: ExpenseCategoryManagerProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      setError('Category name required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const res = await fetch('/api/billing/expense-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });

      const data = await res.json();
      if (data.success) {
        setName('');
        setDescription('');
        onRefresh();
      } else {
        setError(data.message || 'Failed to create category.');
      }
    } catch (err: any) {
      setError(err.message || 'Server error creating category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 border border-[#E8EDF2] shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 text-[#64748B]"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#163B5C]/10 text-[#163B5C] flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-[#163B5C]">Custom Expense Categories</h3>
            <p className="text-xs text-[#64748B]">Manage custom expense categories for P&L reporting.</p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleAddCategory} className="space-y-3 p-4 rounded-2xl bg-[#FFFCFB] border border-[#E8EDF2]">
          <h4 className="text-xs font-extrabold text-[#163B5C] uppercase">+ Add New Custom Category</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              required
              placeholder="Category Name (e.g. Farm Labor)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-3 py-2 rounded-xl border border-[#E8EDF2] text-xs font-semibold"
            />
            <input
              type="text"
              placeholder="Description (Optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="px-3 py-2 rounded-xl border border-[#E8EDF2] text-xs font-semibold"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-xl bg-[#163B5C] hover:bg-[#0F2A42] text-white font-bold text-xs uppercase flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" /> {isSubmitting ? 'Saving...' : 'Add Custom Category'}
          </button>
        </form>

        {/* Existing Categories List */}
        <div className="space-y-2">
          <h4 className="text-xs font-extrabold text-[#64748B] uppercase">Existing Expense Categories ({categories.length})</h4>
          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
            {categories.map((c) => (
              <div key={c._id || c.name} className="p-3 rounded-xl bg-gray-50 border border-[#E8EDF2] flex items-center justify-between text-xs">
                <span className="font-bold text-[#163B5C]">{c.name}</span>
                <span className="text-[11px] text-[#64748B]">{c.description || 'Active Category'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
