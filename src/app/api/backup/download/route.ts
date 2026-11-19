import { NextRequest, NextResponse } from 'next/server';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

const PROJECT_DIR = process.cwd();
const DEFAULT_BASE_DIR = path.join(os.homedir(), 'Desktop', 'Hotel-PMS-Backups');
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
  return DEFAULT_BASE_DIR;
}

// ── Helper: Dynamically build JSON for property if not present ────────────────
function generateJsonOnTheFly(propCode: string): string | null {
  try {
    const { execSync } = require('child_process');
    const safeCode = (propCode || 'HTL12345').replace(/[^a-zA-Z0-9_-]/g, '');
    const propRes = JSON.parse(
      execSync(`sqlite3 -json prisma/dev.db "SELECT * FROM Property WHERE code = '${safeCode}' LIMIT 1;"`, {
        cwd: PROJECT_DIR,
        stdio: ['pipe', 'pipe', 'ignore'],
      }).toString()
    );
    if (!propRes.length) return null;
    const prop = propRes[0];
    const propId = prop.id;
    const orgId = prop.organizationId;

    const tablesStr = execSync('sqlite3 prisma/dev.db "SELECT name FROM sqlite_master WHERE type=\'table\' AND name NOT LIKE \'sqlite_%\' AND name NOT LIKE \'_prisma%\';"', {
      cwd: PROJECT_DIR,
      stdio: ['pipe', 'pipe', 'ignore'],
    }).toString().trim();
    const tables = tablesStr.split('\n').filter(Boolean);

    const exportedData: Record<string, any[]> = {};
    let totalRecords = 0;

    for (const t of tables) {
      let sql = '';
      if (t === 'Property') {
        sql = `SELECT * FROM "${t}" WHERE id = '${propId}';`;
      } else if (t === 'Organization') {
        sql = `SELECT * FROM "${t}" WHERE id = '${orgId}';`;
      } else {
        const colInfo = execSync(`sqlite3 prisma/dev.db "PRAGMA table_info(\\"${t}\\");"`, {
          cwd: PROJECT_DIR,
          stdio: ['pipe', 'pipe', 'ignore'],
        }).toString();

        if (colInfo.includes('|propertyId|')) {
          sql = `SELECT * FROM "${t}" WHERE propertyId = '${propId}';`;
        } else if (colInfo.includes('|organizationId|')) {
          sql = `SELECT * FROM "${t}" WHERE organizationId = '${orgId}';`;
        } else if (colInfo.includes('|orderId|')) {
          sql = `SELECT * FROM "${t}" WHERE orderId IN (SELECT id FROM PosOrder WHERE propertyId = '${propId}');`;
        } else if (colInfo.includes('|invoiceId|')) {
          sql = `SELECT * FROM "${t}" WHERE invoiceId IN (SELECT id FROM Invoice WHERE propertyId = '${propId}');`;
        } else if (colInfo.includes('|reservationId|')) {
          sql = `SELECT * FROM "${t}" WHERE reservationId IN (SELECT id FROM Reservation WHERE propertyId = '${propId}');`;
        } else {
          sql = `SELECT * FROM "${t}";`;
        }
      }

      try {
        const raw = execSync(`sqlite3 -json prisma/dev.db "${sql}"`, {
          cwd: PROJECT_DIR,
          stdio: ['pipe', 'pipe', 'ignore'],
        }).toString();
        if (raw.trim()) {
          const rows = JSON.parse(raw);
          if (rows && rows.length > 0) {
            exportedData[t] = rows;
            totalRecords += rows.length;
          }
        }
      } catch (_) {}
    }

    const payload = {
      backupType: 'HOTEL_PMS_JSON_BACKUP',
      formatVersion: '2.0',
      format: 'JSON',
      property: {
        code: prop.code,
        name: prop.name,
        city: prop.city,
        propertyId: prop.id,
        organizationId: prop.organizationId,
      },
      exportedAt: new Date().toISOString(),
      tablesCount: Object.keys(exportedData).length,
      recordsCount: totalRecords,
      data: exportedData,
    };

    return JSON.stringify(payload, null, 2);
  } catch (_) {
    return null;
  }
}

function locateBackupFolder(safeName: string, propCode: string): string | null {
  const base = getEffectiveDesktopBase();
  const candidateList = [
    propCode ? path.join(base, propCode, safeName) : '',
    path.join(base, safeName),
    propCode ? path.join(DEFAULT_BASE_DIR, propCode, safeName) : '',
    path.join(DEFAULT_BASE_DIR, safeName),
  ];
  for (const target of candidateList) {
    if (target && fs.existsSync(target)) return target;
  }
  return null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get('name');
  const propertyCode = searchParams.get('propertyCode') || '';
  const requestedFormat = searchParams.get('format') || 'json'; // default to json

  if (!name) {
    return new NextResponse('Missing backup name parameter', { status: 400 });
  }

  const safeName = path.basename(name);
  const targetFolder = locateBackupFolder(safeName, propertyCode);

  if (!targetFolder) {
    return new NextResponse('Backup folder not found', { status: 404 });
  }

  const jsonFile = path.join(targetFolder, 'hotel-data-backup.json');
  const dbFile   = path.join(targetFolder, 'hotel-pms-data.db');

  // If user requested SQLite .db format specifically
  if (requestedFormat === 'db' && fs.existsSync(dbFile)) {
    const fileBuffer = fs.readFileSync(dbFile);
    const downloadName = propertyCode ? `${propertyCode}-${safeName}.db` : `${safeName}.db`;
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/x-sqlite3',
        'Content-Disposition': `attachment; filename="${downloadName}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  }

  // Primary: JSON backup file
  let jsonContent: string | null = null;
  if (fs.existsSync(jsonFile)) {
    jsonContent = fs.readFileSync(jsonFile, 'utf-8');
  } else {
    // Generate on the fly and cache inside folder
    jsonContent = generateJsonOnTheFly(propertyCode);
    if (jsonContent) {
      try {
        fs.writeFileSync(jsonFile, jsonContent, 'utf-8');
      } catch (_) {}
    }
  }

  if (jsonContent) {
    const fileBuffer = Buffer.from(jsonContent, 'utf-8');
    const downloadName = propertyCode ? `${propertyCode}-${safeName}.json` : `${safeName}.json`;

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${downloadName}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  }

  // Ultimate fallback to .db if JSON generation was unavailable
  if (fs.existsSync(dbFile)) {
    const fileBuffer = fs.readFileSync(dbFile);
    const downloadName = propertyCode ? `${propertyCode}-${safeName}.db` : `${safeName}.db`;
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/x-sqlite3',
        'Content-Disposition': `attachment; filename="${downloadName}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  }

  return new NextResponse('Backup file not found', { status: 404 });
}
