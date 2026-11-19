'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { AlertTriangle, AlertOctagon, ArrowRight, X, Sparkles, Crown } from 'lucide-react';

interface Props {
  session?: any;
}

function getDaysLeft(endDate: string | null): number | null {
  if (!endDate) return null;
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export const HotelSubscriptionWarningBanner: React.FC<Props> = ({ session: propSession }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [sessionData, setSessionData] = useState<any>(propSession || null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if dismissed in this browser session
    const isDismissed = sessionStorage.getItem('dismiss_sub_warning_banner');
    if (isDismissed === 'true') {
      setDismissed(true);
    }

    if (!propSession) {
      fetch('/api/auth/session')
        .then((res) => res.json())
        .then((json) => {
          if (json.authenticated && json.user) {
            setSessionData(json.user);
          }
        })
        .catch(() => {});
    } else {
      setSessionData(propSession);
    }
  }, [propSession]);

  if (dismissed) return null;

  const endDate = sessionData?.packageEndDate;
  const packageName = sessionData?.packageName || 'Hotel PMS';
  const status = sessionData?.subscriptionStatus;
  const daysLeft = getDaysLeft(endDate);

  // Show only if <= 10 days left or already expired
  const isExpiringSoon = daysLeft !== null && daysLeft <= 10 && daysLeft > 0;
  const isExpired = (daysLeft !== null && daysLeft <= 0) || status === 'EXPIRED';

  if (!isExpiringSoon && !isExpired) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('dismiss_sub_warning_banner', 'true');
  };

  const handleActionClick = () => {
    if (pathname === '/hotel/subscription') {
      // Trigger modal open event
      window.dispatchEvent(new CustomEvent('open-upgrade-modal'));
    } else {
      router.push('/hotel/subscription?upgrade=true');
    }
  };

  const formattedDate = endDate
    ? new Date(endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

  return (
    <div
      className={`w-full px-4 py-2 flex items-center justify-between gap-3 text-xs z-40 transition-all shadow-md ${
        isExpired
          ? 'bg-gradient-to-r from-red-950 via-rose-900 to-red-950 border-b border-red-500/50 text-red-100'
          : 'bg-gradient-to-r from-amber-950 via-amber-900 to-orange-950 border-b border-amber-500/50 text-amber-100'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
            isExpired ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400 animate-pulse'
          }`}
        >
          {isExpired ? <AlertOctagon size={14} /> : <AlertTriangle size={14} />}
        </div>

        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span
            className={`font-black uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-full ${
              isExpired
                ? 'bg-red-500 text-white'
                : 'bg-amber-500 text-slate-950 font-extrabold'
            }`}
          >
            {isExpired ? 'Expired' : `${daysLeft} Days Left`}
          </span>

          <span className="font-medium text-xs truncate">
            {isExpired ? (
              <>
                Your <strong className="font-bold text-white">{packageName}</strong> plan has expired! Renew now to prevent interruption to hotel operations.
              </>
            ) : (
              <>
                Your <strong className="font-bold text-white">{packageName}</strong> plan will expire on{' '}
                <strong className="font-bold text-white">{formattedDate}</strong> ({daysLeft} days remaining). Please renew or upgrade soon.
              </>
            )}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleActionClick}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl font-bold text-xs transition-all shadow cursor-pointer active:scale-95 ${
            isExpired
              ? 'bg-red-500 hover:bg-red-400 text-white shadow-red-900/50'
              : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-900/50'
          }`}
        >
          <Sparkles size={12} />
          <span>{isExpired ? 'Renew Now' : 'Renew / Upgrade'}</span>
          <ArrowRight size={12} />
        </button>

        <button
          onClick={handleDismiss}
          title="Dismiss banner"
          className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-all cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};
