const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orderCount = await prisma.posOrder.count();
  console.log('Total Orders:', orderCount);
  
  const statuses = await prisma.posOrder.groupBy({
    by: ['status'],
    _count: true
  });
  console.log('Order Statuses:', JSON.stringify(statuses, null, 2));

  const recentOrders = await prisma.posOrder.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: { id: true, orderNo: true, status: true, grandTotal: true, createdAt: true, propertyId: true }
  });
  console.log('Recent Orders:', JSON.stringify(recentOrders, null, 2));

  const properties = await prisma.property.findMany({
    select: { id: true, name: true }
  });
  console.log('Properties:', JSON.stringify(properties, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
