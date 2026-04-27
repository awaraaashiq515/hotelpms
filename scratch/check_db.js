
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const warehouses = await prisma.warehouse.findMany();
  console.log('Warehouses:', warehouses);
  
  const stockItems = await prisma.stockItem.count();
  console.log('Total Stock Items:', stockItems);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
