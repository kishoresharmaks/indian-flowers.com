'use client';

import React from 'react';
import { Printer } from 'lucide-react';

export default function PrintPolicyButton() {
  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== 'undefined') window.print();
      }}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-stone-600 hover:text-[#0B3B24] hover:bg-stone-50 border border-stone-200 transition-colors"
      title="Print or Save as PDF"
    >
      <Printer className="w-3.5 h-3.5 text-stone-500" />
      <span>Print Document</span>
    </button>
  );
}
