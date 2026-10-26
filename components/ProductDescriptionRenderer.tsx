'use client';

import React from 'react';
import { hasHtmlTags, sanitizeProductHtml } from '@/lib/htmlUtils';

interface Props {
  content?: string;
  className?: string;
  fallback?: string;
}

export default function ProductDescriptionRenderer({
  content,
  className = '',
  fallback = 'Authentic fresh flowers handcrafted for traditional Indian ceremonies across the United States.',
}: Props) {
  const raw = (content || '').trim();
  if (!raw) {
    return <p className={`text-stone-600 text-xs sm:text-sm ${className}`}>{fallback}</p>;
  }

  if (hasHtmlTags(raw)) {
    const safeHtml = sanitizeProductHtml(raw);
    return (
      <div
        className={`product-description-html text-xs sm:text-sm text-stone-600 leading-relaxed space-y-2.5 [&_h1]:text-base sm:[&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-stone-900 [&_h1]:mb-1.5 [&_h2]:text-sm sm:[&_h2]:text-base [&_h2]:font-bold [&_h2]:text-stone-900 [&_h2]:mt-4 [&_h2]:mb-1.5 [&_h3]:text-xs sm:[&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-stone-900 [&_p]:leading-relaxed [&_p]:text-stone-600 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_li]:text-xs sm:[&_li]:text-sm [&_li]:text-stone-600 [&_strong]:text-stone-900 [&_strong]:font-semibold [&_a]:text-[#0B3B24] [&_a]:underline [&_a]:font-medium hover:[&_a]:text-[#1C563F] ${className}`}
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />
    );
  }

  return (
    <p className={`whitespace-pre-line text-xs sm:text-sm text-stone-600 leading-relaxed ${className}`}>
      {raw}
    </p>
  );
}
