const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const property = await prisma.property.findFirst({
    where: { users: { some: { email: 'posuser@gmail.com' } } }
  });
  if (!property) return;

  const items = await prisma.stockItem.findMany({
    where: { propertyId: property.id, name: { contains: 'Chicken' } }
  });

  const products = await prisma.product.findMany({
    where: { propertyId: property.id, name: { contains: 'Chicken' } }
  });

  console.log('Items:', JSON.stringify(items, null, 2));
  console.log('Products:', JSON.stringify(products, null, 2));
  await prisma.$disconnect();
}
run();
