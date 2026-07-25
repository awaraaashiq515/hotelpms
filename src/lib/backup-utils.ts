import { prisma } from './prisma';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execPromise = promisify(exec);

/**
 * Generates a comprehensive JSON backup for an organization or property.
 * Used by the dashboard to send backups via email.
 */
export async function generateBackupData(organizationId: string, propertyId?: string) {
  try {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        users: { select: { id: true, fullName: true, email: true, roleId: true } },
        guests: true,
        properties: {
          where: propertyId ? { id: propertyId } : undefined,
          include: {
            categories: { include: { products: true } },
            posOrders: { include: { items: true } },
            invoices: { include: { items: true } },
            accounts: true,
            shifts: true,
          }
        }
      }
    });

    return organization;
  } catch (error) {
    console.error('Data backup generation failed:', error);
    return null;
  }
}

/**
 * Creates a local database dump (SQLite file) and prepares it for cloud upload.
 */
export async function createDatabaseBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFilename = `db-dump-${timestamp}.sqlite`;
  const backupPath = path.join(process.cwd(), 'backups', backupFilename);

  if (!fs.existsSync(path.join(process.cwd(), 'backups'))) {
    fs.mkdirSync(path.join(process.cwd(), 'backups'));
  }

  try {
    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, backupPath);
      return backupPath;
    }
    throw new Error('Database file not found');
  } catch (error) {
    console.error('SQLite backup failed:', error);
    throw error;
  }
}

/**
 * Uploads a file to a cloud provider.
 * Placeholder for AWS S3 / Google Cloud Storage integration.
 */
export async function uploadToCloud(filePath: string) {
  const filename = path.basename(filePath);
  console.log(`[CLOUD] Uploading ${filename} to Cloud Storage...`);
  
  // Example AWS S3 Logic (Needs @aws-sdk/client-s3)
  /*
  const client = new S3Client({ region: process.env.AWS_REGION });
  const upload = new Upload({
    client,
    params: {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `backups/${filename}`,
      Body: fs.createReadStream(filePath),
    },
  });
  await upload.done();
  */

  // Mock Success
  return { success: true, provider: 'AWS S3 (Mock)', url: `s3://backups/${filename}` };
}

/**
 * Full backup workflow: Create -> Upload -> Cleanup Local
 */
export async function runFullBackupWorkflow() {
  try {
    const backupPath = await createDatabaseBackup();
    const uploadResult = await uploadToCloud(backupPath);
    
    // Optional: Cleanup local backup after upload to save space
    // fs.unlinkSync(backupPath);
    
    return { ...uploadResult };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
