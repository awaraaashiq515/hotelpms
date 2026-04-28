import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

  const orders = await prisma.posOrder.findMany({
    where: {
      createdAt: {
        gte: twoHoursAgo
      }
    }
  });

  console.log('Orders in last 2 hours:', orders.length);
  if (orders.length > 0) {
    console.log(JSON.stringify(orders, null, 2));
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
