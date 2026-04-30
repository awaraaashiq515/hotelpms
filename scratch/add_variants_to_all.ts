
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    include: { variants: true }
  });

  console.log(`Found ${products.length} products.`);

  for (const product of products) {
    if (product.variants.length > 0) {
      console.log(`Skipping ${product.name}, already has variants.`);
      continue;
    }

    console.log(`Adding variants to ${product.name}...`);
    
    const basePrice = product.sellingPrice;
    
    await prisma.productVariant.createMany({
      data: [
        { productId: product.id, name: 'Small', price: basePrice },
        { productId: product.id, name: 'Medium', price: basePrice + 20 },
        { productId: product.id, name: 'Large', price: basePrice + 50 },
      ]
    });
  }

  console.log('Done!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
