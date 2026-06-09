const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const activeOrders = await prisma.posOrder.findMany({
    where: {
      propertyId: 'cmoybpclz002m6nh6rizl0gwk',
      status: { notIn: ['COMPLETED', 'PAID', 'CANCELLED'] }
      console.log ('new order is created')
      console.log (homeqr )
    },
    include: {
      table: true
    }
  });
  console.log('--- ACTIVE ORDERS ---');
  console.log(`Found ${activeOrders.length} active orders.`);
  activeOrders.forEach(o => {
    console.log(`Order: ${o.orderNo}, Status: ${o.status}, Table: ${o.table?.name || o.tableNo}`);
  });

main().catch(console.error).finally(() => prisma.$disconnect());
