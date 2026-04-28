import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const orders = await prisma.posOrder.findMany({
    where: {
      createdAt: {
        gte: last24Hours
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

  console.log('Orders found in last 24 hours:', orders.length);
  console.log(JSON.stringify(orders, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
