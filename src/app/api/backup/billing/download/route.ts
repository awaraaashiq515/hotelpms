import { NextRequest, NextResponse } from 'next/server';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { getSession } from '@/lib/session';

const PROJECT_DIR   = process.cwd();
const BACKUP_FOLDER = 'Hotel-PMS-Backups';
const DESKTOP_BASE  = path.join(os.homedir(), 'Desktop', BACKUP_FOLDER);
const SETTINGS_PATH = path.join(PROJECT_DIR, 'scripts', 'backup-settings.json');

function getEffectiveDesktopBase(): string {
  try {
    if (fs.existsSync(SETTINGS_PATH)) {
      const settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf-8'));
      if (settings.customDesktopPath && settings.customDesktopPath.trim()) {
        const p = settings.customDesktopPath.trim();
        try { fs.mkdirSync(p, { recursive: true }); } catch (_) {}
        return p;
      }
    }
  } catch (_) {}
  return DESKTOP_BASE;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(req.url);
    const archiveName = searchParams.get('name') || '';
    const propCode = searchParams.get('propertyCode') || session?.propertyCode || 'HOTEL';

    if (!archiveName) {
      return NextResponse.json({ error: 'Archive name is required' }, { status: 400 });
    }

    const filename = archiveName.endsWith('.json') ? archiveName : `${archiveName}.json`;
    const base = getEffectiveDesktopBase();
    const filePath = path.join(base, propCode, 'billing-archives', filename);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: `File not found: ${filename}` }, { status: 404 });
    }

    const content = fs.readFileSync(filePath, 'utf-8');

    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${propCode}-${filename}"`,
      },
    });

  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
