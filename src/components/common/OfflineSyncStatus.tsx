'use client';

/**
 * OfflineSyncStatus — Screen ke corner mein sync status dikhata hai
 * 
 * States:
 * 🟢 Online — Synced        (green, bottom right)
 * 🟡 Syncing... X items     (yellow, animating)
 * 🔴 Offline — X items local (red, persistent)
 * ✅ Sync Complete!          (green flash, fir hide)
 */

import { useEffect, useState, useCallback } from 'react';
import { SyncManager, type SyncStatus, SYNC_EVENTS } from '@/lib/sync-manager';

interface StatusInfo {
  status: SyncStatus | 'idle';
  pendingCount: number;
  lastSyncedCount?: number;
}

export function OfflineSyncStatus() {
  const [info, setInfo] = useState<StatusInfo>({
    status: 'idle',
    pendingCount: 0,
  });
  const [visible, setVisible] = useState(false);
  const [justSynced, setJustSynced] = useState(false);

  const handleStatusChange = useCallback(
    (e: Event) => {
      const event = e as CustomEvent<{ status: SyncStatus; pendingCount: number }>;
      const { status, pendingCount } = event.detail;

      setInfo({ status, pendingCount });

      // Hamesha dikhao agar offline ya syncing hai
      if (status === 'offline' || status === 'syncing' || pendingCount > 0) {
        setVisible(true);
      }

      // Online + synced — thodi der dikhao phir hide
      if (status === 'online' && pendingCount === 0) {
        setVisible(true);
        setTimeout(() => setVisible(false), 4000);
      }
    },
    []
  );

  const handleSyncDone = useCallback(
    (e: Event) => {
      const event = e as CustomEvent<{ synced: number; errors: number }>;
      const { synced } = event.detail;
      if (synced > 0) {
        setJustSynced(true);
        setInfo(prev => ({ ...prev, lastSyncedCount: synced, status: 'synced', pendingCount: 0 }));
        setVisible(true);
        setTimeout(() => {
          setJustSynced(false);
          setVisible(false);
        }, 5000);
      }
    },
    []
  );

  useEffect(() => {
    // SyncManager shuru karo
    SyncManager.start();

    window.addEventListener(SYNC_EVENTS.STATUS_CHANGE, handleStatusChange);
    window.addEventListener(SYNC_EVENTS.SYNC_DONE, handleSyncDone);

    return () => {
      window.removeEventListener(SYNC_EVENTS.STATUS_CHANGE, handleStatusChange);
      window.removeEventListener(SYNC_EVENTS.SYNC_DONE, handleSyncDone);
      SyncManager.stop();
    };
  }, [handleStatusChange, handleSyncDone]);

  if (!visible) return null;

  // ─── Render ───────────────────────────────────────
  const { status, pendingCount, lastSyncedCount } = info;

  const configs: Record<string, { bg: string; border: string; icon: string; text: string }> = {
    offline: {
      bg: 'bg-red-950/95',
      border: 'border-red-700',
      icon: '📴',
      text: pendingCount > 0
        ? `Offline — ${pendingCount} item${pendingCount > 1 ? 's' : ''} saved locally`
        : 'Offline Mode — No internet connection',
    },
    syncing: {
      bg: 'bg-yellow-950/95',
      border: 'border-yellow-600',
      icon: '🔄',
      text: `Syncing with cloud... (${pendingCount} item${pendingCount > 1 ? 's' : ''})`,
    },
    synced: {
      bg: 'bg-green-950/95',
      border: 'border-green-600',
      icon: '✅',
      text: `Sync Complete! ${lastSyncedCount ?? 0} item${(lastSyncedCount ?? 0) !== 1 ? 's' : ''} uploaded`,
    },
    error: {
      bg: 'bg-orange-950/95',
      border: 'border-orange-600',
      icon: '⚠️',
      text: 'Some items could not sync — will retry automatically',
    },
    online: {
      bg: 'bg-green-950/95',
      border: 'border-green-700',
      icon: '🟢',
      text: 'Online — Fully Synced',
    },
    idle: {
      bg: 'bg-slate-900/95',
      border: 'border-slate-700',
      icon: '⏳',
      text: 'Connecting...',
    },
  };

  const cfg = configs[status] ?? configs.idle;

  return (
    <div
      className={`
        fixed bottom-4 right-4 z-[9999]
        flex items-center gap-2 px-4 py-2.5
        rounded-xl border backdrop-blur-sm
        shadow-2xl text-sm font-medium text-white
        transition-all duration-500 ease-in-out
        ${cfg.bg} ${cfg.border}
        ${status === 'syncing' ? 'animate-pulse' : ''}
        ${justSynced ? 'scale-105' : 'scale-100'}
      `}
      role="status"
      aria-live="polite"
    >
      <span
        className={status === 'syncing' ? 'animate-spin inline-block' : ''}
        style={status === 'syncing' ? { display: 'inline-block' } : {}}
      >
        {cfg.icon}
      </span>
      <span>{cfg.text}</span>

      {/* Manual sync button — offline hone pe */}
      {status === 'online' && pendingCount > 0 && (
        <button
          onClick={() => SyncManager.syncPendingActions()}
          className="ml-2 px-2 py-0.5 bg-blue-600 hover:bg-blue-500 rounded text-xs transition-colors"
        >
          Sync Now
        </button>
      )}
    </div>
  );
}

export default OfflineSyncStatus;
