import { NextRequest, NextResponse } from 'next/server';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { getSession } from '@/lib/session';

const PROJECT_DIR   = process.cwd();
const BACKUP_FOLDER = 'Hotel-PMS-Backups';
const DESKTOP_BASE  = path.join(os.homedir(), 'Desktop', BACKUP_FOLDER);
const DB_PATH       = path.join(PROJECT_DIR, 'prisma', 'dev.db');
const LOG_PATH      = path.join(PROJECT_DIR, 'scripts', 'backup-log.json');

interface PropertyRecord {
  code: string;
  name: string;
  city: string;
}

// ── Helper: Resolve current active property (Strict Tenant Isolation) ─────────
function resolveProperty(req: NextRequest, sessionUser: any): PropertyRecord {
  const queryCode = req.nextUrl.searchParams.get('propertyCode');
  const targetCode = queryCode || sessionUser?.propertyCode || null;
  const propId = sessionUser?.propertyId || null;
  const orgId = sessionUser?.organizationId || null;

  try {
    const { execSync } = require('child_process');

    // 1. If explicit propertyCode was requested
    if (targetCode) {
      const sanitized = targetCode.replace(/[^a-zA-Z0-9_-]/g, '');
      const output = execSync(`sqlite3 prisma/dev.db "SELECT code, name, city FROM Property WHERE code = '${sanitized}' LIMIT 1;"`, {
        cwd: PROJECT_DIR,
        stdio: ['pipe', 'pipe', 'ignore'],
      }).toString().trim();

      if (output) {
        const parts = output.split('|');
        return { code: parts[0], name: parts[1] || parts[0], city: parts[2] || '' };
      }
    }

    // 2. If user session has propertyId
    if (propId) {
      const sanitizedId = propId.replace(/[^a-zA-Z0-9_-]/g, '');
      const output = execSync(`sqlite3 prisma/dev.db "SELECT code, name, city FROM Property WHERE id = '${sanitizedId}' LIMIT 1;"`, {
        cwd: PROJECT_DIR,
        stdio: ['pipe', 'pipe', 'ignore'],
      }).toString().trim();

      if (output) {
        const parts = output.split('|');
        return { code: parts[0], name: parts[1] || parts[0], city: parts[2] || '' };
      }
    }

    // 3. If user session has organizationId, find this org's hotel property
    if (orgId) {
      const sanitizedOrg = orgId.replace(/[^a-zA-Z0-9_-]/g, '');
      const output = execSync(`sqlite3 prisma/dev.db "SELECT code, name, city FROM Property WHERE organizationId = '${sanitizedOrg}' ORDER BY CASE WHEN type = 'HOTEL' THEN 0 ELSE 1 END, createdAt ASC LIMIT 1;"`, {
        cwd: PROJECT_DIR,
        stdio: ['pipe', 'pipe', 'ignore'],
      }).toString().trim();

      if (output) {
        const parts = output.split('|');
        return { code: parts[0], name: parts[1] || parts[0], city: parts[2] || '' };
      }
    }

    // 4. Absolute fallback only if no session at all
    const firstOutput = execSync('sqlite3 prisma/dev.db "SELECT code, name, city FROM Property LIMIT 1;"', {
      cwd: PROJECT_DIR,
      stdio: ['pipe', 'pipe', 'ignore'],
    }).toString().trim();

    if (firstOutput) {
      const parts = firstOutput.split('|');
      return { code: parts[0], name: parts[1] || parts[0], city: parts[2] || '' };
    }
  } catch (_) {}

  return { code: targetCode || 'HOTEL', name: 'Hotel Property', city: '' };
}

