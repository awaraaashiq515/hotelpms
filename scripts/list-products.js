const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    select: { id: true, name: true, sellingPrice: true, propertyId: true }
  });
  console.log('Products:', products);
}

main().catch(err => console.error(err));
