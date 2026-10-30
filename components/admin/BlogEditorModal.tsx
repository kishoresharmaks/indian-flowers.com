'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Save,
  Upload,
  Image as ImageIcon,
  Link as LinkIcon,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  RotateCcw,
  Eye,
  Code2,
  Sparkles,
  Search,
  Share2,
  Check,
  AlertCircle,
  HelpCircle,
  Globe,
  Tag,
  Clock,
  Layers,
  Lock,
  Unlock,
  Flower2,
} from 'lucide-react';
import {
  IBlogPostItem,
  BLOG_CATEGORIES,
  calculateReadTime,
  generateSlug,
} from '@/lib/defaultBlogs';
import { isHtmlContent, markdownToHtml, htmlToPlainText } from '@/lib/richTextFormatters';
import PolicyContentRenderer from '@/components/policies/PolicyContentRenderer';

interface BlogEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (blog: IBlogPostItem) => void;
  blogToEdit?: IBlogPostItem | null;
}

export default function BlogEditorModal({
  isOpen,
  onClose,
  onSaved,
  blogToEdit,
}: BlogEditorModalProps) {
  const [activeEditorMode, setActiveEditorMode] = useState<'visual' | 'code' | 'preview'>('visual');
  const [activeSideTab, setActiveSideTab] = useState<'media' | 'seo' | 'social'>('seo');
  const [isSlugLocked, setIsSlugLocked] = useState(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [keywordInput, setKeywordInput] = useState('');

  // Main Form Data State
  const [formData, setFormData] = useState<IBlogPostItem>({
    title: '',
    slug: '',
    excerpt: '',
    content: '<p>Start writing your floral guide or ceremony advice here...</p>',
    image: '/images/banners/hero-wedding-tif-rose.jpg',
    imageAlt: '',
    category: 'WEDDING GARLANDS',
    tags: ['Wedding Garlands', 'Jai Mala'],
    author: 'Indian Flowers Editorial Team',
    readTime: '5 min read',
    isPublished: true,
    featured: false,
    views: 0,
    publishedAt: new Date().toISOString(),
    seo: {
      metaTitle: '',
      metaDescription: '',
      keywords: [],
      canonicalUrl: '',
      ogImage: '',
      noIndex: false,
    },
  });

  const editorRef = useRef<HTMLDivElement>(null);
  const lastHtmlRef = useRef<string>('');

  // Initialize form when opening or editing
  useEffect(() => {
    if (blogToEdit) {
      const normalizedContent = isHtmlContent(blogToEdit.content)
        ? blogToEdit.content
        : markdownToHtml(blogToEdit.content);

      setFormData({
        ...blogToEdit,
        content: normalizedContent,
        tags: Array.isArray(blogToEdit.tags) ? blogToEdit.tags : [],
        seo: {
          metaTitle: blogToEdit.seo?.metaTitle || '',
          metaDescription: blogToEdit.seo?.metaDescription || '',
          keywords: Array.isArray(blogToEdit.seo?.keywords) ? blogToEdit.seo.keywords : [],
          canonicalUrl: blogToEdit.seo?.canonicalUrl || '',
          ogImage: blogToEdit.seo?.ogImage || '',
          noIndex: blogToEdit.seo?.noIndex === true,
        },
      });
      lastHtmlRef.current = normalizedContent;
      if (editorRef.current) {
        editorRef.current.innerHTML = normalizedContent;
      }
      setIsSlugLocked(true);
    } else {
      const initialContent = '<p>Welcome to our floral care guide. Write insightful ceremony advice, garland styling tips, and ritual meanings for the Indian community across the US.</p>';
      setFormData({
        title: '',
        slug: '',
        excerpt: '',
        content: initialContent,
        image: '/images/banners/hero-wedding-tif-rose.jpg',
        imageAlt: '',
        category: 'WEDDING GARLANDS',
        tags: ['Wedding Garlands', 'Jai Mala', 'Vedic Muhurtham'],
        author: 'Indian Flowers Editorial Team',
        readTime: '4 min read',
        isPublished: true,
        featured: false,
        views: 0,
        publishedAt: new Date().toISOString(),
        seo: {
          metaTitle: '',
          metaDescription: '',
          keywords: ['wedding garlands', 'indian flowers usa'],
          canonicalUrl: '',
          ogImage: '/images/banners/hero-wedding-tif-rose.jpg',
          noIndex: false,
        },
      });
      lastHtmlRef.current = initialContent;
      if (editorRef.current) {
        editorRef.current.innerHTML = initialContent;
      }
      setIsSlugLocked(false);
    }
    setErrorMessage('');
    setUploadError('');
  }, [blogToEdit, isOpen]);

  // Keep editorRef innerHTML in sync when toggling modes
  useEffect(() => {
    if (activeEditorMode === 'visual' && editorRef.current) {
      if (editorRef.current.innerHTML !== formData.content && lastHtmlRef.current !== formData.content) {
        editorRef.current.innerHTML = formData.content || '';
        lastHtmlRef.current = formData.content || '';
      }
    }
  }, [activeEditorMode, formData.content]);

  if (!isOpen) return null;

  // Handle title change & auto-generate slug & meta title
  const handleTitleChange = (val: string) => {
    const updated: any = { ...formData, title: val };
    if (!isSlugLocked || !formData.slug) {
      updated.slug = generateSlug(val);
    }
    if (!formData.seo?.metaTitle || formData.seo.metaTitle === formData.title) {
      updated.seo = {
        ...formData.seo,
        metaTitle: val ? `${val} | Indian Flowers US` : '',
      };
    }
    setFormData(updated);
  };

  // Handle visual editor input
  const handleEditorInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      lastHtmlRef.current = html;
      const readTime = calculateReadTime(html);
      setFormData((prev) => ({
        ...prev,
        content: html,
        readTime,
      }));
    }
  };

  // Rich Text Formatting commands
  const executeFormat = (command: string, value: string | undefined = undefined) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand(command, false, value);
      handleEditorInput();
    }
  };

  const handleInsertHeading = (tag: 'h2' | 'h3' | 'p') => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand('formatBlock', false, tag);
      handleEditorInput();
    }
  };

  const handleInsertLink = () => {
    const url = prompt('Enter destination link URL (e.g., https://... or /shop):');
    if (url) {
      executeFormat('createLink', url);
    }
  };

  const handleInsertImageInEditor = () => {
    const url = prompt('Enter image URL to insert into article:');
    if (url) {
      executeFormat('insertImage', url);
    }
  };

  // Handle Featured Image Upload via /api/upload
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);
      setUploadError('');

      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('folder', 'blogs');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setFormData((prev) => ({
          ...prev,
          image: data.url,
          seo: {
            ...prev.seo,
            ogImage: prev.seo?.ogImage || data.url,
          },
        }));
      } else {
        setUploadError(data.error || 'Failed to upload image');
      }
    } catch (err: any) {
      setUploadError(err.message || 'Image upload error');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Tag helper
  const handleAddTag = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const val = tagInput.trim().replace(/^,+|,+$/g, '');
      if (val && !formData.tags.includes(val)) {
        setFormData((prev) => ({
          ...prev,
          tags: [...prev.tags, val],
        }));
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index),
    }));
  };

  // Keyword helper
  const handleAddKeyword = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ',') && keywordInput.trim()) {
      e.preventDefault();
      const val = keywordInput.trim().replace(/^,+|,+$/g, '');
      const currentKeywords = formData.seo?.keywords || [];
      if (val && !currentKeywords.includes(val)) {
        setFormData((prev) => ({
          ...prev,
          seo: {
            ...prev.seo,
            keywords: [...currentKeywords, val],
          },
        }));
      }
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (index: number) => {
    const currentKeywords = formData.seo?.keywords || [];
    setFormData((prev) => ({
      ...prev,
      seo: {
        ...prev.seo,
        keywords: currentKeywords.filter((_, i) => i !== index),
      },
    }));
  };

  // Submit Handler (Create or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setErrorMessage('Please provide an article title.');
      return;
    }
    if (!formData.content.trim()) {
      setErrorMessage('Please provide content for the article.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');

      const isEditing = Boolean(blogToEdit?._id);
      const url = isEditing ? `/api/blogs/${blogToEdit?._id}` : '/api/blogs';
      const method = isEditing ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        excerpt: formData.excerpt || htmlToPlainText(formData.content).slice(0, 160) + '...',
        readTime: formData.readTime || calculateReadTime(formData.content),
        seo: {
          ...formData.seo,
          metaTitle: formData.seo?.metaTitle || formData.title,
          metaDescription: formData.seo?.metaDescription || formData.excerpt,
          ogImage: formData.seo?.ogImage || formData.image,
        },
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (res.ok && resData.success) {
        onSaved(resData.data);
        onClose();
      } else {
        setErrorMessage(resData.message || 'Failed to save blog post.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Server error occurred while saving.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // SEO Metrics
  const metaTitleLength = (formData.seo?.metaTitle || '').length;
  const metaDescLength = (formData.seo?.metaDescription || '').length;
  const plainTextLength = htmlToPlainText(formData.content || '').length;
  const wordCount = htmlToPlainText(formData.content || '').split(/\s+/).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-6xl max-h-[95vh] shadow-2xl border border-gray-100 flex flex-col overflow-hidden my-auto">
        {/* Top Sticky Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-stone-50/80 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0B3B24] text-white flex items-center justify-center font-bold shadow-md shadow-[#0B3B24]/10">
              <Flower2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900 tracking-tight">
                  {blogToEdit ? 'Edit Blog Article' : 'Write New Floral Guide'}
                </h2>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    formData.isPublished
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                >
                  {formData.isPublished ? '● Published' : '○ Draft'}
                </span>
                {formData.featured && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                    ★ Hero Spotlight
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                Craft SEO-optimized floral traditions, wedding guidance, and care articles for US diaspora
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B3B24] hover:bg-[#1C563F] text-white text-xs font-bold transition-all shadow-md shadow-[#0B3B24]/20 disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Saving Article...' : blogToEdit ? 'Save Changes' : 'Publish Article'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modal Body: Two Column Responsive Workspace */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: Main Editorial & Content (7 columns) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Title & Slug */}
            <div className="space-y-3 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Article Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g., The Ultimate Guide to Fresh Indian Wedding Garlands (Jai Mala)"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0B3B24]/20 focus:border-[#0B3B24] text-sm font-semibold text-gray-900"
                />
              </div>

              {/* Slug & Permalinks */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs">
                <span className="font-semibold text-gray-500 shrink-0 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-gray-400" /> Permalink:
                </span>
                <div className="flex items-center gap-1.5 flex-1 bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-200/80 font-mono text-[11px] text-stone-600">
                  <span className="text-stone-400 select-none">/blog/</span>
                  <input
                    type="text"
                    disabled={isSlugLocked}
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: generateSlug(e.target.value) })
                    }
                    className="bg-transparent border-none focus:outline-none flex-1 text-stone-800 disabled:opacity-80 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setIsSlugLocked(!isSlugLocked)}
                    className="text-stone-400 hover:text-stone-700 cursor-pointer p-0.5"
                    title={isSlugLocked ? 'Unlock to customize slug' : 'Lock slug'}
                  >
                    {isSlugLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3 text-amber-600" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Category & Meta Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0B3B24]/20"
                >
                  {BLOG_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Author Name</label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  placeholder="Indian Flowers Team"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#0B3B24]/20"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Estimated Read Time</label>
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-stone-50 font-medium text-gray-700">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span>{formData.readTime || calculateReadTime(formData.content)}</span>
                </div>
              </div>
            </div>

            {/* Excerpt / Summary */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-gray-700">
                  Article Excerpt / Card Description
                </label>
                <span className="text-gray-400 text-[11px]">
                  {(formData.excerpt || '').length} / 200 chars
                </span>
              </div>
              <textarea
                rows={2}
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                placeholder="A compelling 2-sentence summary that appears on the blog index cards and as the fallback meta description for search engines."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0B3B24]/20"
              />
            </div>

            {/* WYSIWYG Content Editor */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden flex flex-col">
              {/* Editor Mode Tabs & Stats Bar */}
              <div className="px-4 py-2.5 bg-stone-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setActiveEditorMode('visual')}
                    className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                      activeEditorMode === 'visual'
                        ? 'bg-[#0B3B24] text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Visual Editor
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveEditorMode('code')}
                    className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                      activeEditorMode === 'code'
                        ? 'bg-[#0B3B24] text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Code2 className="w-3.5 h-3.5 inline mr-1" />
                    HTML Code
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveEditorMode('preview')}
                    className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                      activeEditorMode === 'preview'
                        ? 'bg-[#0B3B24] text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5 inline mr-1" />
                    Live Storefront Preview
                  </button>
                </div>

                <div className="text-[11px] text-gray-500 font-medium flex items-center gap-3">
                  <span>{wordCount} words</span>
                  <span>&bull;</span>
                  <span>{plainTextLength} characters</span>
                </div>
              </div>

              {/* Visual Formatting Toolbar */}
              {activeEditorMode === 'visual' && (
                <div className="px-4 py-2 bg-stone-50/50 border-b border-gray-200 flex flex-wrap items-center gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => handleInsertHeading('h2')}
                    className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-700 font-bold transition-colors cursor-pointer"
                    title="Section Heading (H2)"
                  >
                    <Heading2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertHeading('h3')}
                    className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-700 font-semibold transition-colors cursor-pointer"
                    title="Subsection Heading (H3)"
                  >
                    <Heading3 className="w-4 h-4" />
                  </button>

                  <div className="w-[1px] h-4 bg-gray-300 mx-1" />

                  <button
                    type="button"
                    onClick={() => executeFormat('bold')}
                    className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
                    title="Bold (Ctrl+B)"
                  >
                    <Bold className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => executeFormat('italic')}
                    className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
                    title="Italic (Ctrl+I)"
                  >
                    <Italic className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => executeFormat('underline')}
                    className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
                    title="Underline (Ctrl+U)"
                  >
                    <Underline className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => executeFormat('strikeThrough')}
                    className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
                    title="Strikethrough"
                  >
                    <Strikethrough className="w-4 h-4" />
                  </button>

                  <div className="w-[1px] h-4 bg-gray-300 mx-1" />

                  <button
                    type="button"
                    onClick={() => executeFormat('insertUnorderedList')}
                    className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
                    title="Bullet List"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => executeFormat('insertOrderedList')}
                    className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
                    title="Numbered List"
                  >
                    <ListOrdered className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertHeading('p')}
                    className="px-2 py-1 rounded-lg hover:bg-gray-200 text-gray-700 text-[11px] font-bold transition-colors cursor-pointer"
                    title="Normal Paragraph"
                  >
                    Paragraph
                  </button>

                  <div className="w-[1px] h-4 bg-gray-300 mx-1" />

                  <button
                    type="button"
                    onClick={handleInsertLink}
                    className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
                    title="Insert Link"
                  >
                    <LinkIcon className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleInsertImageInEditor}
                    className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
                    title="Insert Image URL"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => executeFormat('insertHorizontalRule')}
                    className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
                    title="Horizontal Divider"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => executeFormat('removeFormat')}
                    className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
                    title="Clear Formatting"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Visual Mode contentEditable Area */}
              {activeEditorMode === 'visual' && (
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={handleEditorInput}
                  onBlur={handleEditorInput}
                  className="p-6 min-h-[360px] max-h-[500px] overflow-y-auto focus:outline-none text-stone-800 leading-relaxed font-sans
                    [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[#0B3B24] [&_h2]:mt-6 [&_h2]:mb-2.5 [&_h2]:pb-1.5 [&_h2]:border-b [&_h2]:border-stone-100
                    [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-stone-900 [&_h3]:mt-4 [&_h3]:mb-1.5
                    [&_p]:my-2 [&_p]:leading-relaxed
                    [&_ul]:my-2.5 [&_ul]:pl-5 [&_ul]:list-disc [&_ul]:space-y-1
                    [&_ol]:my-2.5 [&_ol]:pl-5 [&_ol]:list-decimal [&_ol]:space-y-1
                    [&_li]:leading-relaxed
                    [&_blockquote]:my-3 [&_blockquote]:pl-4 [&_blockquote]:border-l-4 [&_blockquote]:border-[#0B3B24] [&_blockquote]:italic [&_blockquote]:bg-stone-50 [&_blockquote]:py-2 [&_blockquote]:rounded-r-lg
                    [&_a]:text-[#0B3B24] [&_a]:underline [&_a]:font-semibold
                    [&_img]:rounded-xl [&_img]:my-3 [&_img]:max-w-full"
                />
              )}

              {/* Code Mode Raw HTML Area */}
              {activeEditorMode === 'code' && (
                <textarea
                  rows={16}
                  value={formData.content}
                  onChange={(e) => {
                    const html = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      content: html,
                      readTime: calculateReadTime(html),
                    }));
                  }}
                  className="p-4 w-full min-h-[360px] font-mono text-xs text-stone-800 bg-stone-900/5 focus:outline-none leading-relaxed border-none resize-none"
                />
              )}

              {/* Preview Mode */}
              {activeEditorMode === 'preview' && (
                <div className="p-6 min-h-[360px] max-h-[500px] overflow-y-auto bg-[#FAF6F0]/40">
                  <div className="max-w-2xl mx-auto bg-white p-6 rounded-2xl shadow-sm border border-stone-100 space-y-4">
                    <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-[#0B3B24]/10 text-[#0B3B24]">
                      {formData.category}
                    </span>
                    <h1 className="text-2xl font-bold text-[#0B3B24] tracking-tight">
                      {formData.title || 'Untitled Floral Guide'}
                    </h1>
                    <div className="text-xs text-stone-500 flex items-center gap-3 border-b border-stone-100 pb-3">
                      <span>By {formData.author}</span>
                      <span>&bull;</span>
                      <span>{formData.readTime}</span>
                    </div>
                    {formData.image && (
                      <div className="aspect-video w-full rounded-xl overflow-hidden bg-stone-100">
                        <img
                          src={formData.image}
                          alt={formData.imageAlt || formData.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <PolicyContentRenderer content={formData.content} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Media & Comprehensive SEO Suite (5 columns) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Tab switch for Sidebar: Media / SEO / Social */}
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-2xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveSideTab('seo')}
                className={`flex-1 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeSideTab === 'seo'
                    ? 'bg-white text-[#0B3B24] shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>SEO & Google</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSideTab('media')}
                className={`flex-1 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeSideTab === 'media'
                    ? 'bg-white text-[#0B3B24] shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Featured Image</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSideTab('social')}
                className={`flex-1 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeSideTab === 'social'
                    ? 'bg-white text-[#0B3B24] shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Social Share</span>
              </button>
            </div>

            {/* TAB 1: ADVANCED SEO & GOOGLE SERP SIMULATOR */}
            {activeSideTab === 'seo' && (
              <div className="space-y-4">
                {/* Google Search SERP Simulator Card */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5 text-blue-600" />
                      Google Search Result Simulator
                    </span>
                    <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                      Live Preview
                    </span>
                  </div>

                  <div className="p-3.5 bg-stone-50/60 rounded-xl border border-stone-200/60 space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] text-stone-500 truncate">
                      <div className="w-4 h-4 rounded-full bg-[#0B3B24] text-[9px] text-white flex items-center justify-center font-bold">
                        IF
                      </div>
                      <span className="text-stone-800 font-medium">Indian-Flowers.com</span>
                      <span className="text-stone-400">&rsaquo;</span>
                      <span className="text-stone-500">blog</span>
                      <span className="text-stone-400">&rsaquo;</span>
                      <span className="text-stone-500 truncate">{formData.slug || 'slug'}</span>
                    </div>

                    <h4 className="text-sm font-semibold text-[#1a0dab] hover:underline cursor-pointer leading-snug line-clamp-1">
                      {formData.seo?.metaTitle || formData.title || 'Article Title — Indian Flowers'}
                    </h4>

                    <p className="text-xs text-[#4d5156] leading-relaxed line-clamp-2">
                      {formData.seo?.metaDescription ||
                        formData.excerpt ||
                        'Cultural insights, flower care tips, wedding garland inspiration, and puja floral guides for the Indian diaspora across the United States.'}
                    </p>
                  </div>
                </div>

                {/* Meta Title Field with Length Gauge */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-gray-700">SEO Meta Title</label>
                    <span
                      className={`text-[11px] font-bold ${
                        metaTitleLength >= 45 && metaTitleLength <= 65
                          ? 'text-emerald-600'
                          : metaTitleLength > 65
                          ? 'text-rose-500'
                          : 'text-amber-500'
                      }`}
                    >
                      {metaTitleLength} / 60 chars{' '}
                      {metaTitleLength >= 45 && metaTitleLength <= 65 && '✓ Optimal'}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={formData.seo?.metaTitle || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        seo: { ...formData.seo, metaTitle: e.target.value },
                      })
                    }
                    placeholder="e.g., Fresh Indian Wedding Garlands Guide | Indian Flowers"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0B3B24]/20"
                  />
                  <p className="text-[11px] text-gray-400 leading-normal">
                    Recommended length: 50–60 characters. Appears as the clickable headline on Google search engine results.
                  </p>
                </div>

                {/* Meta Description Field with Length Gauge */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-gray-700">SEO Meta Description</label>
                    <span
                      className={`text-[11px] font-bold ${
                        metaDescLength >= 140 && metaDescLength <= 165
                          ? 'text-emerald-600'
                          : metaDescLength > 165
                          ? 'text-rose-500'
                          : 'text-amber-500'
                      }`}
                    >
                      {metaDescLength} / 160 chars{' '}
                      {metaDescLength >= 140 && metaDescLength <= 165 && '✓ Optimal'}
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={formData.seo?.metaDescription || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        seo: { ...formData.seo, metaDescription: e.target.value },
                      })
                    }
                    placeholder="Concise summary shown under your title on Google. Keep between 140 and 160 characters for best click-through rate."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0B3B24]/20"
                  />
                </div>

                {/* Focus Keywords / Search Intent */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-2">
                  <label className="block text-xs font-bold text-gray-700">
                    Focus Keywords (Target Search Queries)
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl border border-gray-200 bg-stone-50/50 min-h-[44px]">
                    {(formData.seo?.keywords || []).map((kw, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0B3B24]/10 text-[#0B3B24] text-[11px] font-semibold"
                      >
                        {kw}
                        <button
                          type="button"
                          onClick={() => handleRemoveKeyword(i)}
                          className="hover:text-rose-600 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyDown={handleAddKeyword}
                      placeholder="Add keyword + Enter..."
                      className="bg-transparent border-none text-xs focus:outline-none text-gray-800 px-1 py-0.5 flex-1 min-w-[120px]"
                    />
                  </div>
                </div>

                {/* Indexing & Canonical Controls */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Custom Canonical URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={formData.seo?.canonicalUrl || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          seo: { ...formData.seo, canonicalUrl: e.target.value },
                        })
                      }
                      placeholder="Leave blank to use default self-canonical"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-gray-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#0B3B24]/20"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div>
                      <span className="font-bold text-gray-800 block">Search Engine Robots</span>
                      <span className="text-[11px] text-gray-500">
                        {formData.seo?.noIndex ? 'Prevent indexing (noindex)' : 'Allow Google indexing (index, follow)'}
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!formData.seo?.noIndex}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            seo: { ...formData.seo, noIndex: !e.target.checked },
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0B3B24]"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: FEATURED IMAGE & ALT TEXT */}
            {activeSideTab === 'media' && (
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-gray-700">Featured Image Preview</label>
                    <span className="text-gray-400 text-[11px]">Recommended 1200 &times; 630px</span>
                  </div>

                  {formData.image ? (
                    <div className="relative aspect-video rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 group">
                      <img
                        src={formData.image}
                        alt={formData.imageAlt || formData.title}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, image: '' })}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-rose-600 transition-colors cursor-pointer"
                        title="Remove image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="aspect-video rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-6 text-gray-400 bg-stone-50/50">
                      <ImageIcon className="w-8 h-8 mb-2 text-gray-300" />
                      <p className="text-xs font-semibold">No image selected</p>
                    </div>
                  )}

                  {uploadError && (
                    <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-100">
                      {uploadError}
                    </p>
                  )}

                  {/* Upload Button */}
                  <div className="flex items-center gap-2">
                    <label className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-colors cursor-pointer">
                      <Upload className="w-4 h-4" />
                      <span>{isUploadingImage ? 'Uploading...' : 'Upload Image from Computer'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        disabled={isUploadingImage}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Or Direct Image URL */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                      Or Image URL Path
                    </label>
                    <input
                      type="text"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      placeholder="/images/banners/... or https://..."
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0B3B24]/20"
                    />
                  </div>

                  {/* Image Alt Text for Accessibility & Google Image Search */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Image Alt Text (SEO Crucial)
                    </label>
                    <input
                      type="text"
                      value={formData.imageAlt || ''}
                      onChange={(e) => setFormData({ ...formData, imageAlt: e.target.value })}
                      placeholder="Descriptive text for visually impaired users & Google Images"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0B3B24]/20"
                    />
                  </div>
                </div>

                {/* Article Tags */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-2">
                  <label className="block text-xs font-bold text-gray-700">
                    Article Tags (Pooja, Weddings, Care)
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl border border-gray-200 bg-stone-50/50 min-h-[44px]">
                    {formData.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-200/80 text-gray-800 text-[11px] font-semibold"
                      >
                        <Tag className="w-3 h-3 text-gray-500" />
                        {t}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(idx)}
                          className="hover:text-rose-600 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      placeholder="Add tag + Enter..."
                      className="bg-transparent border-none text-xs focus:outline-none text-gray-800 px-1 py-0.5 flex-1 min-w-[100px]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: SOCIAL SHARE / OPEN GRAPH PREVIEW */}
            {activeSideTab === 'social' && (
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                      Social Media Share Card Preview
                    </span>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
                      WhatsApp / Facebook / iMessage
                    </span>
                  </div>

                  <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white">
                    <div className="aspect-[1.91/1] w-full bg-stone-100 relative">
                      <img
                        src={formData.seo?.ogImage || formData.image || '/images/banners/hero-wedding-tif-rose.jpg'}
                        alt={formData.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-3.5 bg-stone-50 border-t border-gray-100 space-y-1">
                      <span className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">
                        INDIAN-FLOWERS.COM
                      </span>
                      <h4 className="text-xs font-bold text-gray-900 line-clamp-1">
                        {formData.seo?.metaTitle || formData.title || 'Floral Guide Title'}
                      </h4>
                      <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                        {formData.seo?.metaDescription ||
                          formData.excerpt ||
                          'Cultural insights, flower care tips, wedding garland inspiration, and puja floral guides for the Indian diaspora across the United States.'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Custom Social Share Image URL (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.seo?.ogImage || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          seo: { ...formData.seo, ogImage: e.target.value },
                        })
                      }
                      placeholder="Leave blank to use Featured Image"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0B3B24]/20"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Publishing Settings Box */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3 text-xs">
              <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Publishing Status & Visibility
              </h4>

              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div>
                  <span className="font-bold text-gray-800 block">Storefront Visibility</span>
                  <span className="text-[11px] text-gray-500">
                    {formData.isPublished ? 'Publicly visible to all visitors' : 'Draft only (hidden from public)'}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0B3B24]"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <span className="font-bold text-gray-800 block">Hero Spotlight / Pin</span>
                  <span className="text-[11px] text-gray-500">
                    Feature in the top hero banner of the blog
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C85A78]"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
