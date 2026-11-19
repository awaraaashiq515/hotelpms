import { NextRequest, NextResponse } from 'next/server';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

function sanitizePath(input: string): string {
  let p = input.trim();
  if (p.startsWith('~')) {
    p = path.join(os.homedir(), p.slice(1));
  }
  return path.resolve(p);
}

// ── GET /api/backup/browse-folder ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const queryDir = searchParams.get('dir');

    let targetDir = queryDir ? sanitizePath(queryDir) : path.join(os.homedir(), 'Desktop');
    if (!fs.existsSync(targetDir)) {
      targetDir = os.homedir();
    }

    const stat = fs.statSync(targetDir);
    if (!stat.isDirectory()) {
      targetDir = path.dirname(targetDir);
    }

    const entries = fs.readdirSync(targetDir, { withFileTypes: true });
    const folders: { name: string; fullPath: string }[] = [];

    for (const entry of entries) {
      // Skip hidden/system files starting with .
      if (entry.name.startsWith('.')) continue;
      if (entry.isDirectory()) {
        folders.push({
          name: entry.name,
          fullPath: path.join(targetDir, entry.name),
        });
      }
    }

    folders.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

    const parentPath = path.dirname(targetDir);

    return NextResponse.json({
      success: true,
      currentPath: targetDir,
      parentPath: parentPath !== targetDir ? parentPath : null,
      homedir: os.homedir(),
      desktop: path.join(os.homedir(), 'Desktop'),
      documents: path.join(os.homedir(), 'Documents'),
      downloads: path.join(os.homedir(), 'Downloads'),
      volumes: fs.existsSync('/Volumes') ? '/Volumes' : null,
      folders,
    });

  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}

// ── POST /api/backup/browse-folder ────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { parentDir, folderName } = body as { parentDir?: string; folderName?: string };

    if (!parentDir || !folderName) {
      return NextResponse.json({ success: false, error: 'parentDir and folderName are required' }, { status: 400 });
    }

    const cleanDir = sanitizePath(parentDir);
    // Sanitize folder name
    const cleanName = folderName.trim().replace(/[\/\\:*?"<>|]/g, '_');
    if (!cleanName) {
      return NextResponse.json({ success: false, error: 'Invalid folder name' }, { status: 400 });
    }

    const newPath = path.join(cleanDir, cleanName);
    fs.mkdirSync(newPath, { recursive: true });

    return NextResponse.json({
      success: true,
      message: `Folder "${cleanName}" created successfully.`,
      createdPath: newPath,
    });

  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
