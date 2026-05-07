'use client';

import { useEffect, useState } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { getPendingActions, markActionSynced } from '@/lib/offline-db';

/**
 * OfflineBadge — Fixed bottom-center badge that shows when internet is offline.
 * Auto-syncs queued actions when connectivity is restored.
 */
export function OfflineBadge() {
  const isOnline = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  // Load pending count on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    getPendingActions().then(actions => setPendingCount(actions.length)).catch(() => {});
  }, []);

  // Auto-sync when connection is restored
  useEffect(() => {
    if (!isOnline || pendingCount === 0) return;

    const syncActions = async () => {
      setSyncing(true);
      try {
        const actions = await getPendingActions();
        for (const action of actions) {
          try {
            const res = await fetch(action.endpoint, {
              method: action.method,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(action.payload),
            });
            if (res.ok && action.id != null) {
              await markActionSynced(action.id);
            }
          } catch {
            // Will retry on next online event
          }
        }
        // Refresh count
        const remaining = await getPendingActions();
        setPendingCount(remaining.length);
      } finally {
        setSyncing(false);
      }
    };

    syncActions();
  }, [isOnline, pendingCount]);

  // Don't render anything when online and nothing pending
  if (isOnline && pendingCount === 0) return null;

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-6 py-3 rounded-2xl shadow-2xl font-black text-sm transition-all duration-500 ${
        isOnline && pendingCount > 0
          ? 'bg-amber-500 text-white animate-pulse'
          : 'bg-slate-900 text-white border border-white/10'
      }`}
    >
      {isOnline && syncing ? (
        <>
          <RefreshCw size={18} className="animate-spin" />
          <span>Syncing {pendingCount} offline action{pendingCount > 1 ? 's' : ''}...</span>
        </>
      ) : isOnline && pendingCount > 0 ? (
        <>
          <RefreshCw size={18} />
          <span>{pendingCount} action{pendingCount > 1 ? 's' : ''} pending sync</span>
        </>
      ) : (
        <>
          <WifiOff size={18} className="text-orange-400" />
          <span>
            OFFLINE MODE
            {pendingCount > 0 && (
              <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                {pendingCount} queued
              </span>
            )}
          </span>
        </>
      )}
    </div>
  );
}
