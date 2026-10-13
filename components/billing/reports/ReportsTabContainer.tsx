'use client';

import React, { useState } from 'react';
import PnLReportView from './PnLReportView';

export default function ReportsTabContainer() {
  const [activeReport, setActiveReport] = useState<'PNL' | 'SALES' | 'PURCHASE' | 'GST'>('PNL');

  return (
    <div className="space-y-6">
      {/* Report Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E8EDF2] pb-2 overflow-x-auto scrollbar-none">
        {[
          { id: 'PNL', label: '📊 Profit & Loss (P&L) Statement' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveReport(tab.id as any)}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
              activeReport === tab.id
                ? 'bg-[#163B5C] text-white shadow-xs'
                : 'bg-white border border-[#E8EDF2] text-[#64748B] hover:text-[#163B5C]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Report View */}
      {activeReport === 'PNL' && <PnLReportView />}
    </div>
  );
}
