'use client';

import React, { useState } from 'react';
import { Search, Plus, Tag, Layers, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

export interface ProductVariant {
  _id?: string;
  name: string;
  mrp: number | string;
  price: number | string;
  quantity: number | string;
  discount?: number;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  image: string;
  mrp: number;
  price: number;
  discount?: number;
  quantity: number;
  gst: number;
  category: string;
  variants?: ProductVariant[];
  createdAt?: string;
}

interface ProductGridProps {
  products: Product[];
  categories: { _id: string; name: string }[];
  onAddToCart: (product: Product, variant?: ProductVariant) => void;
}

export default function ProductGrid({ products, categories, onAddToCart }: ProductGridProps) {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');

  // Filter products by search and category
  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCat === 'All' || p.category === selectedCat;
    const searchLower = search.toLowerCase().trim();
    const matchesSearch =
      !searchLower ||
      p.name.toLowerCase().includes(searchLower) ||
      (p.category && p.category.toLowerCase().includes(searchLower)) ||
      (p.variants && p.variants.some((v) => v.name.toLowerCase().includes(searchLower)));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="flex flex-col h-full min-h-0 space-y-3">
      {/* Search & Category Filter Bar */}
      <div className="shrink-0 space-y-2.5 bg-white p-3.5 rounded-2xl border border-[#E8EDF2] shadow-2xs">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
          <input
            type="text"
            placeholder="Scan barcode or search product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#E8EDF2] text-xs focus:outline-none focus:border-[#ED3500] font-semibold bg-[#FFFCFB]"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#64748B] hover:text-[#163B5C]"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          <button
            onClick={() => setSelectedCat('All')}
            className={`px-3 py-1 rounded-lg text-[11px] font-black whitespace-nowrap transition-all ${
              selectedCat === 'All'
                ? 'bg-[#ED3500] text-white shadow-2xs'
                : 'bg-[#FFFCFB] text-[#64748B] border border-[#E8EDF2] hover:text-[#163B5C]'
            }`}
          >
            All ({products.length})
          </button>
          {categories.map((c) => {
            const count = products.filter((p) => p.category === c.name).length;
            return (
              <button
                key={c._id}
                onClick={() => setSelectedCat(c.name)}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
                  selectedCat === c.name
                    ? 'bg-[#ED3500] text-white shadow-2xs'
                    : 'bg-[#FFFCFB] text-[#64748B] border border-[#E8EDF2] hover:text-[#163B5C]'
                }`}
              >
                {c.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Product Cards (Scrollable Area) */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-1 pb-8">
        {filteredProducts.length === 0 ? (
          <div className="py-12 text-center bg-white rounded-2xl border border-[#E8EDF2] p-6 space-y-2">
            <AlertCircle className="w-8 h-8 text-[#64748B] mx-auto opacity-40" />
            <p className="text-xs font-bold text-[#163B5C]">No matching products found</p>
            <p className="text-[11px] text-[#64748B]">Try clearing the search or category filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 pb-6">
            {filteredProducts.map((p) => {
              const hasVariants = p.variants && p.variants.length > 0;
              const isMainStockOut = p.quantity <= 0;

              return (
                <div
                  key={p._id}
                  className="bg-white rounded-2xl border border-[#E8EDF2] p-3 flex flex-col justify-between hover:border-[#ED3500]/40 transition-all shadow-2xs hover:shadow-md group"
                >
                  <div className="space-y-2">
                    {/* Image & Stock Badge */}
                    <div className="relative aspect-square rounded-xl bg-[#FFF8F5] overflow-hidden border border-[#E8EDF2]">
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLElement).setAttribute(
                            'src',
                            'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80'
                          );
                        }}
                      />
                      <span
                        className={`absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wide shadow-2xs ${
                          isMainStockOut
                            ? 'bg-rose-600 text-white'
                            : 'bg-emerald-600 text-white'
                        }`}
                      >
                        {isMainStockOut ? 'Out of Stock' : `Stock: ${p.quantity}`}
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] font-black text-[#64748B] uppercase block tracking-wider">
                        {p.category || 'General'}
                      </span>
                      <h4 className="font-extrabold text-xs text-[#163B5C] line-clamp-2 leading-tight">
                        {p.name}
                      </h4>
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-black text-[#ED3500]">
                        {formatCurrency(p.price)}
                      </span>
                      {p.mrp > p.price && (
                        <span className="text-[10px] text-[#64748B] line-through">
                          {formatCurrency(p.mrp)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Add Actions */}
                  <div className="pt-2 space-y-1.5">
                    {/* Variant Quick Taps */}
                    {hasVariants && (
                      <div className="flex items-center gap-1 flex-wrap">
                        {p.variants!.map((v) => (
                          <button
                            key={v.name}
                            type="button"
                            onClick={() => onAddToCart(p, v)}
                            className="px-2 py-0.5 rounded-md bg-[#FFF8F5] hover:bg-[#ED3500] text-[#ED3500] hover:text-white border border-[#ED3500]/20 text-[10px] font-bold transition-all flex items-center gap-1"
                            title={`Add ${v.name} to POS Bill (${formatCurrency(v.price)})`}
                          >
                            <Plus className="w-3 h-3" /> {v.name}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Base Add Button */}
                    <button
                      type="button"
                      disabled={isMainStockOut}
                      onClick={() => onAddToCart(p)}
                      className={`w-full py-2 px-2 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all ${
                        isMainStockOut
                          ? 'bg-[#E8EDF2] text-[#64748B] cursor-not-allowed'
                          : 'bg-[#163B5C] hover:bg-[#ED3500] text-white shadow-2xs'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" /> {hasVariants ? 'Base Item' : 'Add Item'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
