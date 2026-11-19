/**
 * Conflict Resolver — Manages conflicts between local changes and cloud changes.
 */

export type ConflictStrategy = 'LOCAL_WINS' | 'CLOUD_WINS' | 'LATEST_WINS' | 'MANUAL';

export interface ConflictRecord {
  id: string;
  model: string; // 'Booking', 'Order', 'Payment', etc.
  recordId: string;
  localData: Record<string, unknown>;
  cloudData: Record<string, unknown>;
  localUpdatedAt: string;
  cloudUpdatedAt: string;
  strategy: ConflictStrategy;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  winner?: 'local' | 'cloud';
}

const STORAGE_KEY = 'guestflow_sync_conflicts';

export class ConflictResolver {
  /**
   * Determine the winning side according to the selected strategy
   */
  static resolveWinner(
    localUpdatedAt: string | Date,
    cloudUpdatedAt: string | Date,
    strategy: ConflictStrategy = 'LATEST_WINS'
  ): 'local' | 'cloud' {
    if (strategy === 'LOCAL_WINS') return 'local';
    if (strategy === 'CLOUD_WINS') return 'cloud';

    const localTime = new Date(localUpdatedAt).getTime();
    const cloudTime = new Date(cloudUpdatedAt).getTime();

    // If latest wins: compare timestamps
    return localTime >= cloudTime ? 'local' : 'cloud';
  }

  /**
   * Browser-side storage: retrieve all conflicts
   */
  static getConflicts(): ConflictRecord[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * Browser-side storage: get only unresolved conflicts
   */
  static getUnresolved(): ConflictRecord[] {
    return this.getConflicts().filter((c) => !c.resolved);
  }

  /**
   * Record a new conflict
   */
  static addConflict(conflict: Omit<ConflictRecord, 'resolved'>): void {
    if (typeof window === 'undefined') return;
    try {
      const all = this.getConflicts();
      const existingIdx = all.findIndex((c) => c.id === conflict.id);
      const record: ConflictRecord = { ...conflict, resolved: false };

      if (existingIdx >= 0) {
        all[existingIdx] = record;
      } else {
        all.push(record);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      window.dispatchEvent(new CustomEvent('guestflow-conflict-updated'));
    } catch (e) {
      console.error('[ConflictResolver] Error storing conflict:', e);
    }
  }

  /**
   * Mark a conflict as resolved with a specified winner
   */
  static markResolved(id: string, winner: 'local' | 'cloud', resolvedBy: string = 'User'): void {
    if (typeof window === 'undefined') return;
    try {
      const all = this.getConflicts();
      const idx = all.findIndex((c) => c.id === id);
      if (idx >= 0) {
        all[idx].resolved = true;
        all[idx].winner = winner;
        all[idx].resolvedAt = new Date().toISOString();
        all[idx].resolvedBy = resolvedBy;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
        window.dispatchEvent(new CustomEvent('guestflow-conflict-updated'));
      }
    } catch (e) {
      console.error('[ConflictResolver] Error resolving conflict:', e);
    }
  }

  /**
   * Clear resolved conflicts
   */
  static clearResolved(): void {
    if (typeof window === 'undefined') return;
    try {
      const unresolved = this.getUnresolved();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(unresolved));
      window.dispatchEvent(new CustomEvent('guestflow-conflict-updated'));
    } catch (e) {
      console.error('[ConflictResolver] Error clearing conflicts:', e);
    }
  }
}
