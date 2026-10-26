'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  DownloadCloud,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Database,
  Globe,
  FileCheck,
  Play,
  Square,
  Sparkles,
  Layers,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: () => void;
}

interface Stats {
  remote: {
    totalProducts: number;
    totalPagesAt100: number;
  };
  local: {
    totalProducts: number;
    importedWpProducts: number;
    totalCategories: number;
  };
}

export default function WordPressImportModal({
  isOpen,
  onClose,
  onImportComplete,
}: Props) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [downloadImages, setDownloadImages] = useState(true);

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(20);
  const [totalProcessed, setTotalProcessed] = useState(0);
  const [createdCount, setCreatedCount] = useState(0);
  const [updatedCount, setUpdatedCount] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  const stopSignalRef = useRef(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev.slice(-150), `[${time}] ${msg}`]);
  };

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Load Status
  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const res = await fetch('/api/admin/import-woocommerce');
      const data = await res.json();
      if (data.success) {
        setStats(data);
        if (data.remote?.totalPagesAt100) {
          setTotalPages(data.remote.totalPagesAt100);
        }
      }
    } catch (err: any) {
      addLog(`Failed to fetch status: ${err.message}`);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStats();
      stopSignalRef.current = false;
    }
  }, [isOpen]);

  const handleStartImport = async () => {
    setIsImporting(true);
    setIsPaused(false);
    stopSignalRef.current = false;
    addLog(`🚀 Starting migration from WooCommerce (${stats?.remote.totalProducts || 1946} items)...`);

    const perPage = 100;
    const maxPages = totalPages || 20;
    let localCreated = createdCount;
    let localUpdated = updatedCount;
    let localProcessed = totalProcessed;

    for (let page = currentPage > 0 ? currentPage + 1 : 1; page <= maxPages; page++) {
      if (stopSignalRef.current) {
        addLog(`⏸️ Migration paused by admin at page ${page - 1}.`);
        setIsPaused(true);
        setIsImporting(false);
        return;
      }

      setCurrentPage(page);
      addLog(`⏳ Fetching & processing Page ${page} of ${maxPages}...`);

      try {
        const res = await fetch('/api/admin/import-woocommerce', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            page,
            perPage,
            downloadImages,
          }),
        });

        const data = await res.json();

        if (data.success) {
          localCreated += data.createdCount || 0;
          localUpdated += data.updatedCount || 0;
          localProcessed += data.batchCount || 0;

          setCreatedCount(localCreated);
          setUpdatedCount(localUpdated);
          setTotalProcessed(localProcessed);

          addLog(
            `✅ Page ${page} complete: +${data.createdCount} new, ${data.updatedCount} updated. (Total processed: ${localProcessed})`
          );

          if (data.importedSlugsSample && data.importedSlugsSample.length > 0) {
            addLog(`   Slugs: ${data.importedSlugsSample.join(', ')}`);
          }
        } else {
          addLog(`⚠️ Page ${page} warning: ${data.error || 'Failed'}`);
        }
      } catch (err: any) {
        addLog(`❌ Error on Page ${page}: ${err.message}`);
      }

      // Small throttle to be courteous to the origin server
      await new Promise((r) => setTimeout(r, 600));
    }

    setIsImporting(false);
    addLog(`🎉 Migration completed! Processed ${localProcessed} products (+${localCreated} created, ${localUpdated} updated).`);
    fetchStats();
    if (onImportComplete) onImportComplete();
  };

  const handleStop = () => {
    stopSignalRef.current = true;
    addLog(`Stopping after current batch completes...`);
  };

  const progressPercent =
    totalPages > 0 ? Math.min(100, Math.round((currentPage / totalPages) * 100)) : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-3xl w-full border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0B3B24] via-[#134633] to-[#1C563F] text-white p-6 sm:p-7 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <DownloadCloud className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                WordPress / WooCommerce Product Migration
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100/80">
                100% SEO slug parity, USD pricing, and Pure Path image storage (No Base64).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isImporting}
            className="p-2 rounded-xl text-emerald-100 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-7 flex-1 overflow-y-auto space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
              <div className="flex items-center justify-between text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
                <span>Remote WooCommerce</span>
                <Globe className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-stone-900">
                {stats?.remote.totalProducts || (loadingStats ? '...' : '1,946')}
              </div>
              <p className="text-xs text-stone-500 mt-1">
                Indexed in Yoast sitemap
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
              <div className="flex items-center justify-between text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
                <span>Current Next.js DB</span>
                <Database className="w-4 h-4 text-[#0B3B24]" />
              </div>
              <div className="text-2xl font-bold text-[#0B3B24]">
                {stats?.local.totalProducts ?? (loadingStats ? '...' : 0)}
              </div>
              <p className="text-xs text-stone-500 mt-1">
                {stats?.local.importedWpProducts || 0} imported from WP
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
              <div className="flex items-center justify-between text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
                <span>Product Categories</span>
                <Layers className="w-4 h-4 text-[#C85A78]" />
              </div>
              <div className="text-2xl font-bold text-stone-900">
                {stats?.local.totalCategories ?? 0}
              </div>
              <p className="text-xs text-stone-500 mt-1">
                Auto-seeded category pages
              </p>
            </div>
          </div>

          {/* Configuration */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <FileCheck className="w-5 h-5 text-[#0B3B24] shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-stone-900">
                  Mirror Images Locally to /wp-content/uploads/
                </h4>
                <p className="text-xs text-stone-500">
                  Downloads original webp/jpg assets so existing Google Image URLs never break. No Base64 in DB.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={downloadImages}
                onChange={(e) => setDownloadImages(e.target.checked)}
                disabled={isImporting}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0B3B24]"></div>
            </label>
          </div>

          {/* Progress Bar */}
          {currentPage > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold text-stone-700">
                <span>
                  Page {currentPage} of {totalPages} ({progressPercent}%)
                </span>
                <span>
                  +{createdCount} created, {updatedCount} updated
                </span>
              </div>
              <div className="w-full h-3 bg-stone-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#0B3B24] to-emerald-500 transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Live Activity Logs */}
          <div className="rounded-2xl bg-stone-900 text-stone-100 p-4 font-mono text-xs h-48 overflow-y-auto border border-stone-800 shadow-inner">
            {logs.length === 0 ? (
              <div className="text-stone-500 italic py-2">
                Click "Start 1,946 Product Migration" below to begin syncing products from WooCommerce.
              </div>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} className="leading-relaxed whitespace-pre-wrap">
                  {log}
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-stone-500">
            {isImporting ? (
              <span className="flex items-center gap-1.5 text-emerald-700 font-semibold animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Sync in progress. Please keep this browser window open.
              </span>
            ) : (
              <span>Safe to re-run anytime. Uses upsert by wpId / slug.</span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {isImporting ? (
              <button
                onClick={handleStop}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 text-sm font-semibold transition-all flex items-center justify-center gap-2"
              >
                <Square className="w-4 h-4" />
                Pause Migration
              </button>
            ) : (
              <button
                onClick={handleStartImport}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#0B3B24] hover:bg-[#1C563F] text-white text-sm font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-white" />
                {currentPage > 0 && currentPage < totalPages
                  ? 'Resume Migration'
                  : 'Start 1,946 Product Migration'}
              </button>
            )}

            <button
              onClick={onClose}
              disabled={isImporting}
              className="px-5 py-2.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 text-sm font-semibold transition-all disabled:opacity-40"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