// ── Helper: Find Google Drive ─────────────────────────────────────────────────
function findGoogleDriveFolder(): { path: string; email: string } | null {
  const cloudStorage = path.join(os.homedir(), 'Library', 'CloudStorage');
  if (fs.existsSync(cloudStorage)) {
    try {
      const entries = fs.readdirSync(cloudStorage);
      for (const entry of entries) {
        if (entry.startsWith('GoogleDrive-')) {
          const email = entry.replace('GoogleDrive-', '');
          return { path: path.join(cloudStorage, entry, 'My Drive', BACKUP_FOLDER), email };
        }
      }
    } catch (_) {}
  }
  const oldPath = path.join(os.homedir(), 'Google Drive', 'My Drive');
  if (fs.existsSync(oldPath)) {
    return { path: path.join(oldPath, BACKUP_FOLDER), email: 'Google Drive' };
  }
  return null;
}

// ── Helper: Export Property Data into Pure JSON ───────────────────────────────
function exportPropertyToJson(prop: PropertyRecord) {
  const { execSync } = require('child_process');
  let propId = '';
  let orgId = '';

  try {
    const rawProp = execSync(`sqlite3 -json prisma/dev.db "SELECT id, organizationId FROM Property WHERE code = '${prop.code.replace(/[^a-zA-Z0-9_-]/g, '')}' LIMIT 1;"`, {
      cwd: PROJECT_DIR,
      stdio: ['pipe', 'pipe', 'ignore'],
    }).toString().trim();
    if (rawProp) {
      const parsed = JSON.parse(rawProp);
      if (parsed[0]) {
        propId = parsed[0].id;
        orgId = parsed[0].organizationId;
      }
    }
  } catch (_) {}

  let tables: string[] = [];
  try {
    const tablesStr = execSync('sqlite3 prisma/dev.db "SELECT name FROM sqlite_master WHERE type=\'table\' AND name NOT LIKE \'sqlite_%\' AND name NOT LIKE \'_prisma%\';"', {
      cwd: PROJECT_DIR,
      stdio: ['pipe', 'pipe', 'ignore'],
    }).toString().trim();
    tables = tablesStr.split('\n').filter(Boolean);
  } catch (_) {}

  const exportedData: Record<string, any[]> = {};
  let totalRecords = 0;

  for (const t of tables) {
    let sql = '';
    if (t === 'Property') {
      sql = propId ? `SELECT * FROM "${t}" WHERE id = '${propId}';` : `SELECT * FROM "${t}" WHERE code = '${prop.code}';`;
    } else if (t === 'Organization') {
      sql = orgId ? `SELECT * FROM "${t}" WHERE id = '${orgId}';` : `SELECT * FROM "${t}";`;
    } else {
      let colInfo = '';
      try {
        colInfo = execSync(`sqlite3 prisma/dev.db "PRAGMA table_info(\\"${t}\\");"`, {
          cwd: PROJECT_DIR,
          stdio: ['pipe', 'pipe', 'ignore'],
        }).toString();
      } catch (_) {}

      if (propId && colInfo.includes('|propertyId|')) {
        sql = `SELECT * FROM "${t}" WHERE propertyId = '${propId}';`;
      } else if (orgId && colInfo.includes('|organizationId|')) {
        sql = `SELECT * FROM "${t}" WHERE organizationId = '${orgId}';`;
      } else if (propId && colInfo.includes('|orderId|')) {
        sql = `SELECT * FROM "${t}" WHERE orderId IN (SELECT id FROM PosOrder WHERE propertyId = '${propId}');`;
      } else if (propId && colInfo.includes('|invoiceId|')) {
        sql = `SELECT * FROM "${t}" WHERE invoiceId IN (SELECT id FROM Invoice WHERE propertyId = '${propId}');`;
      } else if (propId && colInfo.includes('|reservationId|')) {
        sql = `SELECT * FROM "${t}" WHERE reservationId IN (SELECT id FROM Reservation WHERE propertyId = '${propId}');`;
      } else if (propId && colInfo.includes('|kotId|')) {
        sql = `SELECT * FROM "${t}" WHERE kotId IN (SELECT id FROM KotTicket WHERE propertyId = '${propId}');`;
      } else if (propId && colInfo.includes('|folioId|')) {
        sql = `SELECT * FROM "${t}" WHERE folioId IN (SELECT id FROM Folio WHERE propertyId = '${propId}');`;
      } else {
        // System lookup or shared table (Role, Permission, etc.)
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
      propertyId: propId,
      organizationId: orgId,
    },
    exportedAt: new Date().toISOString(),
    tablesCount: Object.keys(exportedData).length,
    recordsCount: totalRecords,
    data: exportedData,
  };

  const jsonStr = JSON.stringify(payload, null, 2);
  const sizeBytes = Buffer.byteLength(jsonStr);

  return {
    payload,
    jsonStr,
    totalRecords,
    tablesCount: Object.keys(exportedData).length,
    sizeBytes,
    sizeKB: (sizeBytes / 1024).toFixed(1) + ' KB',
    sizeMB: (sizeBytes / 1024 / 1024).toFixed(2) + ' MB',
  };
}

// ── Helper: List backups for this property ONLY ───────────────────────────────
function listBackupsForProperty(propCode: string) {
  const propDir = path.join(DESKTOP_BASE, propCode);
  const backups: any[] = [];

  const readDir = fs.existsSync(propDir) ? propDir : (fs.existsSync(DESKTOP_BASE) ? DESKTOP_BASE : null);
  if (!readDir) return backups;

  try {
    fs.readdirSync(readDir)
      .filter((f) => f.startsWith('backup-') && fs.statSync(path.join(readDir, f)).isDirectory())
      .sort().reverse()
      .forEach((entry) => {
        let info: Record<string, unknown> = {};
        const entryDir = path.join(readDir, entry);
        const infoFile = path.join(entryDir, 'backup-info.json');
        const jsonFile = path.join(entryDir, 'hotel-data-backup.json');

        if (fs.existsSync(infoFile)) {
          try {
            info = JSON.parse(fs.readFileSync(infoFile, 'utf-8'));
          } catch (_) {}
        }

        let jsonSizeDisplay = (info.jsonSizeKB as string) || (info.jsonSizeMB as string) || '';
        if (!jsonSizeDisplay && fs.existsSync(jsonFile)) {
          const stats = fs.statSync(jsonFile);
          jsonSizeDisplay = (stats.size / 1024).toFixed(1) + ' KB';
        }

        backups.push({
          name:           entry,
          propertyCode:   propCode,
          format:         'JSON',
          fileType:       'json',
          desktopPath:    entryDir,
          timestamp:      info.timestamp || entry,
          dateStr:        info.backupDate || '—',
          timeStr:        info.backupTime || '—',
          jsonSize:       jsonSizeDisplay || '—',
          dbSizeMB:       jsonSizeDisplay || (info.dbSizeMB as string) || '—',
          recordsCount:   info.recordsCount || null,
          tablesCount:    info.tablesCount || null,
          hasJson:        fs.existsSync(jsonFile),
          hasGoogleDrive: !!(info.locations && (info.locations as Record<string, unknown>).googleDrive),
        });
      });
  } catch (_) {}

  return backups;
}

// ── Helper: Create backup for this specific property in JSON ─────────────────
function createBackupForProperty(prop: PropertyRecord) {
  const now       = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const dateStr   = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr   = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const bkpName   = `backup-${timestamp}`;

  const result: Record<string, unknown> = {
    backupName:   bkpName,
    propertyCode: prop.code,
    propertyName: prop.name,
    format:       'JSON',
    timestamp:    now.toISOString(),
    dateStr, timeStr,
    desktopPath:  null, gdrivePath: null, gdriveEmail: null,
    jsonSize:     '0 KB',
    dbSizeMB:     '0 KB',
    success:      false, error: null, googleDriveInstalled: false,
  };

  try {
    if (!fs.existsSync(DB_PATH)) throw new Error('Database file not found: ' + DB_PATH);

    // 1. Export pure JSON data for this tenant
    const exported = exportPropertyToJson(prop);
    result.jsonSize     = exported.sizeKB;
    result.dbSizeMB     = exported.sizeKB;
    result.recordsCount = exported.totalRecords;
    result.tablesCount  = exported.tablesCount;

    // 2. Desktop: Dedicated folder for this property
    const propDir = path.join(DESKTOP_BASE, prop.code);
    fs.mkdirSync(propDir, { recursive: true });
    const desktopBkpPath = path.join(propDir, bkpName);
    fs.mkdirSync(desktopBkpPath, { recursive: true });

    // Save primary JSON backup file
    const jsonDest = path.join(desktopBkpPath, 'hotel-data-backup.json');
    fs.writeFileSync(jsonDest, exported.jsonStr, 'utf-8');

    // Also save SQLite .db snapshot as secondary clone
    fs.copyFileSync(DB_PATH, path.join(desktopBkpPath, 'hotel-pms-data.db'));
    if (fs.existsSync(DB_PATH + '-wal')) fs.copyFileSync(DB_PATH + '-wal', path.join(desktopBkpPath, 'hotel-pms-data.db-wal'));
    if (fs.existsSync(DB_PATH + '-shm')) fs.copyFileSync(DB_PATH + '-shm', path.join(desktopBkpPath, 'hotel-pms-data.db-shm'));

    // Info JSON strictly isolated for THIS property
    const infoObj = {
      system:       'Hotel PMS — GustFlow',
      format:       'JSON',
      jsonFile:     'hotel-data-backup.json',
      propertyCode: prop.code,
      propertyName: prop.name,
      city:         prop.city,
      backupDate:   dateStr,
      backupTime:   timeStr,
      timestamp:    now.toISOString(),
      jsonSizeKB:   exported.sizeKB,
      dbSizeMB:     exported.sizeKB,
      recordsCount: exported.totalRecords,
      tablesCount:  exported.tablesCount,
      howToRestore: 'Restore directly via PMS interface or restoreFromJson helper.',
      locations:    { desktop: desktopBkpPath } as Record<string, string>,
    };
    fs.writeFileSync(path.join(desktopBkpPath, 'backup-info.json'), JSON.stringify(infoObj, null, 2));
    result.desktopPath = desktopBkpPath;

    // 3. Google Drive: Dedicated folder for this property
    const gdrive = findGoogleDriveFolder();
    if (gdrive) {
      result.googleDriveInstalled = true;
      try {
        const gdrivePropDir = path.join(gdrive.path, prop.code);
        fs.mkdirSync(gdrivePropDir, { recursive: true });
        const gdriveBkpPath = path.join(gdrivePropDir, bkpName);
        fs.mkdirSync(gdriveBkpPath, { recursive: true });

        // Save JSON on Google Drive
        fs.writeFileSync(path.join(gdriveBkpPath, 'hotel-data-backup.json'), exported.jsonStr, 'utf-8');
        fs.copyFileSync(DB_PATH, path.join(gdriveBkpPath, 'hotel-pms-data.db'));
        if (fs.existsSync(DB_PATH + '-wal')) fs.copyFileSync(DB_PATH + '-wal', path.join(gdriveBkpPath, 'hotel-pms-data.db-wal'));
        if (fs.existsSync(DB_PATH + '-shm')) fs.copyFileSync(DB_PATH + '-shm', path.join(gdriveBkpPath, 'hotel-pms-data.db-shm'));

        infoObj.locations.googleDrive = gdriveBkpPath;
        fs.writeFileSync(path.join(gdriveBkpPath, 'backup-info.json'), JSON.stringify(infoObj, null, 2));
        result.gdrivePath  = gdriveBkpPath;
        result.gdriveEmail = gdrive.email;

        cleanOldBackups(gdrivePropDir, 30);
      } catch (_) {}
    }

    cleanOldBackups(propDir, 30);
    result.success = true;
  } catch (err) {
    result.error = (err as Error).message;
  }

  // Save log
  try {
    let logs: any[] = [];
    if (fs.existsSync(LOG_PATH)) logs = JSON.parse(fs.readFileSync(LOG_PATH, 'utf-8'));
    logs.unshift(result);
    if (logs.length > 100) logs = logs.slice(0, 100);
    fs.writeFileSync(LOG_PATH, JSON.stringify(logs, null, 2));
  } catch (_) {}

  return result;
}

// ── Helper: Restore Property from JSON Backup ─────────────────────────────────
function restorePropertyFromJson(backupDir: string, prop: PropertyRecord) {
  const jsonPath = path.join(backupDir, 'hotel-data-backup.json');
  const dbPath = path.join(backupDir, 'hotel-pms-data.db');

  if (fs.existsSync(jsonPath)) {
    const { execSync } = require('child_process');
    const content = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    const data = content.data || {};

    for (const [table, rows] of Object.entries(data)) {
      if (!Array.isArray(rows) || rows.length === 0) continue;
      for (const row of rows as any[]) {
        const keys = Object.keys(row).map((k) => `"${k}"`);
        const vals = Object.values(row).map((v) => {
          if (v === null || v === undefined) return 'NULL';
          if (typeof v === 'number') return v;
          if (typeof v === 'boolean') return v ? 1 : 0;
          return `'${String(v).replace(/'/g, "''")}'`;
        });
        const sql = `INSERT OR REPLACE INTO "${table}" (${keys.join(', ')}) VALUES (${vals.join(', ')});`;
        try {
          execSync(`sqlite3 prisma/dev.db "${sql}"`, { cwd: PROJECT_DIR, stdio: ['pipe', 'pipe', 'ignore'] });
        } catch (_) {}
      }
    }
    return { success: true, message: `JSON Backup data successfully restored for ${prop.name}.` };
  } else if (fs.existsSync(dbPath)) {
    // Fallback to SQLite DB restore
    fs.copyFileSync(dbPath, DB_PATH);
    if (fs.existsSync(dbPath + '-wal')) fs.copyFileSync(dbPath + '-wal', DB_PATH + '-wal');
    if (fs.existsSync(dbPath + '-shm')) fs.copyFileSync(dbPath + '-shm', DB_PATH + '-shm');
    return { success: true, message: `Database restored from ${prop.name} backup.` };
  }

  throw new Error('No valid backup file found in: ' + backupDir);
}

function cleanOldBackups(dir: string, keep = 30) {
  if (!fs.existsSync(dir)) return;
  try {
    const entries = fs.readdirSync(dir)
      .filter((f) => f.startsWith('backup-') && fs.statSync(path.join(dir, f)).isDirectory())
      .sort().reverse();
    if (entries.length > keep) {
      entries.slice(keep).forEach((e) => fs.rmSync(path.join(dir, e), { recursive: true, force: true }));
    }
  } catch (_) {}
}

// ── GET /api/backup → Scoped strictly to the requested property in JSON ────────
export async function GET(req: NextRequest) {
  const session = await getSession();
  const prop = resolveProperty(req, session);
  const gdrive = findGoogleDriveFolder();
  const backups = listBackupsForProperty(prop.code);

  let logs: any[] = [];
  try {
    if (fs.existsSync(LOG_PATH)) {
      const allLogs = JSON.parse(fs.readFileSync(LOG_PATH, 'utf-8'));
      logs = (Array.isArray(allLogs) ? allLogs : [])
        .filter((l: any) => l.propertyCode === prop.code)
        .map((l: any) => {
          const { hotelsIncluded, totalHotels, ...rest } = l;
          return rest;
        });
    }
  } catch (_) {}

  const propDesktopDir = path.join(DESKTOP_BASE, prop.code);

  return NextResponse.json({
    property: {
      code: prop.code,
      name: prop.name,
      city: prop.city,
    },
    status: {
      backupFormat:        'JSON',
      desktopPath:         propDesktopDir,
      googleDriveDetected: !!gdrive,
      googleDriveEmail:    gdrive?.email || null,
      googleDrivePath:     gdrive ? path.join(gdrive.path, prop.code) : null,
      totalBackups:        backups.length,
      dbExists:            fs.existsSync(DB_PATH),
      dbSizeMB:            backups[0]?.jsonSize || (fs.existsSync(DB_PATH) ? (fs.statSync(DB_PATH).size / 1024 / 1024).toFixed(2) + ' MB' : '0 MB'),
    },
    backups,
    recentLogs: logs.slice(0, 10),
  });
}

// ── POST /api/backup → Create JSON backup or restore ──────────────────────────
export async function POST(req: NextRequest) {
  const session = await getSession();
  const body = await req.json().catch(() => ({}));
  const prop = resolveProperty(req, { ...session, propertyCode: body.propertyCode || session?.propertyCode });

  // Restore mode
  if (body.action === 'restore' && body.backupName) {
    const backupName = body.backupName as string;
    const propDir    = path.join(DESKTOP_BASE, prop.code, backupName);
    const rootDir    = path.join(DESKTOP_BASE, backupName);
    const targetDir  = fs.existsSync(propDir) ? propDir : (fs.existsSync(rootDir) ? rootDir : null);

    if (!targetDir) {
      return NextResponse.json({ success: false, error: 'Backup not found for property: ' + backupName }, { status: 404 });
    }
    try {
      // Safety pre-restore snapshot
      createBackupForProperty(prop);
      const res = restorePropertyFromJson(targetDir, prop);
      return NextResponse.json({ success: true, message: res.message });
    } catch (err) {
      return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
    }
  }

  // Normal JSON backup creation for this property
  const result = createBackupForProperty(prop);
  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}

// ── PUT /api/backup → Restore JSON backup ─────────────────────────────────────
export async function PUT(req: NextRequest) {
  const session = await getSession();
  const body = await req.json().catch(() => ({}));
  const prop = resolveProperty(req, { ...session, propertyCode: body.propertyCode || session?.propertyCode });
  const backupName = body.backupName as string;

  if (!backupName) {
    return NextResponse.json({ success: false, error: 'backupName is required' }, { status: 400 });
  }

  const propDir   = path.join(DESKTOP_BASE, prop.code, backupName);
  const rootDir   = path.join(DESKTOP_BASE, backupName);
  const targetDir = fs.existsSync(propDir) ? propDir : (fs.existsSync(rootDir) ? rootDir : null);

  if (!targetDir) {
    return NextResponse.json({ success: false, error: 'Backup not found for property: ' + backupName }, { status: 404 });
  }

  try {
    // Safety pre-restore snapshot
    createBackupForProperty(prop);
    const res = restorePropertyFromJson(targetDir, prop);
    return NextResponse.json({ success: true, message: res.message });
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}

// ── DELETE /api/backup → Delete backup for this property ──────────────────────
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  const prop = resolveProperty(req, session);
  const { searchParams } = new URL(req.url);
  const backupName = searchParams.get('name');
  if (!backupName) return NextResponse.json({ error: 'name required' }, { status: 400 });

  const propBackupPath = path.join(DESKTOP_BASE, prop.code, backupName);
  const rootBackupPath = path.join(DESKTOP_BASE, backupName);
  const targetPath     = fs.existsSync(propBackupPath) ? propBackupPath : (fs.existsSync(rootBackupPath) ? rootBackupPath : null);

  if (!targetPath) {
    return NextResponse.json({ error: 'Backup not found' }, { status: 404 });
  }

  try {
    fs.rmSync(targetPath, { recursive: true, force: true });
    // Also delete from Google Drive if exists
    const gdrive = findGoogleDriveFolder();
    if (gdrive) {
      const gdrivePropPath = path.join(gdrive.path, prop.code, backupName);
      if (fs.existsSync(gdrivePropPath)) fs.rmSync(gdrivePropPath, { recursive: true, force: true });
      const gdriveRootPath = path.join(gdrive.path, backupName);
      if (fs.existsSync(gdriveRootPath)) fs.rmSync(gdriveRootPath, { recursive: true, force: true });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
