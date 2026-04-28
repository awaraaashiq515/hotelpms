import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const count = await (prisma as any).order.count();
  console.log('Total entries in Order table:', count);

  const latest = await (prisma as any).order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log('Latest in Order table:', JSON.stringify(latest, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
