'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Search,
  ExternalLink,
  Copy,
  Check,
  Globe,
  Download,
  AlertCircle,
  MapPin,
  Loader2,
  Share2,
} from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

interface SeoPageItem {
  _id: string;
  name: string;
  slug: string;
  price: number;
  mrp: number;
  city: string;
  state: string;
  tags: string[];
  relativeUrl: string;
  storefrontUrl: string;
  isActive: boolean;
  image: string;
}

interface ProductSeoPagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string | null;
  productName: string;
  productImage?: string;
  productPrice?: number;
  productSlug?: string;
}

export default function ProductSeoPagesModal({
  isOpen,
  onClose,
  productId,
  productName,
  productImage,
  productPrice,
  productSlug,
}: ProductSeoPagesModalProps) {
  const [loading, setLoading] = useState(false);
  const [seoPages, setSeoPages] = useState<SeoPageItem[]>([]);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  useEffect(() => {
    if (!isOpen || !productId) {
      setSeoPages([]);
      setError('');
      setSearchQuery('');
      setSelectedState('All');
      return;
    }

    const fetchSeoPages = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await fetch(`/api/admin/products/${productId}/seo-pages`);
        const json = await res.json();
        if (json.success) {
          setSeoPages(json.data || []);
        } else {
          setError(json.message || 'Failed to load SEO pages');
        }
      } catch (err: any) {
        setError(err.message || 'Network error fetching SEO pages');
      } finally {
        setLoading(false);
      }
    };

    fetchSeoPages();
  }, [isOpen, productId]);

  // Extract distinct US States present in the results
  const distinctStates = useMemo(() => {
    const states = new Set<string>();
    seoPages.forEach((p) => {
      if (p.state && p.state !== 'USA') states.add(p.state);
    });
    return Array.from(states).sort();
  }, [seoPages]);

  // Filtered pages
  const filteredPages = useMemo(() => {
    return seoPages.filter((p) => {
      if (selectedState !== 'All' && p.state !== selectedState) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        p.city.toLowerCase().includes(q) ||
        p.state.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q)
      );
    });
  }, [seoPages, searchQuery, selectedState]);

  // Copy single URL
  const handleCopyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Copy all URLs
  const handleCopyAll = () => {
    const allUrls = filteredPages.map((p) => p.storefrontUrl).join('\n');
    navigator.clipboard.writeText(allUrls);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  // Export to CSV
  const handleExportCsv = () => {
    if (filteredPages.length === 0) return;
    const headers = ['City', 'State', 'Product Title', 'Slug', 'Selling Price ($)', 'Live Storefront URL'];
    const rows = filteredPages.map((p) => [
      `"${p.city.replace(/"/g, '""')}"`,
      `"${p.state.replace(/"/g, '""')}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.slug}"`,
      p.price,
      `"${p.storefrontUrl}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SEO_State_Pages_${productSlug || 'product'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-stone-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-200 bg-gradient-to-r from-[#0B3B24] to-[#1C563F] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {productImage ? (
              <img
                src={productImage}
                alt={productName}
                className="w-12 h-12 object-cover rounded-xl bg-white/10 border border-white/20 shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-emerald-800/40 border border-white/20 flex items-center justify-center shrink-0">
                <Globe className="w-6 h-6 text-emerald-300" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base text-white tracking-tight truncate">
                  {productName}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 text-[11px] font-extrabold border border-emerald-400/30 flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  {seoPages.length} State Pages
                </span>
              </div>
              <p className="text-xs text-emerald-100/80 truncate mt-0.5">
                Programmatic Local SEO landing pages targeting US cities &amp; states
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors ml-2 shrink-0"
            title="Close popup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="p-3 sm:p-4 border-b border-stone-200 bg-stone-50 flex flex-wrap items-center gap-2.5 shrink-0 justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search city, state (e.g. San Jose, Detroit, California)..."
                className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl border border-stone-200 bg-white text-stone-800 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            {distinctStates.length > 0 && (
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-white text-stone-700 focus:outline-none focus:border-emerald-600 shrink-0"
              >
                <option value="All">All States ({seoPages.length})</option>
                {distinctStates.map((st) => (
                  <option key={st} value={st}>
                    {st} ({seoPages.filter((p) => p.state === st).length})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyAll}
              disabled={filteredPages.length === 0}
              className="px-3 py-2 text-xs font-bold rounded-xl border border-stone-200 bg-white hover:bg-stone-100 text-stone-700 flex items-center gap-1.5 transition-all disabled:opacity-50"
              title="Copy all filtered URLs to clipboard"
            >
              {copiedAll ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied {filteredPages.length} URLs!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-stone-500" />
                  <span>Copy URLs</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              disabled={filteredPages.length === 0}
              className="px-3 py-2 text-xs font-bold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5 transition-all disabled:opacity-50 shadow-sm"
              title="Export to CSV spreadsheet"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px]">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-stone-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              <p className="text-xs font-semibold text-stone-600">Loading connected state pages...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : seoPages.length === 0 ? (
            <div className="py-16 text-center text-stone-400 space-y-2">
              <Globe className="w-10 h-10 mx-auto opacity-30 text-stone-400" />
              <p className="text-sm font-bold text-stone-600">No Programmatic State Pages</p>
              <p className="text-xs text-stone-500">
                This core product does not have any attached localized city/state landing pages.
              </p>
            </div>
          ) : filteredPages.length === 0 ? (
            <div className="py-12 text-center text-stone-400 space-y-2">
              <Search className="w-8 h-8 mx-auto opacity-30 text-stone-400" />
              <p className="text-xs font-bold text-stone-600">
                No state pages match &ldquo;{searchQuery}&rdquo;
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedState('All');
                }}
                className="text-xs font-bold text-emerald-700 underline"
              >
                Clear Search &amp; State Filters
              </button>
            </div>
          ) : (
            <div className="border border-stone-200 rounded-xl overflow-hidden shadow-xs bg-white">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Target Location</th>
                    <th className="py-3 px-4">SEO Page Title &amp; URL</th>
                    <th className="py-3 px-4 text-center">Price</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-xs">
                  {filteredPages.map((page) => (
                    <tr key={page._id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span className="font-bold text-stone-800">{page.city}</span>
                        </div>
                        {page.state && page.state !== 'USA' && (
                          <span className="inline-block mt-0.5 ml-5 text-[10.5px] font-medium text-stone-500">
                            {page.state}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-stone-800 line-clamp-1">{page.name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <code className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60 truncate max-w-md">
                            {page.relativeUrl}
                          </code>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {page.price > 0 ? (
                          <span className="font-extrabold text-stone-900">
                            {formatCurrency(page.price)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px] border border-amber-200">
                            <AlertCircle className="w-3 h-3" />
                            $0 (Missing Price)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopyUrl(page._id, page.storefrontUrl)}
                            className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-600 transition-colors"
                            title="Copy full storefront link"
                          >
                            {copiedId === page._id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <a
                            href={page.relativeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] border border-emerald-200 flex items-center gap-1 transition-colors"
                            title="Open live storefront page in new tab"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs text-stone-500 shrink-0">
          <div>
            Showing <strong className="text-stone-800">{filteredPages.length}</strong> of{' '}
            <strong className="text-stone-800">{seoPages.length}</strong> localized city pages
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-900 text-white font-bold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
