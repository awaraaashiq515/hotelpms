import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const today = new Date('2026-04-28T00:00:00.000Z');
  
  // Check common tables for any activity today
  const tables = ['posOrder', 'invoice', 'settlement', 'payment', 'kotTicket'];
  
  for (const table of tables) {
    const count = await (prisma as any)[table].count({
      where: {
        createdAt: { gte: today }
      }
    });
    console.log(`Table ${table} has ${count} records from today.`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
