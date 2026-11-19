import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const DATA_DIR = path.join(process.cwd(), 'data');
const CONFLICT_FILE = path.join(DATA_DIR, 'sync-conflicts.json');

function ensureConflictFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(CONFLICT_FILE)) {
    fs.writeFileSync(CONFLICT_FILE, JSON.stringify([]));
  }
}

function readConflicts() {
  ensureConflictFile();
  try {
    const raw = fs.readFileSync(CONFLICT_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeConflicts(data: unknown) {
  ensureConflictFile();
  fs.writeFileSync(CONFLICT_FILE, JSON.stringify(data, null, 2));
}

// GET /api/sync/conflicts
export async function GET() {
  try {
    const conflicts = readConflicts();
    const unresolved = conflicts.filter((c: any) => !c.resolved);
    return NextResponse.json({
      conflicts,
      unresolvedCount: unresolved.length,
      mode: process.env.OFFLINE_MODE === 'true' ? 'offline' : 'online',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to read conflicts', details: String(error) },
      { status: 500 }
    );
  }
}

// POST /api/sync/conflicts
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, conflictId, winner, conflictData } = body;

    const conflicts = readConflicts();

    if (action === 'record') {
      conflicts.push({
        id: conflictData.id || `conflict_${Date.now()}`,
        ...conflictData,
        resolved: false,
        createdAt: new Date().toISOString(),
      });
      writeConflicts(conflicts);
      return NextResponse.json({ success: true, message: 'Conflict recorded' });
    }

    if (action === 'resolve') {
      const idx = conflicts.findIndex((c: any) => c.id === conflictId);
      if (idx === -1) {
        return NextResponse.json({ error: 'Conflict not found' }, { status: 404 });
      }

      conflicts[idx].resolved = true;
      conflicts[idx].winner = winner; // 'local' | 'cloud'
      conflicts[idx].resolvedAt = new Date().toISOString();
      writeConflicts(conflicts);

      return NextResponse.json({
        success: true,
        message: `Conflict resolved in favor of ${winner}`,
      });
    }

    return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process conflict operation', details: String(error) },
      { status: 500 }
    );
  }
}
