const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const email = 'posuser@gmail.com';
  console.log(`Starting sync for user: ${email}`);

  const user = await prisma.user.findUnique({
    where: { email },
    include: { property: true }
  });

  if (!user || !user.propertyId) {
    console.error('User or property not found');
    process.exit(1);
  }

  const propertyId = user.propertyId;
  console.log(`Property ID: ${propertyId}`);

  // Find all products for this property
  const products = await prisma.product.findMany({
    where: { propertyId }
  });

  console.log(`Found ${products.length} products`);

  let count = 0;
  for (const product of products) {
    // Check if a stock item already exists for this product
    let stockItem = null;
    
    // Check by name or if already linked
    if (product.stockItemId) {
      stockItem = await prisma.stockItem.findUnique({ where: { id: product.stockItemId } });
    }

    if (!stockItem) {
      // Try to find by name in the same property
      stockItem = await prisma.stockItem.findFirst({
        where: { propertyId, name: product.name }
      });
    }

    if (!stockItem) {
      // Create new stock item
      stockItem = await prisma.stockItem.create({
        data: {
          propertyId,
          name: product.name,
          sku: product.sku,
          unit: product.unit || 'PCS',
          openingStock: 0,
          reorderLevel: 5,
          isActive: true,
          costPrice: product.costPrice || 0
        }
      });
      console.log(`Created StockItem for: ${product.name}`);
    }

    // Update product to link to stock item and enable tracking
    await prisma.product.update({
      where: { id: product.id },
      data: {
        stockItemId: stockItem.id,
        trackInventory: true
      }
    });

    // Also ensure a 1-to-1 recipe exists for this if no recipe exists
    const existingRecipe = await prisma.productIngredient.findFirst({
      where: { productId: product.id }
    });

    if (!existingRecipe) {
      await prisma.productIngredient.create({
        data: {
          productId: product.id,
          stockItemId: stockItem.id,
          quantity: 1
        }
      });
    }

    count++;
  }

  console.log(`Successfully synced ${count} products to stock system.`);
  await prisma.$disconnect();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
