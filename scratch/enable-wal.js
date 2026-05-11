const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Enabling WAL mode for SQLite...');
  try {
    await prisma.$executeRawUnsafe('PRAGMA journal_mode=WAL;');
    await prisma.$executeRawUnsafe('PRAGMA synchronous=NORMAL;');
    console.log('WAL mode enabled successfully.');
  } catch (error) {
    console.error('Failed to enable WAL mode:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
