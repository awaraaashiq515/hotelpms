/**
 * GuestFlow Offline Queue — IndexedDB-based action queue for offline mode.
 * Orders/KOTs placed offline are stored here and synced when connection returns.
 */

const DB_NAME = 'guestflow-offline-v1';
const DB_VERSION = 1;
const STORE_NAME = 'actions';

export type OfflineActionType =
  | 'CREATE_ORDER'
  | 'UPDATE_ORDER_STATUS'
  | 'ADD_KOT'
  | 'SETTLE_PAYMENT';

export interface OfflineAction {
  id?: number;
  type: OfflineActionType;
  endpoint: string;         // API endpoint to call when online
  method: 'POST' | 'PUT' | 'PATCH';
  payload: Record<string, unknown>;
  timestamp: number;
  retries: number;
  synced: boolean;
  error?: string;
}

// ─── DB Helpers ───────────────────────────────────────────────

let dbInstance: IDBDatabase | null = null;

export async function openOfflineDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('synced', 'synced', { unique: false });
      }
    };
    req.onsuccess = () => {
      dbInstance = req.result;
      resolve(req.result);
    };
    req.onerror = () => reject(req.error);
  });
}

/** Add an action to the offline queue */
export async function queueOfflineAction(
  action: Omit<OfflineAction, 'id' | 'synced' | 'retries'>
): Promise<void> {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).add({
      ...action,
      synced: false,
      retries: 0,
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Get all pending (unsynced) actions */
export async function getPendingActions(): Promise<OfflineAction[]> {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () =>
      resolve((req.result as OfflineAction[]).filter((a) => !a.synced));
    req.onerror = () => reject(req.error);
  });
}

/** Mark an action as synced */
export async function markActionSynced(id: number): Promise<void> {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);
    req.onsuccess = () => {
      const record = req.result as OfflineAction;
      if (record) {
        record.synced = true;
        store.put(record);
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Count pending actions (for badge display) */
export async function getPendingCount(): Promise<number> {
  const actions = await getPendingActions();
  return actions.length;
}
