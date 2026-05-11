import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
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

    return new PrismaClient({
      log: ['error', 'warn'],
      // @ts-ignore
      transactionOptions: {
        maxWait: 10000, // 10 seconds
        timeout: 10000, // 10 seconds
      }
    });
  })();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
