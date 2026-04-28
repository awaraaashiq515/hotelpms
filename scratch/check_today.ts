import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const startOfToday = new Date('2026-04-28T00:00:00.000Z');
  const endOfToday = new Date('2026-04-28T23:59:59.999Z');

  const ordersToday = await prisma.posOrder.findMany({
    where: {
      createdAt: {
        gte: startOfToday,
        lte: endOfToday
      }
    },
    select: {
      id: true,
      orderNo: true,
      status: true,
      grandTotal: true,
      createdAt: true,
      propertyId: true
    }
  });

  console.log('Orders found for 2026-04-28 (UTC):', ordersToday.length);
  console.log(JSON.stringify(ordersToday, null, 2));

  // Also check without the year 2026? Wait, the year in metadata is 2026.
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
