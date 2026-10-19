'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Check,
  Save,
  RefreshCw,
  Eye,
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
  Sparkles,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Table as TableIcon,
  Quote,
  Minus,
  RemoveFormatting,
  Undo2,
  Redo2,
  Code,
  Type,
} from 'lucide-react';
import PolicyContentRenderer from '@/components/policies/PolicyContentRenderer';
import { isHtmlContent, markdownToHtml, htmlToPlainText } from '@/lib/richTextFormatters';

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
  const [activeMode, setActiveMode] = useState<'visual' | 'preview' | 'code'>('visual');
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | ''; text: string }>({
    type: '',
    text: '',
  });

  // Current editing state
  const [formData, setFormData] = useState<Partial<IPolicyItem>>({});
  const [isDirty, setIsDirty] = useState(false);

  // ContentEditable ref for WYSIWYG editing
  const editorRef = useRef<HTMLDivElement>(null);
  const lastHtmlRef = useRef<string>('');

  // Reset confirmation modal
  const [confirmResetSlug, setConfirmResetSlug] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // Helper to normalize policy content into rich semantic HTML so the user never sees raw markdown
  const normalizePolicy = (p: IPolicyItem): IPolicyItem => {
    const content = isHtmlContent(p.content) ? p.content : markdownToHtml(p.content);
    return { ...p, content };
  };

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/policies?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const normalizedList: IPolicyItem[] = data.data.map(normalizePolicy);
        setPolicies(normalizedList);
        // If current selected slug doesn't exist, pick the first
        const current = normalizedList.find((p: IPolicyItem) => p.slug === selectedSlug) || normalizedList[0];
        if (current) {
          setSelectedSlug(current.slug);
          setFormData(current);
          lastHtmlRef.current = current.content;
          if (editorRef.current) {
            editorRef.current.innerHTML = current.content;
          }
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

  // Synchronize contentEditable div when policy changes or switching back to visual mode
  useEffect(() => {
    if (activeMode === 'visual' && editorRef.current) {
      const currentEditorHtml = editorRef.current.innerHTML;
      const targetHtml = formData.content || '';
      if (currentEditorHtml !== targetHtml && lastHtmlRef.current !== targetHtml) {
        editorRef.current.innerHTML = targetHtml;
        lastHtmlRef.current = targetHtml;
      }
    }
  }, [activeMode, formData.content, selectedSlug]);

  const handleSelectPolicy = (policy: IPolicyItem) => {
    if (isDirty) {
      const confirmLeave = window.confirm(
        'You have unsaved changes to the current policy. Discard and switch?'
      );
      if (!confirmLeave) return;
    }
    const normalized = normalizePolicy(policy);
    setSelectedSlug(normalized.slug);
    setFormData(normalized);
    lastHtmlRef.current = normalized.content;
    if (editorRef.current) {
      editorRef.current.innerHTML = normalized.content;
    }
    setIsDirty(false);
    setStatusMessage({ type: '', text: '' });
  };

  const handleChange = (field: keyof IPolicyItem, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleEditorInput = () => {
    if (editorRef.current) {
      const currentHtml = editorRef.current.innerHTML;
      lastHtmlRef.current = currentHtml;
      handleChange('content', currentHtml);
    }
  };

  const execFormat = (command: string, value: string | undefined = undefined) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand(command, false, value);
      const currentHtml = editorRef.current.innerHTML;
      lastHtmlRef.current = currentHtml;
      handleChange('content', currentHtml);
    }
  };

  const insertHtmlBlock = (htmlBlock: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand('insertHTML', false, htmlBlock);
      const currentHtml = editorRef.current.innerHTML;
      lastHtmlRef.current = currentHtml;
      handleChange('content', currentHtml);
    }
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
        const normalized = normalizePolicy(data.data);
        setStatusMessage({
          type: 'success',
          text: `"${normalized.title}" updated successfully! Changes are live on the storefront.`,
        });
        setIsDirty(false);
        // Refresh local list
        setPolicies((prev) =>
          prev.map((p) => (p.slug === selectedSlug ? normalized : p))
        );
        setFormData(normalized);
        lastHtmlRef.current = normalized.content;
        if (editorRef.current) {
          editorRef.current.innerHTML = normalized.content;
        }
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
        const normalized = normalizePolicy(data.data);
        setStatusMessage({
          type: 'success',
          text: `Policy "${slugToReset}" has been reset to official US Perishable Flora template.`,
        });
        setConfirmResetSlug(null);
        setIsDirty(false);
        setPolicies((prev) =>
          prev.map((p) => (p.slug === slugToReset ? normalized : p))
        );
        if (selectedSlug === slugToReset) {
          setFormData(normalized);
          lastHtmlRef.current = normalized.content;
          if (editorRef.current) {
            editorRef.current.innerHTML = normalized.content;
          }
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
                {/* Mode Switch: Visual (Easy) vs Preview vs Source */}
                <div className="bg-white border border-stone-300 rounded-xl p-0.5 flex items-center shadow-xs">
                  <button
                    type="button"
                    onClick={() => setActiveMode('visual')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
                      activeMode === 'visual'
                        ? 'bg-[#0B3B24] text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Visual Editor (Easy)</span>
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
                  <button
                    type="button"
                    onClick={() => setActiveMode('code')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
                      activeMode === 'code'
                        ? 'bg-[#0B3B24] text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                    title="View HTML Source Code"
                  >
                    <Code className="w-3.5 h-3.5" />
                    <span>Source</span>
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

            {/* Document Content View: Visual Editor, Source Code, or Preview */}
            <div className="p-4 sm:p-5">
              {activeMode === 'visual' ? (
                <div className="space-y-3">
                  {/* Rich Text Visual Toolbar */}
                  <div className="bg-stone-50 border border-stone-200 rounded-xl p-2 flex flex-wrap items-center gap-1.5 shadow-2xs">
                    {/* Block Style Dropdown */}
                    <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-lg px-2 py-1 text-xs">
                      <Type className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                      <select
                        aria-label="Text Formatting Block"
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'p') execFormat('formatBlock', '<p>');
                          else if (val === 'h2') execFormat('formatBlock', '<h2>');
                          else if (val === 'h3') execFormat('formatBlock', '<h3>');
                          e.target.value = '';
                        }}
                        defaultValue=""
                        className="bg-transparent font-medium text-stone-700 focus:outline-none cursor-pointer text-xs"
                      >
                        <option value="" disabled>
                          Format Style...
                        </option>
                        <option value="p">Paragraph (Normal)</option>
                        <option value="h2">Section Title (H2)</option>
                        <option value="h3">Sub-heading (H3)</option>
                      </select>
                    </div>

                    <div className="h-5 w-px bg-stone-200 mx-0.5 hidden sm:block" />

                    {/* Quick Heading buttons */}
                    <button
                      type="button"
                      title="Make Large Heading (H2)"
                      onClick={() => execFormat('formatBlock', '<h2>')}
                      className="p-1.5 rounded-lg text-xs font-bold text-stone-700 hover:bg-stone-200/80 hover:text-[#0B3B24] transition-colors flex items-center gap-1"
                    >
                      <Heading2 className="w-4 h-4" />
                      <span className="hidden sm:inline text-[11px]">H2</span>
                    </button>
                    <button
                      type="button"
                      title="Make Subsection Heading (H3)"
                      onClick={() => execFormat('formatBlock', '<h3>')}
                      className="p-1.5 rounded-lg text-xs font-bold text-stone-700 hover:bg-stone-200/80 hover:text-[#0B3B24] transition-colors flex items-center gap-1"
                    >
                      <Heading3 className="w-4 h-4" />
                      <span className="hidden sm:inline text-[11px]">H3</span>
                    </button>

                    <div className="h-5 w-px bg-stone-200 mx-0.5" />

                    {/* Bold, Italic, Underline */}
                    <button
                      type="button"
                      title="Bold"
                      onClick={() => execFormat('bold')}
                      className="p-1.5 rounded-lg text-stone-700 hover:bg-stone-200/80 hover:text-[#0B3B24] transition-colors font-bold"
                    >
                      <Bold className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      title="Italic"
                      onClick={() => execFormat('italic')}
                      className="p-1.5 rounded-lg text-stone-700 hover:bg-stone-200/80 hover:text-[#0B3B24] transition-colors italic"
                    >
                      <Italic className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      title="Underline"
                      onClick={() => execFormat('underline')}
                      className="p-1.5 rounded-lg text-stone-700 hover:bg-stone-200/80 hover:text-[#0B3B24] transition-colors underline"
                    >
                      <Underline className="w-4 h-4" />
                    </button>

                    <div className="h-5 w-px bg-stone-200 mx-0.5" />

                    {/* Lists */}
                    <button
                      type="button"
                      title="Bullet List"
                      onClick={() => execFormat('insertUnorderedList')}
                      className="p-1.5 rounded-lg text-stone-700 hover:bg-stone-200/80 hover:text-[#0B3B24] transition-colors flex items-center gap-1"
                    >
                      <List className="w-4 h-4" />
                      <span className="hidden sm:inline text-[11px] font-medium">Bullet List</span>
                    </button>
                    <button
                      type="button"
                      title="Numbered List"
                      onClick={() => execFormat('insertOrderedList')}
                      className="p-1.5 rounded-lg text-stone-700 hover:bg-stone-200/80 hover:text-[#0B3B24] transition-colors flex items-center gap-1"
                    >
                      <ListOrdered className="w-4 h-4" />
                      <span className="hidden sm:inline text-[11px] font-medium">Numbered</span>
                    </button>

                    <div className="h-5 w-px bg-stone-200 mx-0.5" />

                    {/* Pre-styled Blocks */}
                    <button
                      type="button"
                      title="Insert Legal Notice / Alert Card"
                      onClick={() =>
                        insertHtmlBlock(
                          '<div class="policy-alert-box my-4 p-4 rounded-xl bg-amber-50 border-l-4 border-amber-500 text-amber-900 text-xs sm:text-sm shadow-2xs"><strong class="block font-bold text-amber-950 uppercase tracking-wider mb-1">Important Notice:</strong>All fresh floral arrangements are non-edible and intended strictly for ceremonial, prayer, and decorative purposes.</div><p><br></p>'
                        )
                      }
                      className="p-1.5 px-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Notice Box</span>
                    </button>

                    <button
                      type="button"
                      title="Insert Quote / Highlight"
                      onClick={() =>
                        insertHtmlBlock(
                          '<blockquote class="my-3 pl-4 border-l-4 border-[#0B3B24] italic text-stone-600 text-sm bg-[#F4F8F4] py-2 px-3 rounded-r-lg">Express morning cold-chain floral deliveries guaranteed fresh across the contiguous United States.</blockquote><p><br></p>'
                        )
                      }
                      className="p-1.5 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#0B3B24] border border-emerald-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Quote className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Quote</span>
                    </button>

                    <button
                      type="button"
                      title="Insert Table"
                      onClick={() =>
                        insertHtmlBlock(
                          '<div class="overflow-x-auto my-4 rounded-xl border border-stone-200"><table class="w-full text-left border-collapse text-sm"><thead class="bg-[#FAF6F0] border-b border-stone-200"><tr><th class="py-2.5 px-3.5 font-bold text-stone-900">Delivery Tier</th><th class="py-2.5 px-3.5 font-bold text-stone-900">Estimated Arrival</th><th class="py-2.5 px-3.5 font-bold text-stone-900">Pricing (USD)</th></tr></thead><tbody class="divide-y divide-stone-100"><tr><td class="py-2.5 px-3.5 text-stone-700">Priority Overnight</td><td class="py-2.5 px-3.5 text-stone-700">Next Morning by 10:30 AM</td><td class="py-2.5 px-3.5 text-stone-700">Free over $150</td></tr><tr><td class="py-2.5 px-3.5 text-stone-700">Standard Cold-Chain</td><td class="py-2.5 px-3.5 text-stone-700">1–2 Business Days</td><td class="py-2.5 px-3.5 text-stone-700">$29.00</td></tr></tbody></table></div><p><br></p>'
                        )
                      }
                      className="p-1.5 px-2 rounded-lg text-stone-700 hover:bg-stone-200/80 hover:text-stone-900 transition-colors flex items-center gap-1 text-xs"
                    >
                      <TableIcon className="w-3.5 h-3.5 text-stone-500" />
                      <span className="hidden sm:inline text-[11px]">Table</span>
                    </button>

                    <button
                      type="button"
                      title="Horizontal Divider"
                      onClick={() => insertHtmlBlock('<hr class="my-6 border-stone-200" /><p><br></p>')}
                      className="p-1.5 rounded-lg text-stone-700 hover:bg-stone-200/80 hover:text-stone-900 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>

                    <div className="h-5 w-px bg-stone-200 mx-0.5" />

                    {/* Clear Formatting, Undo, Redo */}
                    <button
                      type="button"
                      title="Clear Formatting"
                      onClick={() => execFormat('removeFormat')}
                      className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-200/80 hover:text-stone-800 transition-colors"
                    >
                      <RemoveFormatting className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      title="Undo"
                      onClick={() => execFormat('undo')}
                      className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-200/80 hover:text-stone-800 transition-colors"
                    >
                      <Undo2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      title="Redo"
                      onClick={() => execFormat('redo')}
                      className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-200/80 hover:text-stone-800 transition-colors"
                    >
                      <Redo2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* WYSIWYG ContentEditable Area */}
                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={handleEditorInput}
                    onBlur={handleEditorInput}
                    className="min-h-[460px] max-h-[750px] overflow-y-auto p-5 sm:p-6 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B3B24] focus:border-transparent text-stone-800 leading-relaxed font-sans text-sm sm:text-base space-y-3 shadow-inner
                      [&_h2]:text-xl [&_h2]:sm:text-2xl [&_h2]:font-bold [&_h2]:text-[#0B3B24] [&_h2]:tracking-tight [&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:pb-2 [&_h2]:border-b [&_h2]:border-stone-200
                      [&_h3]:text-base [&_h3]:sm:text-lg [&_h3]:font-semibold [&_h3]:text-stone-900 [&_h3]:mt-4 [&_h3]:mb-1
                      [&_p]:my-2 [&_p]:leading-relaxed
                      [&_ul]:my-2.5 [&_ul]:pl-6 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:marker:text-[#0B3B24]
                      [&_ol]:my-2.5 [&_ol]:pl-6 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:marker:text-[#0B3B24]
                      [&_li]:leading-relaxed
                      [&_strong]:font-semibold [&_strong]:text-stone-900
                      [&_em]:italic [&_em]:text-stone-800
                      [&_blockquote]:my-3 [&_blockquote]:pl-4 [&_blockquote]:border-l-4 [&_blockquote]:border-[#0B3B24] [&_blockquote]:italic [&_blockquote]:text-stone-600 [&_blockquote]:text-sm [&_blockquote]:bg-[#F4F8F4] [&_blockquote]:py-2 [&_blockquote]:px-3 [&_blockquote]:rounded-r-lg
                      [&_table]:w-full [&_table]:text-left [&_table]:border-collapse [&_table]:text-xs [&_table]:sm:text-sm [&_table]:my-4 [&_table]:border [&_table]:border-stone-200
                      [&_th]:py-2.5 [&_th]:px-3.5 [&_th]:font-bold [&_th]:text-stone-900 [&_th]:bg-[#FAF6F0] [&_th]:border [&_th]:border-stone-200
                      [&_td]:py-2.5 [&_td]:px-3.5 [&_td]:text-stone-700 [&_td]:border [&_td]:border-stone-200
                      [&_hr]:my-4 [&_hr]:border-stone-200"
                  />

                  {/* Visual Mode Helper Bar */}
                  <div className="flex flex-wrap items-center justify-between text-xs text-stone-500 pt-2 border-t border-stone-100 gap-2">
                    <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 text-[11px]">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-bold">Visual Easy Mode:</span>
                      <span className="text-emerald-700">
                        Type directly like in Word or Google Docs. No code or markdown needed.
                      </span>
                    </div>
                    <div className="text-stone-500 font-medium text-[11px]">
                      {htmlToPlainText(formData.content || '').length} characters &bull;{' '}
                      {
                        htmlToPlainText(formData.content || '')
                          .split(/\s+/)
                          .filter(Boolean).length
                      }{' '}
                      words
                    </div>
                  </div>
                </div>
              ) : activeMode === 'code' ? (
                /* Source Code Mode */
                <div className="space-y-3">
                  <div className="bg-stone-100 p-3 rounded-xl border border-stone-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Code className="w-4 h-4 text-stone-600" />
                      <span className="text-xs font-bold text-stone-700">HTML Source Code Mode</span>
                      <span className="text-[10px] text-stone-500 bg-white px-2 py-0.5 rounded border border-stone-200">
                        Advanced
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveMode('visual')}
                      className="px-3 py-1 rounded-lg bg-[#0B3B24] text-white text-xs font-bold hover:bg-[#134633] flex items-center gap-1.5 transition-colors"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Switch to Easy Visual Editor</span>
                    </button>
                  </div>

                  <textarea
                    rows={18}
                    value={formData.content || ''}
                    onChange={(e) => {
                      handleChange('content', e.target.value);
                      lastHtmlRef.current = e.target.value;
                    }}
                    placeholder="Enter HTML or text markup here..."
                    className="w-full font-mono text-xs sm:text-sm p-4 bg-stone-900 text-stone-100 border border-stone-700 rounded-xl leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#0B3B24] transition-all"
                  />

                  <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
                    <span>Clean HTML format saved directly to database.</span>
                    <span>
                      {(formData.content || '').length} raw characters &bull;{' '}
                      {htmlToPlainText(formData.content || '').split(/\s+/).filter(Boolean).length} words
                    </span>
                  </div>
                </div>
              ) : (
                /* Live Preview Mode */
                <div className="space-y-4">
                  <div className="bg-[#FAF6F0] p-4 rounded-xl border border-stone-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Live Storefront Preview
                      </span>
                      <p className="text-xs text-stone-600 mt-1">
                        Rendering with standard Plus Jakarta Sans typography exactly as your customers experience it.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveMode('visual')}
                      className="px-3.5 py-1.5 rounded-lg bg-[#0B3B24] text-white text-xs font-bold hover:bg-[#134633] flex items-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Back to Visual Editor</span>
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
