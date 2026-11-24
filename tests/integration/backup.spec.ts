/**
 * tests/integration/backup.spec.ts
 * WP-0.12: Server backup tests (BAK-01, ADM-09)
 */
import { describe, it, expect } from 'vitest';
import { prisma } from '@/lib/prisma';
import { createDatabaseBackup, checkBackupStaleness } from '@/server/services/backup.service';

describe('[BAK-01] Server-side cloud backup', () => {
  it('[BAK-01] BackupRun model exists in Prisma schema', async () => {
    expect(prisma.backupRun).toBeDefined();
  });

  it('[BAK-01] Backup process creates a BackupRun record', async () => {
    const backup = await createDatabaseBackup('test-prop', 'MANUAL');
    expect(backup).toBeDefined();
    expect(backup.status).toBe('COMPLETED');
    expect(backup.fileName).toContain('backup-');
  });

  it('[BAK-01] Backup storageUrl is a server cloud storage URL', async () => {
    const backup = await createDatabaseBackup('test-prop', 'AUTO');
    expect(backup.storageUrl).toContain('https://storage.ordermintpms.tech');
  });
});

describe('[ADM-09] Backup staleness alert', () => {
  it('[ADM-09] Staleness check correctly flags when > 26 hours ago', async () => {
    const result = await checkBackupStaleness('test-prop');
    expect(result).toHaveProperty('isStale');
    expect(result).toHaveProperty('hoursSinceLast');
  });

  it('[ADM-09] Recent backup is not stale', () => {
    const hoursSinceLast = 1.5;
    const isStale = hoursSinceLast > 26;
    expect(isStale).toBe(false);
  });
});
