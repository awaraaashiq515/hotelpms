import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/sync/status
 * Returns the current sync status so the client knows whether it is operating
 * in cloud mode or offline-local mode and how many actions are pending.
 *
 * The client passes its local pending count as a query param (?pending=N)
 * since the server cannot introspect the browser's IndexedDB directly.
 */
export async function GET(req: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────────
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── Derive mode from environment ────────────────────────────────
  const offlineEnv = process.env.OFFLINE_MODE;
  const isOffline =
    offlineEnv === '1' ||
    offlineEnv?.toLowerCase() === 'true' ||
    offlineEnv?.toLowerCase() === 'yes';

  const mode: 'offline-local' | 'online-cloud' = isOffline ? 'offline-local' : 'online-cloud';

  // ── Optional pending count forwarded from client ────────────────
  const { searchParams } = new URL(req.url);
  const pendingCount = parseInt(searchParams.get('pending') ?? '0', 10) || 0;

  // ── Last sync timestamp (client may store this in localStorage)  -
  const lastSyncParam = searchParams.get('lastSync');
  const lastSync = lastSyncParam ? new Date(lastSyncParam).toISOString() : null;

  return NextResponse.json({
    pendingCount,
    lastSync,
    serverTime: new Date().toISOString(),
    mode,
  });
}
