#!/usr/bin/env node
/**
 * GuestFlow PMS — Offline Backup Script
 * Phase 5+6: Auto-Backup on Power Return + Database Auto-Copy
 *
 * Usage:
 *   node scripts/offline-backup.js backup           — run one backup now
 *   node scripts/offline-backup.js start            — run every 30 min indefinitely
 *   node scripts/offline-backup.js restore <file>   — restore from a backup file
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');

// ─── Paths ───────────────────────────────────────────────────────────────────

const PROJECT_ROOT  = path.resolve(__dirname, '..');
const DB_PATH       = path.join(PROJECT_ROOT, 'dev.db');
const HOME          = os.homedir();
const DESKTOP       = path.join(HOME, 'Desktop');
const FALLBACK_DIR  = path.join(PROJECT_ROOT, 'backups', 'offline');
let   LOCAL_BACKUP  = path.join(DESKTOP, 'Hotel-PMS-Backups', 'offline');
let   LOG_DIR       = path.join(PROJECT_ROOT, 'logs');
let   LOG_FILE      = path.join(LOG_DIR, 'backup.log');
const GDRIVE_ROOT   = path.join(HOME, 'Library', 'CloudStorage');
const INTERVAL_MS   = 30 * 60 * 1000; // 30 minutes

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ensureDir(dir) {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return true;
  } catch (err) {
    return false;
  }
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
}

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try {
    ensureDir(LOG_DIR);
    fs.appendFileSync(LOG_FILE, line + '\n', 'utf8');
  } catch (e) {
    // If we cannot write the log, don't crash the backup
    console.error('  (log write failed:', e.message, ')');
  }
}

/**
 * Find the first Google Drive folder in ~/Library/CloudStorage.
 * Returns the path, or null if not found.
 */
function findGoogleDrive() {
  if (!fs.existsSync(GDRIVE_ROOT)) return null;
  try {
    const entries = fs.readdirSync(GDRIVE_ROOT);
    const drive = entries.find(e => e.startsWith('GoogleDrive-'));
    if (!drive) return null;
    const drivePath = path.join(GDRIVE_ROOT, drive);
    // Prefer "My Drive" subfolder if it exists
    const myDrive = path.join(drivePath, 'My Drive');
    return fs.existsSync(myDrive) ? myDrive : drivePath;
  } catch (e) {
    return null;
  }
}

/**
 * Copy src to dest, creating parent dirs as needed.
 * Returns true on success, false on failure.
 */
function copyFile(src, dest) {
  try {
    ensureDir(path.dirname(dest));
    fs.copyFileSync(src, dest);
    return true;
  } catch (e) {
    log(`  ERROR copying to ${dest}: ${e.message}`);
    return false;
  }
}

// ─── Core: backup ────────────────────────────────────────────────────────────

function runBackup() {
  log('=== Starting offline backup ===');

  // 1. Verify source DB exists
  if (!fs.existsSync(DB_PATH)) {
    log(`SKIP: DB not found at ${DB_PATH}`);
    return false;
  }

  const dbSize = fs.statSync(DB_PATH).size;
  log(`Source: ${DB_PATH} (${(dbSize / 1024).toFixed(1)} KB)`);

  const ts       = timestamp();
  const fileName = `dev_${ts}.db`;
  let   success  = false;

  // 2. Copy to Desktop/Hotel-PMS-Backups/offline/ (or project fallback)
  if (!ensureDir(LOCAL_BACKUP)) {
    LOCAL_BACKUP = FALLBACK_DIR;
    ensureDir(LOCAL_BACKUP);
  }
  const localDest = path.join(LOCAL_BACKUP, fileName);
  if (copyFile(DB_PATH, localDest)) {
    log(`✓ Local backup: ${localDest}`);
    success = true;
    pruneOldBackups(LOCAL_BACKUP, 20);
  }

  // 3. Copy to Google Drive if available
  const gdrive = findGoogleDrive();
  if (gdrive) {
    const gdriveBackupDir = path.join(gdrive, 'Hotel-PMS-Backups', 'offline');
    const gdriveDest      = path.join(gdriveBackupDir, fileName);
    if (copyFile(DB_PATH, gdriveDest)) {
      log(`✓ Google Drive backup: ${gdriveDest}`);
    }
  } else {
    log('  Google Drive not found — skipping cloud copy');
  }

  log('=== Backup complete ===');
  return success;
}

/**
 * Remove oldest backups, keeping only `keep` most recent files.
 */
function pruneOldBackups(dir, keep) {
  try {
    const files = fs.readdirSync(dir)
      .filter(f => f.endsWith('.db'))
      .map(f => ({ name: f, mtime: fs.statSync(path.join(dir, f)).mtime.getTime() }))
      .sort((a, b) => b.mtime - a.mtime);

    files.slice(keep).forEach(f => {
      try {
        fs.unlinkSync(path.join(dir, f.name));
        log(`  Pruned old backup: ${f.name}`);
      } catch (_) {}
    });
  } catch (_) {}
}

// ─── Core: restore ───────────────────────────────────────────────────────────

function runRestore(backupFile) {
  if (!backupFile) {
    console.error('Usage: node scripts/offline-backup.js restore <path-to-backup.db>');
    process.exit(1);
  }

  const src = path.resolve(backupFile);
  if (!fs.existsSync(src)) {
    console.error(`File not found: ${src}`);
    process.exit(1);
  }

  // Safety: archive the current DB first
  const safetyName = `dev_before-restore_${timestamp()}.db`;
  const safetyDest = path.join(LOCAL_BACKUP, safetyName);
  if (fs.existsSync(DB_PATH)) {
    ensureDir(LOCAL_BACKUP);
    fs.copyFileSync(DB_PATH, safetyDest);
    log(`Safety copy: ${safetyDest}`);
  }

  // Overwrite live DB with backup
  fs.copyFileSync(src, DB_PATH);
  log(`✓ Restored ${src} → ${DB_PATH}`);
  console.log(`Database restored from: ${src}`);
  console.log(`Previous DB saved to: ${safetyDest}`);
}

// ─── Core: start (interval loop) ─────────────────────────────────────────────

function runStart() {
  log('Auto-backup started (every 30 minutes)');
  console.log('GuestFlow PMS — Auto-backup running. Press Ctrl+C to stop.');

  // Run immediately on start
  runBackup();

  // Then every 30 minutes
  setInterval(() => {
    runBackup();
  }, INTERVAL_MS);

  // Keep process alive
  process.stdin.resume();

  // Graceful shutdown
  process.on('SIGINT',  () => { log('Auto-backup stopped (SIGINT)');  process.exit(0); });
  process.on('SIGTERM', () => { log('Auto-backup stopped (SIGTERM)'); process.exit(0); });
}

// ─── Entry point ─────────────────────────────────────────────────────────────

const [,, command, ...args] = process.argv;

switch (command) {
  case 'backup':
    runBackup();
    break;

  case 'start':
    runStart();
    break;

  case 'restore':
    runRestore(args[0]);
    break;

  default:
    console.log(`
GuestFlow PMS — Offline Backup Utility

Usage:
  node scripts/offline-backup.js backup             Run one backup now
  node scripts/offline-backup.js start              Auto-backup every 30 minutes
  node scripts/offline-backup.js restore <file>     Restore database from backup

Backup locations:
  Local  : ~/Desktop/Hotel-PMS-Backups/offline/
  Drive  : ~/Library/CloudStorage/GoogleDrive-*/My Drive/Hotel-PMS-Backups/offline/
  Logs   : ~/Library/Application Support/GuestFlow/logs/backup.log
`);
    break;
}
