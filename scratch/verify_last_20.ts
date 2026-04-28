import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const allOrders = await prisma.posOrder.findMany({
    select: { createdAt: true, orderNo: true, status: true, grandTotal: true },
    orderBy: { createdAt: 'desc' },
    take: 20
  });

  console.log('Last 20 orders in DB:');
  console.table(allOrders.map(o => ({
    ...o,
    createdAt: o.createdAt.toISOString()
  })));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
