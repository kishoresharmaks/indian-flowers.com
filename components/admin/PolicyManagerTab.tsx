'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Check,
  Save,
  RefreshCw,
  Eye,
  Edit3,
  ExternalLink,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  Truck,
  Lock,
  Scale,
  Cookie,
  Info,
  CheckCircle2,
} from 'lucide-react';
import PolicyContentRenderer from '@/components/policies/PolicyContentRenderer';

export interface IPolicyItem {
  _id?: string;
  slug: string;
  title: string;
  subtitle?: string;
  category: string;
  content: string;
  effectiveDate: string;
  lastUpdated: string;
  metaDescription?: string;
  isPublished: boolean;
  order: number;
}

const POLICY_ICONS: Record<string, React.ReactNode> = {
  'privacy-policy': <Lock className="w-4 h-4 text-emerald-700" />,
  'shipping-policy': <Truck className="w-4 h-4 text-emerald-700" />,
  'terms-and-conditions': <Scale className="w-4 h-4 text-emerald-700" />,
  'refund-policy': <RotateCcw className="w-4 h-4 text-emerald-700" />,
  'disclaimer': <AlertTriangle className="w-4 h-4 text-emerald-700" />,
  'cookie-policy': <Cookie className="w-4 h-4 text-emerald-700" />,
};

