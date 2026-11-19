import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

type OfflineSyncActionType =
  | 'CREATE_ORDER'
  | 'UPDATE_ORDER_STATUS'
  | 'ADD_KOT'
  | 'SETTLE_PAYMENT'
  | 'CHECK_IN'
  | 'CHECK_OUT'
  | 'CREATE_BOOKING'
  | 'UPDATE_BOOKING'
  | 'CREATE_EXPENSE';

interface SyncAction {
  type: OfflineSyncActionType;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  payload: Record<string, unknown>;
  timestamp: number;
}

interface SyncDetail {
  type: string;
  endpoint: string;
  timestamp: number;
  status: 'synced' | 'error';
  error?: string;
}

/**
 * POST /api/sync
 * Receives an array of offline queue actions and applies them to the database
 * by forwarding each action to the appropriate internal API endpoint.
 */
export async function POST(req: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────────
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let actions: SyncAction[];
  try {
    const body = await req.json();
    actions = Array.isArray(body) ? body : body.actions;
    if (!Array.isArray(actions)) {
      return NextResponse.json(
        { error: 'Request body must be an array of actions or { actions: [] }' },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // ── Process each action ─────────────────────────────────────────
  const details: SyncDetail[] = [];
  let synced = 0;
  let errors = 0;

  // Build the base URL for internal API calls (same origin)
  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Forward the session cookie / Authorization header so internal routes pass auth
  const sessionCookie = req.cookies.get('session')?.value || req.cookies.get('staff_session')?.value;
  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');

  for (const action of actions) {
    const { type, endpoint, method, payload, timestamp } = action;

    // Normalise endpoint — ensure it starts with /
    const normalised = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${baseUrl}${normalised}`;

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-sync-request': '1', // flag so downstream routes can skip re-queueing
    };
    if (authHeader) {
      requestHeaders['Authorization'] = authHeader;
    } else if (sessionCookie) {
      requestHeaders['Cookie'] = `session=${sessionCookie}`;
    }

    try {
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: ['POST', 'PUT', 'PATCH'].includes(method) ? JSON.stringify(payload) : undefined,
      });

      if (!response.ok) {
        const text = await response.text().catch(() => response.statusText);
        throw new Error(`HTTP ${response.status}: ${text}`);
      }

      details.push({ type, endpoint, timestamp, status: 'synced' });
      synced++;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[sync] Failed to replay action ${type} → ${endpoint}:`, message);
      details.push({ type, endpoint, timestamp, status: 'error', error: message });
      errors++;
    }
  }

  return NextResponse.json({ synced, errors, details });
}
