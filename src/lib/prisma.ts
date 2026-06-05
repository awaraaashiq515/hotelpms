import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Invalidate stale cached client in development if new models are missing
if (globalForPrisma.prisma && (
  !(globalForPrisma.prisma as any).staffLocationSettings ||
  !(globalForPrisma.prisma as any).tableAssignment
)) {
  globalForPrisma.prisma = undefined;
}


export const prisma =
  globalForPrisma.prisma ??
  (() => {
    if (typeof window !== 'undefined') return undefined as any;
    
    // Check if we are in a build environment without a database
    if (!process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
      console.warn('DATABASE_URL is not set. Prisma client will be initialized with a dummy URL for build purposes.');
      return new PrismaClient({
        datasources: {
          db: {
            url: 'postgresql://dummy:dummy@localhost:5432/dummy'
          }
        },
        log: ['error'],
      });
    }

    const client = new PrismaClient({
      log: ['error', 'warn'],
    });

    // --- SQLite Optimization for Multi-Device Environments ---
    if (process.env.DATABASE_URL?.includes('sqlite') || !process.env.DATABASE_URL) {
      // Enable WAL mode and increase busy timeout to handle concurrent access
      (async () => {
        try {
          await client.$executeRawUnsafe('PRAGMA journal_mode=WAL;');
          await client.$executeRawUnsafe('PRAGMA busy_timeout=5000;');
          console.log('SQLite: WAL mode and busy_timeout (5s) enabled for better performance.');
        } catch (e) {
          console.error('Failed to set SQLite pragmas:', e);
        }
      })();
    }

    return client;
  })();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
