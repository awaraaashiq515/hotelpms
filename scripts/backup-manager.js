#!/usr/bin/env node
/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║          Hotel PMS (GustFlow) — Backup Manager                  ║
 * ║  Isolated Multi-Tenant Database Backup → Desktop + Google Drive  ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * Usage:
 *   node scripts/backup-manager.js backup [propertyCode] - Create isolated backup
 *   node scripts/backup-manager.js start [minutes]       - Automated background service
 *   node scripts/backup-manager.js list [propertyCode]   - List backups for property
 *   node scripts/backup-manager.js restore <name> [code] - Restore property backup
 *   node scripts/backup-manager.js status [propertyCode] - View status
 */

const fs   = require('fs');
const path = require('path');
const os   = require('os');

// ─── Paths ────────────────────────────────────────────────────────────────────
const PROJECT_DIR      = path.join(__dirname, '..');
const DB_PATH          = path.join(PROJECT_DIR, 'prisma', 'dev.db');
const BACKUP_FOLDER    = 'Hotel-PMS-Backups';
const DESKTOP_BASE     = path.join(os.homedir(), 'Desktop', BACKUP_FOLDER);
const BACKUP_LOG_PATH  = path.join(PROJECT_DIR, 'scripts', 'backup-log.json');
const MAX_BACKUPS_KEEP = 30;

