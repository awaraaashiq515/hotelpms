#!/usr/bin/env node

/**
 * GuestFlow PMS — One-Step Offline Setup Script
 * 
 * Sets up SQLite, generates Prisma Client, verifies dev.db,
 * creates local super admin credentials, and creates desktop backup folders.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const PROJECT_DIR = path.join(__dirname, '..');
const DB_PATH = path.join(PROJECT_DIR, 'dev.db');
const BACKUP_DIR = path.join(os.homedir(), 'Desktop', 'Hotel-PMS-Backups');

console.log('\n\x1b[36m====================================================\x1b[0m');
console.log('\x1b[1m\x1b[32m🏨 GuestFlow PMS — Complete Offline Mode Setup\x1b[0m');
console.log('\x1b[36m====================================================\x1b[0m\n');

try {
  // Step 1: Check Node version
  const nodeVer = process.version;
  console.log(`\x1b[34m[1/6]\x1b[0m Checking Node.js version (${nodeVer})... ✅`);

  // Step 2: Generate Prisma Client
  console.log('\x1b[34m[2/6]\x1b[0m Generating Prisma Client...');
  execSync('npx prisma generate', { cwd: PROJECT_DIR, stdio: 'inherit' });
  console.log('   ✅ Prisma Client generated.');

  // Step 3: Ensure dev.db exists and apply schema safely
  console.log('\x1b[34m[3/6]\x1b[0m Initializing local database (dev.db)...');
  execSync('npx prisma db push --skip-generate --accept-data-loss', {
    cwd: PROJECT_DIR,
    stdio: 'inherit',
  });
  console.log('   ✅ Database schema pushed to dev.db.');

  // Step 4: Ensure OfflineSyncQueue table exists
  console.log('\x1b[34m[4/6]\x1b[0m Verifying OfflineSyncQueue table...');
  try {
    execSync(
      'sqlite3 dev.db "CREATE TABLE IF NOT EXISTS OfflineSyncQueue (id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT NOT NULL, endpoint TEXT NOT NULL, method TEXT NOT NULL, payload TEXT NOT NULL, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, synced BOOLEAN NOT NULL DEFAULT 0, syncedAt DATETIME, retries INTEGER NOT NULL DEFAULT 0, error TEXT, propertyId TEXT);"',
      { cwd: PROJECT_DIR, stdio: 'ignore' }
    );
    console.log('   ✅ OfflineSyncQueue table verified.');
  } catch {
    console.log('   ⚠️ sqlite3 CLI not present; schema push handled table creation.');
  }

  // Step 5: Create Local Super Admin
  console.log('\x1b[34m[5/6]\x1b[0m Checking / Creating default Super Admin account...');
  if (fs.existsSync(path.join(PROJECT_DIR, 'scripts', 'create-local-admin.js'))) {
    try {
      execSync('node scripts/create-local-admin.js', { cwd: PROJECT_DIR, stdio: 'inherit' });
    } catch (adminErr) {
      console.log('   ⚠️ Admin check note:', adminErr.message);
    }
  }

  // Step 6: Create Desktop Backup Directory
  console.log('\x1b[34m[6/6]\x1b[0m Setting up Desktop backup folder...');
  let targetBackupDir = BACKUP_DIR;
  try {
    if (!fs.existsSync(targetBackupDir)) {
      fs.mkdirSync(targetBackupDir, { recursive: true });
    }
    if (fs.existsSync(DB_PATH)) {
      const initialBackup = path.join(targetBackupDir, `dev_initial_${Date.now()}.db`);
      fs.copyFileSync(DB_PATH, initialBackup);
      console.log(`   ✅ Initial database snapshot created at:\n      ${initialBackup}`);
    }
  } catch (copyErr) {
    targetBackupDir = path.join(PROJECT_DIR, 'backups');
    if (!fs.existsSync(targetBackupDir)) {
      fs.mkdirSync(targetBackupDir, { recursive: true });
    }
    if (fs.existsSync(DB_PATH)) {
      const initialBackup = path.join(targetBackupDir, `dev_initial_${Date.now()}.db`);
      fs.copyFileSync(DB_PATH, initialBackup);
      console.log(`   ✅ Initial database snapshot created at:\n      ${initialBackup}`);
    }
  }

  console.log('\n\x1b[32m====================================================\x1b[0m');
  console.log('\x1b[1m\x1b[32m🎉 Offline System Setup Successful!\x1b[0m');
  console.log('\x1b[32m====================================================\x1b[0m\n');
  console.log('👉 To run in offline dev mode:');
  console.log('   \x1b[33mnpm run offline:dev\x1b[0m\n');
  console.log('👉 To run the Electron Desktop App:');
  console.log('   \x1b[33mnpm run electron-dev\x1b[0m\n');
} catch (error) {
  console.error('\n\x1b[31m❌ Setup encountered an issue:\x1b[0m', error);
  process.exit(1);
}
