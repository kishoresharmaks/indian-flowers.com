'use client';

import React from 'react';

interface LotusLoaderProps {
  label?: string;
  fullScreen?: boolean;
}

export default function LotusLoader({
  label = 'Loading',
  fullScreen = true,
}: LotusLoaderProps) {
  return (
    <div
      className={`lotus-loader ${fullScreen ? '' : '!relative !min-h-[340px] !w-full !z-10'}`}
      role="status"
      aria-label={label}
    >
      <div className="lotus-orbit">
        <span className="orbit-dot dot-1" />
        <span className="orbit-dot dot-2" />
        <span className="orbit-dot dot-3" />
        <span className="orbit-dot dot-4" />
      </div>

      <div className="lotus-flower">
        <span className="lotus-petal" style={{ ['--i' as any]: 0 }} />
        <span className="lotus-petal" style={{ ['--i' as any]: 1 }} />
        <span className="lotus-petal" style={{ ['--i' as any]: 2 }} />
        <span className="lotus-petal" style={{ ['--i' as any]: 3 }} />
        <span className="lotus-petal" style={{ ['--i' as any]: 4 }} />
        <span className="lotus-petal" style={{ ['--i' as any]: 5 }} />
        <span className="lotus-petal" style={{ ['--i' as any]: 6 }} />
        <span className="lotus-petal" style={{ ['--i' as any]: 7 }} />

        <div className="lotus-core">
          <span />
        </div>
      </div>

      <div className="lotus-shadow" />
      <p className="lotus-label">
        {label}
        <span className="loading-dots" />
      </p>
    </div>
  );
}