export default function PolicyManagerTab() {
  const [policies, setPolicies] = useState<IPolicyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlug, setSelectedSlug] = useState<string>('privacy-policy');
  const [activeMode, setActiveMode] = useState<'edit' | 'preview'>('edit');
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | ''; text: string }>({
    type: '',
    text: '',
  });

  // Current editing state
  const [formData, setFormData] = useState<Partial<IPolicyItem>>({});
  const [isDirty, setIsDirty] = useState(false);

  // Reset confirmation modal
  const [confirmResetSlug, setConfirmResetSlug] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/policies?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setPolicies(data.data);
        // If current selected slug doesn't exist, pick the first
        const current = data.data.find((p: IPolicyItem) => p.slug === selectedSlug) || data.data[0];
        if (current) {
          setSelectedSlug(current.slug);
          setFormData(current);
          setIsDirty(false);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch policies:', err);
      setStatusMessage({ type: 'error', text: 'Failed to load policies from database.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleSelectPolicy = (policy: IPolicyItem) => {
    if (isDirty) {
      const confirmLeave = window.confirm(
        'You have unsaved changes to the current policy. Discard and switch?'
      );
      if (!confirmLeave) return;
    }
    setSelectedSlug(policy.slug);
    setFormData(policy);
    setIsDirty(false);
    setStatusMessage({ type: '', text: '' });
  };

  const handleChange = (field: keyof IPolicyItem, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedSlug) return;

    try {
      setIsSaving(true);
      setStatusMessage({ type: '', text: '' });

      const res = await fetch(`/api/policies/${selectedSlug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          lastUpdated: new Date().toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          }),
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setStatusMessage({
          type: 'success',
          text: `"${data.data.title}" updated successfully! Changes are live on the storefront.`,
        });
        setIsDirty(false);
        // Refresh local list
        setPolicies((prev) =>
          prev.map((p) => (p.slug === selectedSlug ? data.data : p))
        );
        setFormData(data.data);
      } else {
        setStatusMessage({
          type: 'error',
          text: data.message || 'Failed to update policy.',
        });
      }
    } catch (err: any) {
      console.error('Error saving policy:', err);
      setStatusMessage({ type: 'error', text: err.message || 'Server error while saving.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefault = async (slugToReset: string) => {
    try {
      setIsResetting(true);
      setStatusMessage({ type: '', text: '' });

      const res = await fetch(`/api/policies/${slugToReset}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToDefault: true }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setStatusMessage({
          type: 'success',
          text: `Policy "${slugToReset}" has been reset to official US Perishable Flora template.`,
        });
        setConfirmResetSlug(null);
        setIsDirty(false);
        setPolicies((prev) =>
          prev.map((p) => (p.slug === slugToReset ? data.data : p))
        );
        if (selectedSlug === slugToReset) {
          setFormData(data.data);
        }
      } else {
        setStatusMessage({
          type: 'error',
          text: data.message || 'Failed to reset policy.',
        });
      }
    } catch (err: any) {
      console.error('Error resetting policy:', err);
      setStatusMessage({ type: 'error', text: err.message || 'Server error while resetting.' });
    } finally {
      setIsResetting(false);
    }
  };

  const insertMarkdownSnippet = (snippet: string) => {
    const current = formData.content || '';
    setFormData((prev) => ({
      ...prev,
      content: current + '\n\n' + snippet,
    }));
    setIsDirty(true);
  };

  const activePolicy = policies.find((p) => p.slug === selectedSlug);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0B3B24] to-[#134633] text-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 rounded-full">
              US Compliance &amp; Legal Disclosures
            </span>
            <span className="text-xs text-white/70">
              USD ($) Market Standard
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Store Policies &amp; Legal Management
          </h2>
          <p className="text-xs sm:text-sm text-white/80 max-w-2xl mt-1">
            Edit and customize the 6 official US legal policies governing fresh perishable flora delivery, CCPA privacy, overnight shipping guarantees, and botanical disclosures.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center">
          <button
            type="button"
            onClick={fetchPolicies}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-2 transition-all border border-white/20"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Reload</span>
          </button>
          <a
            href={`/policy/${selectedSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-[#0B3B24] font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>View Live Page</span>
          </a>
        </div>
      </div>

      {/* Status Alert Notification */}
      {statusMessage.text && (
        <div
          className={`p-4 rounded-xl text-xs sm:text-sm flex items-start justify-between gap-3 border animate-fadeIn ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage({ type: '', text: '' })}
            className="text-stone-400 hover:text-stone-700 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid: Policy Selector + Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Policy List Navigation (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-500">
                Store Policies ({policies.length})
              </h3>
              <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                All US Compliant
              </span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-stone-400">
                <RefreshCw className="w-5 h-5 mx-auto mb-2 animate-spin text-emerald-600" />
                Loading policy documents...
              </div>
            ) : (
              <div className="space-y-1.5">
                {policies.map((policy) => {
                  const isSelected = policy.slug === selectedSlug;
                  return (
                    <button
                      key={policy.slug}
                      type="button"
                      onClick={() => handleSelectPolicy(policy)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${
                        isSelected
                          ? 'bg-[#0B3B24] text-white border-[#0B3B24] shadow-sm'
                          : 'bg-white hover:bg-stone-50 text-stone-800 border-stone-200'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-white/15 text-white' : 'bg-[#FAF6F0] text-[#0B3B24]'
                        }`}
                      >
                        {POLICY_ICONS[policy.slug] || <FileText className="w-4 h-4" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={`text-xs font-bold truncate ${
                              isSelected ? 'text-white' : 'text-stone-900'
                            }`}
                          >
                            {policy.title}
                          </span>
                          {policy.isPublished ? (
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                isSelected
                                  ? 'bg-emerald-400/30 text-emerald-200'
                                  : 'bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              Live
                            </span>
                          ) : (
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                isSelected
                                  ? 'bg-amber-400/30 text-amber-200'
                                  : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              Draft
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-[11px] truncate mt-0.5 ${
                            isSelected ? 'text-white/70' : 'text-stone-500'
                          }`}
                        >
                          /policy/{policy.slug}
                        </p>
                        <p
                          className={`text-[10px] mt-1 ${
                            isSelected ? 'text-white/60' : 'text-stone-400'
                          }`}
                        >
                          Updated: {policy.lastUpdated || 'Recently'}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Notice Card */}
          <div className="bg-[#FAF6F0] border border-amber-200/80 rounded-2xl p-4 text-xs text-stone-700 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-[#0B3B24]">
              <Info className="w-4 h-4 text-amber-600" />
              <span>US Perishable Floral Regulations</span>
            </div>
            <p className="text-[11px] leading-relaxed text-stone-600">
              All policies are calibrated to standard US ecommerce guidelines, CCPA/CPRA consumer data protections, Razorpay gateway card disclosures, and USDA/carrier perishable cut-flower transit rules.
            </p>
          </div>
        </div>

        {/* Right Column: Policy Editor & Live Preview (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <form onSubmit={handleSave} className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            {/* Editor Action Bar */}
            <div className="p-4 sm:p-5 bg-[#FAF6F0] border-b border-stone-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#0B3B24]">
                    Editing Document:
                  </span>
                  <code className="text-xs px-2 py-0.5 rounded bg-white border border-stone-300 font-mono text-stone-800">
                    /policy/{selectedSlug}
                  </code>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-stone-900 mt-1">
                  {formData.title || 'Selected Policy'}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {/* Mode Switch: Edit vs Preview */}
                <div className="bg-white border border-stone-300 rounded-xl p-0.5 flex items-center shadow-xs">
                  <button
                    type="button"
                    onClick={() => setActiveMode('edit')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
                      activeMode === 'edit'
                        ? 'bg-[#0B3B24] text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Markdown</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMode('preview')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
                      activeMode === 'preview'
                        ? 'bg-[#0B3B24] text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Live Preview</span>
                  </button>
                </div>

                {/* Reset button */}
                <button
                  type="button"
                  onClick={() => setConfirmResetSlug(selectedSlug)}
                  className="px-3 py-1.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                  title="Reset to official US template"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
                  <span className="hidden sm:inline">Reset Template</span>
                </button>

                {/* Save button */}
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`px-4 py-1.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs transition-all ${
                    isDirty
                      ? 'bg-[#0B3B24] hover:bg-[#134633] text-white'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                  }`}
                >
                  {isSaving ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>{isSaving ? 'Saving...' : isDirty ? 'Save Changes *' : 'Saved'}</span>
                </button>
              </div>
            </div>

            {/* Document Metadata Fields */}
            <div className="p-4 sm:p-5 border-b border-stone-200 space-y-4 bg-stone-50/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Document Title
                  </label>
                  <input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder="e.g. Privacy Policy"
                    className="w-full text-xs font-medium px-3 py-2 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3B24]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Category Tag
                  </label>
                  <input
                    type="text"
                    value={formData.category || ''}
                    onChange={(e) => handleChange('category', e.target.value)}
                    placeholder="e.g. Legal & Privacy"
                    className="w-full text-xs font-medium px-3 py-2 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3B24]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Introductory Subtitle / Lead Paragraph
                </label>
                <textarea
                  rows={2}
                  value={formData.subtitle || ''}
                  onChange={(e) => handleChange('subtitle', e.target.value)}
                  placeholder="A clear 1-2 sentence overview of what this policy governs..."
                  className="w-full text-xs font-medium px-3 py-2 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3B24]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Effective Date
                  </label>
                  <input
                    type="text"
                    value={formData.effectiveDate || ''}
                    onChange={(e) => handleChange('effectiveDate', e.target.value)}
                    placeholder="e.g. January 1, 2025"
                    className="w-full text-xs font-medium px-3 py-2 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3B24]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Last Updated (Auto or Custom)
                  </label>
                  <input
                    type="text"
                    value={formData.lastUpdated || ''}
                    onChange={(e) => handleChange('lastUpdated', e.target.value)}
                    placeholder="e.g. October 15, 2026"
                    className="w-full text-xs font-medium px-3 py-2 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3B24]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.isPublished ? 'published' : 'draft'}
                    onChange={(e) => handleChange('isPublished', e.target.value === 'published')}
                    className="w-full text-xs font-medium px-3 py-2 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3B24]"
                  >
                    <option value="published">Published (Live on Storefront)</option>
                    <option value="draft">Draft (Hidden)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Meta Description (For Google Search &amp; SEO)
                </label>
                <input
                  type="text"
                  value={formData.metaDescription || ''}
                  onChange={(e) => handleChange('metaDescription', e.target.value)}
                  placeholder="Concise SEO description shown in Google search results..."
                  className="w-full text-xs font-medium px-3 py-2 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3B24]"
                />
              </div>
            </div>

            {/* Document Content View: Markdown Editor or Preview */}
            <div className="p-4 sm:p-5">
              {activeMode === 'edit' ? (
                <div className="space-y-3">
                  {/* Markdown Helper Toolbar */}
                  <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-stone-100 text-xs text-stone-600">
                    <span className="text-[10px] font-bold text-stone-400 uppercase mr-1">
                      Insert:
                    </span>
                    <button
                      type="button"
                      onClick={() => insertMarkdownSnippet('## Section Title')}
                      className="px-2 py-1 rounded bg-stone-100 hover:bg-stone-200 font-mono text-[11px]"
                    >
                      H2 Heading
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdownSnippet('### Subsection Title')}
                      className="px-2 py-1 rounded bg-stone-100 hover:bg-stone-200 font-mono text-[11px]"
                    >
                      H3 Heading
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdownSnippet('**bold text**')}
                      className="px-2 py-1 rounded bg-stone-100 hover:bg-stone-200 font-bold text-[11px]"
                    >
                      Bold
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdownSnippet('* Bullet item 1\n* Bullet item 2')}
                      className="px-2 py-1 rounded bg-stone-100 hover:bg-stone-200 text-[11px]"
                    >
                      List
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        insertMarkdownSnippet(
                          '| Delivery Option | Estimated Arrival | Pricing (USD) |\n| :--- | :--- | :--- |\n| Priority Overnight | Next Morning by 10:30 AM | Free over $150 |'
                        )
                      }
                      className="px-2 py-1 rounded bg-stone-100 hover:bg-stone-200 text-[11px]"
                    >
                      Table
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        insertMarkdownSnippet(
                          '> **Important Legal Notice:** All fresh floral arrangements are non-edible and intended strictly for ceremonial use.'
                        )
                      }
                      className="px-2 py-1 rounded bg-stone-100 hover:bg-stone-200 text-[11px]"
                    >
                      Alert Box
                    </button>
                  </div>

                  {/* Textarea Editor */}
                  <textarea
                    rows={18}
                    value={formData.content || ''}
                    onChange={(e) => handleChange('content', e.target.value)}
                    placeholder="Enter policy markdown text here..."
                    className="w-full font-mono text-xs sm:text-sm p-4 bg-stone-50 border border-stone-200 rounded-xl leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3B24] transition-all"
                  />

                  <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
                    <span>
                      Markdown formatted: headings (`##`), bullet lists (`*`), tables (`|`), and blockquotes (`&gt;`).
                    </span>
                    <span>
                      {(formData.content || '').length} characters &bull;{' '}
                      {(formData.content || '').split(/\s+/).filter(Boolean).length} words
                    </span>
                  </div>
                </div>
              ) : (
                /* Live Preview Mode */
                <div className="space-y-4">
                  <div className="bg-[#FAF6F0] p-4 rounded-xl border border-stone-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Live Preview Mode
                      </span>
                      <p className="text-xs text-stone-600 mt-1">
                        Rendering with standard Plus Jakarta Sans typography exactly as your customers experience it.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveMode('edit')}
                      className="px-3 py-1.5 rounded-lg bg-white border border-stone-300 text-xs font-bold text-stone-800 hover:bg-stone-50"
                    >
                      Back to Editor
                    </button>
                  </div>

                  <div className="p-6 bg-white border border-stone-200 rounded-xl min-h-[400px]">
                    <div className="border-b border-stone-200 pb-4 mb-6">
                      <h1 className="text-2xl sm:text-3xl font-bold text-stone-900">
                        {formData.title || 'Policy Title'}
                      </h1>
                      {formData.subtitle && (
                        <p className="text-sm text-stone-600 mt-2 leading-relaxed">
                          {formData.subtitle}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-stone-500 mt-3">
                        <span>Effective: {formData.effectiveDate || 'N/A'}</span>
                        <span>&bull;</span>
                        <span>Updated: {formData.lastUpdated || 'N/A'}</span>
                      </div>
                    </div>

                    <PolicyContentRenderer content={formData.content || ''} />
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Footer Bar */}
            <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
              <span className="text-xs text-stone-500 inline-flex items-center gap-1.5">
                {isDirty ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>You have unsaved changes.</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>All changes up to date.</span>
                  </>
                )}
              </span>

              <div className="flex items-center gap-2">
                <a
                  href={`/policy/${selectedSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl border border-stone-300 text-stone-700 bg-white hover:bg-stone-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Preview URL</span>
                </a>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-[#0B3B24] hover:bg-[#134633] text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
                >
                  {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Policy Changes</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Confirmation Modal: Reset Policy to Default Template */}
      {confirmResetSlug && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[92vh] sm:max-h-[90vh] flex flex-col p-6 space-y-4 shadow-xl border border-stone-200 animate-fadeIn overflow-y-auto">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h4 className="text-base font-bold text-stone-900">
                  Reset Policy to Official US Template?
                </h4>
                <p className="text-xs text-stone-500">
                  Document: <span className="font-mono font-semibold">{confirmResetSlug}</span>
                </p>
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              This will overwrite the current content of this policy with the comprehensive, legally vetted US Perishable Floral template. Any custom wording you entered will be replaced.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmResetSlug(null)}
                disabled={isResetting}
                className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleResetToDefault(confirmResetSlug)}
                disabled={isResetting}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                {isResetting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                <span>{isResetting ? 'Resetting...' : 'Yes, Reset to Default'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
