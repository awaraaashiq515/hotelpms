import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.posOrder.count();
  console.log('Total orders in DB:', count);

  const distinctDates = await prisma.posOrder.findMany({
    select: { createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 100
  });

  const dates = distinctDates.map(d => d.createdAt.toISOString().split('T')[0]);
  const uniqueDates = Array.from(new Set(dates));
  console.log('Unique dates in last 100 orders:', uniqueDates);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
