const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const property = await prisma.property.findFirst({
    where: { users: { some: { email: 'posuser@gmail.com' } } }
  });
  if (!property) return;

  const warehouses = await prisma.warehouse.findMany({
    where: { propertyId: property.id }
  });
  console.log('Warehouses:', JSON.stringify(warehouses, null, 2));

  // Check if there are any recent movements
  const movements = await prisma.stockMovement.findMany({
    where: { propertyId: property.id },
    orderBy: { movementDate: 'desc' },
    take: 10,
    include: { stockItem: true, warehouse: true }
  });
  console.log('Recent Movements:', JSON.stringify(movements, null, 2));

  await prisma.$disconnect();
}
run();
