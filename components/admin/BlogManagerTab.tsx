'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  ExternalLink,
  Sparkles,
  Calendar,
  Clock,
  Check,
  X,
  RefreshCw,
  Tag,
  ArrowRight,
  TrendingUp,
  Share2,
  FileText,
  AlertCircle,
  Flower2,
} from 'lucide-react';
import { IBlogPostItem, BLOG_CATEGORIES, DEFAULT_BLOGS } from '@/lib/defaultBlogs';
import BlogEditorModal from './BlogEditorModal';

export default function BlogManagerTab() {
  const [blogs, setBlogs] = useState<IBlogPostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<IBlogPostItem | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch blogs from API
  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/blogs?all=true');
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.data)) {
        setBlogs(data.data);
      } else {
        setBlogs(DEFAULT_BLOGS);
      }
    } catch (err) {
      console.error('Failed to fetch blogs:', err);
      setBlogs(DEFAULT_BLOGS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  // Quick Toggle Published Status
  const handleTogglePublished = async (blog: IBlogPostItem) => {
    if (!blog._id) return;
    try {
      const nextStatus = !blog.isPublished;
      const res = await fetch(`/api/blogs/${blog._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: nextStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBlogs((prev) =>
          prev.map((b) => (b._id === blog._id ? { ...b, isPublished: nextStatus } : b))
        );
        showStatus('success', `Post ${nextStatus ? 'published' : 'moved to drafts'}`);
      }
    } catch (err) {
      showStatus('error', 'Failed to update publishing status');
    }
  };

  // Quick Toggle Featured / Hero Spotlight
  const handleToggleFeatured = async (blog: IBlogPostItem) => {
    if (!blog._id) return;
    try {
      const nextFeatured = !blog.featured;
      const res = await fetch(`/api/blogs/${blog._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: nextFeatured }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBlogs((prev) =>
          prev.map((b) => (b._id === blog._id ? { ...b, featured: nextFeatured } : b))
        );
        showStatus('success', nextFeatured ? 'Marked as Hero Spotlight' : 'Unmarked as Hero');
      }
    } catch (err) {
      showStatus('error', 'Failed to update featured flag');
    }
  };

  // Delete Blog
  const handleDeleteBlog = async (blog: IBlogPostItem) => {
    if (!blog._id) return;
    if (!confirm(`Are you sure you want to permanently delete "${blog.title}"?`)) {
      return;
    }

    try {
      setDeletingId(blog._id);
      const res = await fetch(`/api/blogs/${blog._id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBlogs((prev) => prev.filter((b) => b._id !== blog._id));
        showStatus('success', 'Article deleted successfully');
      } else {
        showStatus('error', data.message || 'Failed to delete article');
      }
    } catch (err: any) {
      showStatus('error', err.message || 'Failed to delete article');
    } finally {
      setDeletingId(null);
    }
  };

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleOpenCreateModal = () => {
    setEditingBlog(null);
    setIsEditorOpen(true);
  };

  const handleOpenEditModal = (blog: IBlogPostItem) => {
    setEditingBlog(blog);
    setIsEditorOpen(true);
  };

  const handleBlogSaved = () => {
    fetchBlogs();
    showStatus('success', editingBlog ? 'Article updated successfully!' : 'New article published!');
  };

  // Filtered Blogs
  const filteredBlogs = blogs.filter((blog) => {
    const matchesCategory =
      selectedCategory === 'ALL' ||
      blog.category.toLowerCase() === selectedCategory.toLowerCase();

    const matchesSearch =
      searchTerm.trim() === '' ||
      blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blog.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blog.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (blog.tags && blog.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase())));

    return matchesCategory && matchesSearch;
  });

  const totalViews = blogs.reduce((sum, b) => sum + (b.views || 0), 0);
  const publishedCount = blogs.filter((b) => b.isPublished).length;
  const draftCount = blogs.filter((b) => !b.isPublished).length;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#0B3B24] via-[#134633] to-[#1C563F] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-xs font-semibold tracking-wide">
              <Flower2 className="w-3.5 h-3.5 text-amber-300" />
              <span>Editorial & SEO Suite</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Blog Posts, Puja Guides & Floral Care
            </h1>
            <p className="text-sm text-stone-200/90 leading-relaxed">
              Create high-ranking articles, care guides, and ceremony advice for the US Indian diaspora. Complete with visual WYSIWYG editor, live Google SERP simulation, and image SEO.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/blog"
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20 cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>View Public Blog</span>
            </Link>
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-stone-50 text-[#0B3B24] text-xs font-extrabold transition-all shadow-lg hover:shadow-xl cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Write New Article</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10 text-xs">
          <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
            <span className="text-stone-300 block text-[11px]">Total Articles</span>
            <span className="text-xl font-black text-white">{blogs.length}</span>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
            <span className="text-emerald-300 block text-[11px]">Published Live</span>
            <span className="text-xl font-black text-white">{publishedCount}</span>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
            <span className="text-amber-300 block text-[11px]">Drafts / Staged</span>
            <span className="text-xl font-black text-white">{draftCount}</span>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
            <span className="text-rose-300 block text-[11px]">Total Article Views</span>
            <span className="text-xl font-black text-white">{totalViews.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-gray-400 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Action Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title, tags, or content..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0B3B24]/20"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none text-xs">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors shrink-0 cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-[#0B3B24] text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Categories
          </button>
          {BLOG_CATEGORIES.slice(0, 4).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-colors shrink-0 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#0B3B24] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
          <button
            onClick={fetchBlogs}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0 cursor-pointer"
            title="Refresh articles"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Blog Cards Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <RefreshCw className="w-8 h-8 text-[#0B3B24] animate-spin mx-auto mb-3" />
          <p className="text-xs text-gray-500 font-semibold">Loading blog guides and SEO index...</p>
        </div>
      ) : filteredBlogs.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-gray-200 p-8">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-gray-700 mb-1">No articles found</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto mb-4">
            Try adjusting your search query or category filter, or click below to publish your first floral guide.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B3B24] text-white text-xs font-bold hover:bg-[#1C563F] transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Article</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBlogs.map((blog) => (
            <div
              key={blog._id || blog.slug}
              className="bg-white rounded-3xl border border-gray-100 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col group"
            >
              {/* Thumbnail Header */}
              <div className="relative aspect-[16/9] w-full bg-stone-100 overflow-hidden">
                <img
                  src={blog.image || '/images/banners/hero-wedding-tif-rose.jpg'}
                  alt={blog.imageAlt || blog.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                  <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-[#0B3B24]/90 backdrop-blur-xs text-white uppercase tracking-wider shadow-xs">
                    {blog.category}
                  </span>
                  {blog.featured && (
                    <span className="text-[10px] font-extrabold px-2 py-1 rounded-full bg-[#C85A78] text-white shadow-xs flex items-center gap-1">
                      ★ Hero
                    </span>
                  )}
                </div>

                <div className="absolute top-3 right-3">
                  <button
                    onClick={() => handleTogglePublished(blog)}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs transition-colors cursor-pointer ${
                      blog.isPublished
                        ? 'bg-emerald-500 text-white'
                        : 'bg-amber-500 text-white'
                    }`}
                    title="Click to toggle publish status"
                  >
                    {blog.isPublished ? '● Published' : '○ Draft'}
                  </button>
                </div>

                <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-xs text-[10px] font-medium text-white flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  <span>{blog.views || 0} views</span>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[11px] text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {blog.readTime || '5 min read'}
                    </span>
                    <span>&bull;</span>
                    <span className="truncate">By {blog.author}</span>
                  </div>

                  <h3 className="text-sm font-bold text-gray-900 group-hover:text-[#0B3B24] transition-colors line-clamp-2 leading-snug">
                    {blog.title}
                  </h3>

                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                    {blog.excerpt}
                  </p>
                </div>

                {/* Tags & Action Footer */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleFeatured(blog)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        blog.featured
                          ? 'text-[#C85A78] bg-rose-50 hover:bg-rose-100'
                          : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                      }`}
                      title={blog.featured ? 'Unpin from Hero' : 'Pin to Hero Spotlight'}
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>
                    <Link
                      href={`/blog/${blog.slug}`}
                      target="_blank"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                      title="View live article"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditModal(blog)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteBlog(blog)}
                      disabled={deletingId === blog._id}
                      className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors disabled:opacity-40 cursor-pointer"
                      title="Delete article"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Blog Editor Modal */}
      <BlogEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSaved={handleBlogSaved}
        blogToEdit={editingBlog}
      />
    </div>
  );
}
