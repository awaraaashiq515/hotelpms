import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const latestOrders = await prisma.posOrder.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      orderNo: true,
      status: true,
      grandTotal: true,
      createdAt: true
    }
  });

  console.log(JSON.stringify(latestOrders, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
