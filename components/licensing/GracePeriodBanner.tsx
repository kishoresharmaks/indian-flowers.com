'use client';

import React from 'react';
import { AlertTriangle, Clock, ArrowRight, ShieldAlert } from 'lucide-react';
import { IClientLicenseState } from '@/lib/licensing/licenseTypes';

interface GracePeriodBannerProps {
  license: IClientLicenseState | null;
  onOpenRenewal: () => void;
}

export default function GracePeriodBanner({
  license,
  onOpenRenewal,
}: GracePeriodBannerProps) {
  if (!license) return null;

  const { isGracePeriod, daysRemaining, status, validUntil } = license;

  // Show banner only if expiring soon (< 7 days) or in Grace Period
  const isExpiringSoon = daysRemaining <= 7 && daysRemaining >= 0 && status === 'ACTIVE';

  if (!isGracePeriod && !isExpiringSoon) return null;

  if (isGracePeriod) {
    return (
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 px-4 py-3 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm font-semibold">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-slate-950 shrink-0 animate-bounce" />
            <span>
              <strong className="font-extrabold">Subscription Expired:</strong> You are currently in
              an offline grace period. Please renew your subscription to prevent automatic service
              suspension.
            </span>
          </div>
          <button
            onClick={onOpenRenewal}
            className="px-4 py-1.5 bg-slate-950 hover:bg-slate-900 text-amber-400 font-bold rounded-lg text-xs tracking-wide uppercase transition shadow flex items-center gap-1.5 shrink-0"
          >
            Renew Now
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  if (isExpiringSoon) {
    return (
      <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-amber-500/15 border-b border-amber-500/30 text-amber-900 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs md:text-sm font-medium">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Your plan will expire in{' '}
              <strong className="font-bold text-amber-800">
                {daysRemaining === 0 ? 'today' : `${daysRemaining} day${daysRemaining > 1 ? 's' : ''}`}
              </strong>{' '}
              ({new Date(validUntil).toLocaleDateString('en-US')}).
            </span>
          </div>
          <button
            onClick={onOpenRenewal}
            className="px-3.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs transition flex items-center gap-1 shrink-0"
          >
            Renew Plan
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