// ─── Google Drive Detection (macOS) ───────────────────────────────────────────
function findGoogleDriveFolder() {
  const cloudStorage = path.join(os.homedir(), 'Library', 'CloudStorage');
  if (fs.existsSync(cloudStorage)) {
    try {
      const entries = fs.readdirSync(cloudStorage);
      for (const entry of entries) {
        if (entry.startsWith('GoogleDrive-')) {
          const email   = entry.replace('GoogleDrive-', '');
          const myDrive = path.join(cloudStorage, entry, 'My Drive', BACKUP_FOLDER);
          return { path: myDrive, email };
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

function getPropertiesList() {
  try {
    const { execSync } = require('child_process');
    const output = execSync('sqlite3 prisma/dev.db "SELECT code, name, city FROM Property;"', { cwd: PROJECT_DIR, stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim();
    if (!output) return [];
    return output.split('\n').filter(Boolean).map(line => {
      const parts = line.split('|');
      return { code: parts[0], name: parts[1] || parts[0], city: parts[2] || '' };
    });
  } catch (_) {
    return [{ code: 'HTL12345', name: 'Branch / Wing Name', city: 'Mandi' }];
  }
}

// ─── Export Property to JSON ──────────────────────────────────────────────────
function exportPropertyToJson(prop) {
  const { execSync } = require('child_process');
  let propId = '';
  let orgId = '';

  try {
    const rawProp = execSync(`sqlite3 -json prisma/dev.db "SELECT id, organizationId FROM Property WHERE code = '${prop.code.replace(/[^a-zA-Z0-9_-]/g, '')}' LIMIT 1;"`, { cwd: PROJECT_DIR, stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim();
    if (rawProp) {
      const parsed = JSON.parse(rawProp);
      if (parsed[0]) {
        propId = parsed[0].id;
        orgId = parsed[0].organizationId;
      }
    }
  } catch (_) {}

  let tables = [];
  try {
    const tablesStr = execSync('sqlite3 prisma/dev.db "SELECT name FROM sqlite_master WHERE type=\'table\' AND name NOT LIKE \'sqlite_%\' AND name NOT LIKE \'_prisma%\';"', { cwd: PROJECT_DIR, stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim();
    tables = tablesStr.split('\n').filter(Boolean);
  } catch (_) {}

  const exportedData = {};
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
        colInfo = execSync(`sqlite3 prisma/dev.db "PRAGMA table_info(\\"${t}\\");"`, { cwd: PROJECT_DIR, stdio: ['pipe', 'pipe', 'ignore'] }).toString();
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
      } else {
        sql = `SELECT * FROM "${t}";`;
      }
    }

    try {
      const raw = execSync(`sqlite3 -json prisma/dev.db "${sql}"`, { cwd: PROJECT_DIR, stdio: ['pipe', 'pipe', 'ignore'] }).toString();
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
    jsonStr,
    totalRecords,
    tablesCount: Object.keys(exportedData).length,
    sizeBytes,
    sizeKB: (sizeBytes / 1024).toFixed(1) + ' KB',
  };
}

// ─── Create Backup for a Single Property (Strict Isolation in JSON) ───────────
function createBackupForProperty(prop) {
  const now       = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const dateStr   = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr   = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const bkpName   = 'backup-' + timestamp;

  const result = {
    backupName:   bkpName,
    propertyCode: prop.code,
    propertyName: prop.name,
    format:       'JSON',
    timestamp:    now.toISOString(),
    dateStr, timeStr,
    desktopPath:  null,
    gdrivePath:   null,
    gdriveEmail:  null,
    dbSizeBytes:  0,
    dbSizeMB:     '0 KB',
    success:      false,
    error:        null,
    googleDriveInstalled: false,
  };

  try {
    if (!fs.existsSync(DB_PATH)) throw new Error('Database not found: ' + DB_PATH);

    // Export property to JSON
    const exported = exportPropertyToJson(prop);
    result.dbSizeMB = exported.sizeKB;
    result.recordsCount = exported.totalRecords;
    result.tablesCount  = exported.tablesCount;

    // 1. Desktop dedicated folder: ~/Desktop/Hotel-PMS-Backups/<propertyCode>/<bkpName>
    const propDir = path.join(DESKTOP_BASE, prop.code);
    fs.mkdirSync(propDir, { recursive: true });
    const desktopBkpPath = path.join(propDir, bkpName);
    fs.mkdirSync(desktopBkpPath, { recursive: true });

    // Save Primary JSON backup file
    fs.writeFileSync(path.join(desktopBkpPath, 'hotel-data-backup.json'), exported.jsonStr, 'utf-8');

    // Save SQLite safety backup
    fs.copyFileSync(DB_PATH, path.join(desktopBkpPath, 'hotel-pms-data.db'));
    if (fs.existsSync(DB_PATH + '-wal')) fs.copyFileSync(DB_PATH + '-wal', path.join(desktopBkpPath, 'hotel-pms-data.db-wal'));
    if (fs.existsSync(DB_PATH + '-shm')) fs.copyFileSync(DB_PATH + '-shm', path.join(desktopBkpPath, 'hotel-pms-data.db-shm'));

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
      howToRestore: 'Restore directly via PMS interface or JSON restore tool.',
      locations:    { desktop: desktopBkpPath },
    };
    fs.writeFileSync(path.join(desktopBkpPath, 'backup-info.json'), JSON.stringify(infoObj, null, 2));
    result.desktopPath = desktopBkpPath;

    // 2. Google Drive backup (isolated by propertyCode in JSON)
    const gdrive = findGoogleDriveFolder();
    if (gdrive) {
      result.googleDriveInstalled = true;
      try {
        const gdrivePropDir = path.join(gdrive.path, prop.code);
        fs.mkdirSync(gdrivePropDir, { recursive: true });
        const gdriveBkpPath = path.join(gdrivePropDir, bkpName);
        fs.mkdirSync(gdriveBkpPath, { recursive: true });

        fs.writeFileSync(path.join(gdriveBkpPath, 'hotel-data-backup.json'), exported.jsonStr, 'utf-8');
        fs.copyFileSync(DB_PATH, path.join(gdriveBkpPath, 'hotel-pms-data.db'));
        if (fs.existsSync(DB_PATH + '-wal')) fs.copyFileSync(DB_PATH + '-wal', path.join(gdriveBkpPath, 'hotel-pms-data.db-wal'));
        if (fs.existsSync(DB_PATH + '-shm')) fs.copyFileSync(DB_PATH + '-shm', path.join(gdriveBkpPath, 'hotel-pms-data.db-shm'));

        infoObj.locations.googleDrive = gdriveBkpPath;
        fs.writeFileSync(path.join(gdriveBkpPath, 'backup-info.json'), JSON.stringify(infoObj, null, 2));
        result.gdrivePath  = gdriveBkpPath;
        result.gdriveEmail = gdrive.email;

        cleanOldBackups(gdrivePropDir);
      } catch (gErr) {
        log(`[${prop.code}] Google Drive backup failed: ${gErr.message}`);
      }
    }

    cleanOldBackups(propDir);
    result.success = true;
    log(`[${prop.code}] JSON Snapshot saved (${exported.sizeKB}, ${exported.totalRecords} records): ${desktopBkpPath}`);

  } catch (err) {
    result.error = err.message;
    log(`[${prop.code}] Backup FAILED: ${err.message}`);
  }

  saveLog(result);
  return result;
}

// ─── Create Backup (All or Specific Property) ─────────────────────────────────
function createBackup(propertyCode) {
  const properties = getPropertiesList();
  if (propertyCode) {
    const matched = properties.find(p => p.code.toLowerCase() === propertyCode.toLowerCase()) || {
      code: propertyCode,
      name: 'Property ' + propertyCode,
      city: '',
    };
    return createBackupForProperty(matched);
  }

  // Backup each property into its isolated folder
  let lastResult = null;
  properties.forEach(prop => {
    lastResult = createBackupForProperty(prop);
  });
  return lastResult;
}

function cleanOldBackups(dir) {
  if (!fs.existsSync(dir)) return;
  try {
    const entries = fs.readdirSync(dir)
      .filter(f => f.startsWith('backup-') && fs.statSync(path.join(dir, f)).isDirectory())
      .sort().reverse();
    if (entries.length > MAX_BACKUPS_KEEP) {
      entries.slice(MAX_BACKUPS_KEEP).forEach(e => {
        fs.rmSync(path.join(dir, e), { recursive: true, force: true });
        log('Deleted old backup: ' + e);
      });
    }
  } catch (_) {}
}

function listBackups(propertyCode) {
  const backups = [];
  const searchDir = propertyCode ? path.join(DESKTOP_BASE, propertyCode) : DESKTOP_BASE;
  if (!fs.existsSync(searchDir)) return backups;

  try {
    fs.readdirSync(searchDir)
      .filter(f => f.startsWith('backup-') && fs.statSync(path.join(searchDir, f)).isDirectory())
      .sort().reverse()
      .forEach(entry => {
        let info = {};
        try { info = JSON.parse(fs.readFileSync(path.join(searchDir, entry, 'backup-info.json'), 'utf-8')); } catch (_) {}
        backups.push({
          name:           entry,
          desktopPath:    path.join(searchDir, entry),
          timestamp:      info.timestamp || entry,
          dateStr:        info.backupDate   || '—',
          timeStr:        info.backupTime   || '—',
          dbSizeMB:       info.dbSizeMB     || '—',
          hasGoogleDrive: !!(info.locations && info.locations.googleDrive),
        });
      });
  } catch (_) {}
  return backups;
}

function restoreBackup(backupName, propertyCode) {
  let srcDb = null;
  if (propertyCode) {
    const p = path.join(DESKTOP_BASE, propertyCode, backupName, 'hotel-pms-data.db');
    if (fs.existsSync(p)) srcDb = p;
  }
  if (!srcDb) {
    const direct = path.join(DESKTOP_BASE, backupName, 'hotel-pms-data.db');
    if (fs.existsSync(direct)) srcDb = direct;
  }
  if (!srcDb) {
    // Search subfolders
    try {
      const subs = fs.readdirSync(DESKTOP_BASE);
      for (const sub of subs) {
        const candidate = path.join(DESKTOP_BASE, sub, backupName, 'hotel-pms-data.db');
        if (fs.existsSync(candidate)) {
          srcDb = candidate;
          break;
        }
      }
    } catch (_) {}
  }

  if (!srcDb || !fs.existsSync(srcDb)) {
    return { success: false, error: 'Backup not found: ' + backupName };
  }

  try {
    log('Creating safety pre-restore snapshot...');
    createBackup(propertyCode);
    fs.copyFileSync(srcDb, DB_PATH);
    if (fs.existsSync(srcDb + '-wal')) {
      fs.copyFileSync(srcDb + '-wal', DB_PATH + '-wal');
    } else if (fs.existsSync(DB_PATH + '-wal')) {
      fs.rmSync(DB_PATH + '-wal', { force: true });
    }
    if (fs.existsSync(srcDb + '-shm')) {
      fs.copyFileSync(srcDb + '-shm', DB_PATH + '-shm');
    } else if (fs.existsSync(DB_PATH + '-shm')) {
      fs.rmSync(DB_PATH + '-shm', { force: true });
    }
    log('Database restored from: ' + backupName);
    return { success: true, message: 'Database restored successfully. Please RESTART the app (npm run dev).' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function getStatus(propertyCode) {
  const gdrive  = findGoogleDriveFolder();
  const backups = listBackups(propertyCode);
  return {
    desktopBackupPath:      propertyCode ? path.join(DESKTOP_BASE, propertyCode) : DESKTOP_BASE,
    googleDriveDetected:    !!gdrive,
    googleDriveEmail:       gdrive ? gdrive.email : null,
    googleDriveBackupPath:  gdrive ? (propertyCode ? path.join(gdrive.path, propertyCode) : gdrive.path) : null,
    totalBackups:           backups.length,
    latestBackup:           backups[0] || null,
    recentLogs:             readLogs().slice(0, 5),
  };
}

function log(msg) {
  const ts = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  console.log('[' + ts + '] ' + msg);
}

function saveLog(result) {
  try {
    let logs = readLogs();
    logs.unshift(result);
    if (logs.length > 100) logs = logs.slice(0, 100);
    fs.writeFileSync(BACKUP_LOG_PATH, JSON.stringify(logs, null, 2));
  } catch (_) {}
}

function readLogs() {
  try {
    if (fs.existsSync(BACKUP_LOG_PATH)) return JSON.parse(fs.readFileSync(BACKUP_LOG_PATH, 'utf-8'));
  } catch (_) {}
  return [];
}

function startScheduler(intervalMinutes) {
  intervalMinutes = intervalMinutes || 10;
  const gdrive = findGoogleDriveFolder();
  console.log('\n======================================================');
  console.log(' Hotel PMS — Automated Multi-Tenant Backup Service');
  console.log(' Interval    : Every ' + intervalMinutes + ' minutes');
  console.log(' Desktop     : ' + DESKTOP_BASE);
  console.log(' Google Drive: ' + (gdrive ? gdrive.email : 'NOT INSTALLED'));
  console.log('======================================================\n');
  createBackup();
  setInterval(function() {
    log('Scheduled automated backup triggered');
    createBackup();
  }, intervalMinutes * 60 * 1000);
}

module.exports = { createBackup, listBackups, restoreBackup, getStatus, findGoogleDriveFolder, startScheduler, DESKTOP_BASE };

if (require.main === module) {
  const cmd = process.argv[2];
  const arg = process.argv[3];
  const extra = process.argv[4];

  if (cmd === 'backup') {
    const r = createBackup(arg);
    console.log(r && r.success ? '\nBackup created successfully: ' + r.backupName : '\nFailed: ' + (r && r.error));
    process.exit(r && r.success ? 0 : 1);
  } else if (cmd === 'start') {
    startScheduler(parseInt(arg) || 10);
  } else if (cmd === 'list') {
    const list = listBackups(arg);
    if (!list.length) { console.log('No backups found.'); }
    else {
      console.log('\nFound ' + list.length + ' backup(s):\n');
      list.forEach(function(b, i) {
        console.log('  ' + (i+1) + '. ' + (b.hasGoogleDrive ? '[G+D] ' : '[D]   ') + b.name + '  (' + b.dateStr + ' ' + b.timeStr + ', ' + b.dbSizeMB + ')');
      });
    }
  } else if (cmd === 'restore') {
    if (!arg) { console.error('Usage: node scripts/backup-manager.js restore <backup-name> [propertyCode]'); process.exit(1); }
    const r = restoreBackup(arg, extra);
    console.log(r.success ? r.message : 'Error: ' + r.error);
    process.exit(r.success ? 0 : 1);
  } else if (cmd === 'status') {
    console.log(JSON.stringify(getStatus(arg), null, 2));
  } else {
    console.log('\nHotel PMS Multi-Tenant Backup Manager:\n');
    console.log('  node scripts/backup-manager.js backup [code]         - Create snapshot for a property');
    console.log('  node scripts/backup-manager.js start [minutes]       - Automated background service');
    console.log('  node scripts/backup-manager.js list [code]           - List backups for a property');
    console.log('  node scripts/backup-manager.js restore <name> [code] - Restore property database');
    console.log('  node scripts/backup-manager.js status [code]         - View backup status\n');
  }
}
