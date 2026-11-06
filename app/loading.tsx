import React from 'react';

export default function RootLoading() {
  return (
    <div
      aria-hidden="true"
      className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center bg-white"
    >
      <div className="relative w-12 h-12 flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-emerald-100 border-t-[#0B3B24] rounded-full animate-spin" />
        <span className="absolute text-base select-none">🌸</span>
      </div>
      <p className="mt-3 text-xs font-semibold text-stone-600 tracking-wide uppercase">
        Loading fresh flowers...
      </p>
    </div>
  );
}
