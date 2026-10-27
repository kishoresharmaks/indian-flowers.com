'use client';

import React from 'react';
import { Clock } from 'lucide-react';
import { hasHtmlTags, sanitizeProductHtml } from '@/lib/htmlUtils';

interface Props {
  content?: string;
  className?: string;
  fallback?: string;
  showNotice?: boolean;
}

export default function ProductDescriptionRenderer({
  content,
  className = '',
  fallback = 'Authentic fresh flowers handcrafted for traditional Indian ceremonies across the United States.',
  showNotice = true,
}: Props) {
  const raw = (content || '').trim();

  const renderNotice = () => {
    if (!showNotice) return null;
    return (
      <div className="mt-3.5 p-3.5 rounded-xl bg-amber-50/90 border border-amber-200/90 flex items-start gap-2.5 text-amber-950">
        <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <strong className="block text-[11px] uppercase tracking-wider text-amber-900 font-bold">
            1-Week Advance Delivery Notice
          </strong>
          <p className="text-[12px] text-amber-900/90 leading-relaxed font-normal">
            All fresh Indian floral garlands and loose blossoms are handcrafted to order and transported via priority cold-chain air cargo (FedEx / Southwest). A minimum 1-week preparation and dispatch timeframe is required for all orders across the United States.
          </p>
        </div>
      </div>
    );
  };

  if (!raw) {
    return (
      <div className={className}>
        <p className="text-stone-600 text-xs sm:text-sm">{fallback}</p>
        {renderNotice()}
      </div>
    );
  }

  if (hasHtmlTags(raw)) {
    const safeHtml = sanitizeProductHtml(raw);
    return (
      <div className={className}>
        <div
          className="product-description-html text-xs sm:text-sm text-stone-600 leading-relaxed space-y-2.5 [&_h1]:text-base sm:[&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-stone-900 [&_h1]:mb-1.5 [&_h2]:text-sm sm:[&_h2]:text-base [&_h2]:font-bold [&_h2]:text-stone-900 [&_h2]:mt-4 [&_h2]:mb-1.5 [&_h3]:text-xs sm:[&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-stone-900 [&_p]:leading-relaxed [&_p]:text-stone-600 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_li]:text-xs sm:[&_li]:text-sm [&_li]:text-stone-600 [&_strong]:text-stone-900 [&_strong]:font-semibold [&_a]:text-[#0B3B24] [&_a]:underline [&_a]:font-medium hover:[&_a]:text-[#1C563F]"
          dangerouslySetInnerHTML={{ __html: safeHtml }}
        />
        {renderNotice()}
      </div>
    );
  }

  return (
    <div className={className}>
      <p className="whitespace-pre-line text-xs sm:text-sm text-stone-600 leading-relaxed">
        {raw}
      </p>
      {renderNotice()}
    </div>
  );
}
