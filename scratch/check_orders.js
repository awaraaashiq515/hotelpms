const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const orders = await prisma.posOrder.findMany({
    where: { propertyId: 'cmnzmsvxz00054lxelewobdf2' },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { items: true }
  });
  console.log('Recent Orders:', JSON.stringify(orders, null, 2));
  await prisma.$disconnect();
}
run();
