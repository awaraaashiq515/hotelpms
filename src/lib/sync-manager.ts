/**
 * GuestFlow PMS — Sync Manager
 * 
 * Capabilities:
 * - Periodically monitors network connectivity (every 15s)
 * - Transitions to offline mode and queues mutations locally when disconnected
 * - Replays and reconciles pending actions when network connectivity returns
 * - Emits reactive events for UI indicators
 * 
 * Usage:
 *   import { SyncManager } from '@/lib/sync-manager';
 *   SyncManager.start();
 */

import {
  getPendingActions,
  markActionSynced,
  type OfflineAction,
} from './offline-db';

type SyncStatus = 'online' | 'offline' | 'syncing' | 'synced' | 'error';

// Custom event identifiers
const EVENTS = {
  STATUS_CHANGE: 'guestflow-sync-status',
  OFFLINE: 'guestflow-offline',
  ONLINE: 'guestflow-online',
  SYNC_DONE: 'guestflow-sync-done',
};

class SyncManagerClass {
  private checkInterval: ReturnType<typeof setInterval> | null = null;
  private isOnline: boolean = true;
  private isSyncing: boolean = false;
  private pendingCount: number = 0;
  private readonly CHECK_INTERVAL_MS = 15000; // 15 seconds

  // ─────────────────────────────────────
  // Start monitoring
  // ─────────────────────────────────────
  start() {
    if (typeof window === 'undefined') return;

    console.log('[SyncManager] 🚀 Daemon initialized');

    // Run initial connectivity check immediately
    this.performCheck();

    // Check periodically every 15 seconds
    this.checkInterval = setInterval(() => {
      this.performCheck();
    }, this.CHECK_INTERVAL_MS);

    // Browser network events
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());

    // Native Electron application events
    window.addEventListener('guestflow-online', () => this.handleOnline());
    window.addEventListener('guestflow-offline', () => this.handleOffline());
  }

  // ─────────────────────────────────────
  // Stop monitoring
  // ─────────────────────────────────────
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  // ─────────────────────────────────────
  // Connectivity verification
  // ─────────────────────────────────────
  private async performCheck() {
    const wasOnline = this.isOnline;
    const online = await this.checkConnectivity();

    if (!wasOnline && online) {
      await this.handleOnline();
    } else if (wasOnline && !online) {
      this.handleOffline();
    }

    const pending = await getPendingActions();
    this.pendingCount = pending.length;
    this.emitStatus(this.isOnline ? 'online' : 'offline');
  }

  private async checkConnectivity(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return false;
    }

    try {
      const res = await fetch('/api/health', {
        method: 'GET',
        cache: 'no-store',
        signal: AbortSignal.timeout(5000),
      });
      this.isOnline = res.ok;
      return res.ok;
    } catch {
      this.isOnline = false;
      return false;
    }
  }

  // ─────────────────────────────────────
  // Offline State Transition
  // ─────────────────────────────────────
  private handleOffline() {
    if (!this.isOnline) return;
    this.isOnline = false;
    console.log('[SyncManager] ⚠️ Network disconnected — persisting transactions to local storage');

    (window as Window & { __guestflow_offline?: boolean }).__guestflow_offline = true;

    this.emitStatus('offline');
    window.dispatchEvent(new CustomEvent(EVENTS.OFFLINE));
  }

  // ─────────────────────────────────────
  // Online State Transition
  // ─────────────────────────────────────
  private async handleOnline() {
    if (this.isOnline && !this.isSyncing) return;
    this.isOnline = true;
    console.log('[SyncManager] ✅ Connectivity restored — initiating upstream cloud synchronization...');

    (window as Window & { __guestflow_offline?: boolean }).__guestflow_offline = false;

    window.dispatchEvent(new CustomEvent(EVENTS.ONLINE));

    await this.syncPendingActions();
  }

  // ─────────────────────────────────────
  // Synchronization Dispatch
  // ─────────────────────────────────────
  async syncPendingActions(): Promise<{ synced: number; errors: number }> {
    if (this.isSyncing) return { synced: 0, errors: 0 };

    const pending = await getPendingActions();
    if (pending.length === 0) {
      console.log('[SyncManager] ✅ Queue is clean. Zero pending transactions.');
      return { synced: 0, errors: 0 };
    }

    console.log(`[SyncManager] Synchronizing ${pending.length} pending action(s)...`);
    this.isSyncing = true;
    this.emitStatus('syncing');

    let synced = 0;
    let errors = 0;

    for (const action of pending) {
      try {
        const result = await this.executeAction(action);
        if (result.ok) {
          if (action.id !== undefined) {
            await markActionSynced(action.id);
          }
          synced++;
          console.log(`[SyncManager] ✅ Synced action: ${action.type}`);
        } else {
          errors++;
          console.error(`[SyncManager] ❌ Sync failed for: ${action.type}`, result.status);
        }
      } catch (err) {
        errors++;
        console.error(`[SyncManager] ❌ Exception syncing ${action.type}:`, err);
      }
    }

    this.isSyncing = false;
    this.pendingCount = (await getPendingActions()).length;

    console.log(`[SyncManager] Synchronization batch finished: ${synced} synced, ${errors} errors`);
    this.emitStatus(errors === 0 ? 'synced' : 'error');

    window.dispatchEvent(
      new CustomEvent(EVENTS.SYNC_DONE, {
        detail: { synced, errors },
      })
    );

    return { synced, errors };
  }

  // ─────────────────────────────────────
  // Action Dispatch Helper
  // ─────────────────────────────────────
  private async executeAction(action: OfflineAction): Promise<Response> {
    return fetch(action.endpoint, {
      method: action.method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action.payload),
      signal: AbortSignal.timeout(10000),
    });
  }

  // ─────────────────────────────────────
  // Status Emitter
  // ─────────────────────────────────────
  private emitStatus(status: SyncStatus) {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
      new CustomEvent<{ status: SyncStatus; pendingCount: number }>(EVENTS.STATUS_CHANGE, {
        detail: {
          status,
          pendingCount: this.pendingCount,
        },
      })
    );
  }

  // ─────────────────────────────────────
  // Public Properties
  // ─────────────────────────────────────
  get online() {
    return this.isOnline;
  }
  get pending() {
    return this.pendingCount;
  }
  get syncing() {
    return this.isSyncing;
  }
}

export const SyncManager = new SyncManagerClass();
export type { SyncStatus };
export { EVENTS as SYNC_EVENTS };
