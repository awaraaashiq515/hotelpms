import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const property = await prisma.property.findFirst();
  if (!property) return;

  let category = await prisma.category.findFirst({
    where: { propertyId: property.id, menuType: 'CAFE' }
  });

  if (!category) {
    category = await prisma.category.create({
      data: {
        name: 'Premium Coffee',
        propertyId: property.id,
        menuType: 'CAFE',
        isActive: true,
      }
    });
  }

  await prisma.product.create({
    data: {
      name: 'Caramel Macchiato',
      description: 'Freshly brewed espresso with steamed milk and vanilla-flavored syrup, topped with caramel drizzle.',
      categoryId: category.id,
      propertyId: property.id,
      menuType: 'CAFE',
      productType: 'REVENUE',
      sellingPrice: 250,
      costPrice: 80,
      taxRate: 5,
      taxType: 'EXCLUSIVE',
      isActive: true,
      variants: {
        create: [
          { name: 'Tall (Small)', price: 250 },
          { name: 'Grande (Medium)', price: 320 },
          { name: 'Venti (Large)', price: 380 },
        ]
      }
    }
  });

  await prisma.product.create({
    data: {
      name: 'Iced Hazelnut Latte',
      description: 'Chilled espresso, milk, and hazelnut syrup served over ice.',
      categoryId: category.id,
      propertyId: property.id,
      menuType: 'CAFE',
      productType: 'REVENUE',
      sellingPrice: 220,
      costPrice: 70,
      taxRate: 5,
      taxType: 'EXCLUSIVE',
      isActive: true,
      variants: {
        create: [
          { name: 'Regular', price: 220 },
          { name: 'Large', price: 280 },
        ]
      }
    }
  });

  console.log('Seeded 2 Cafe Products with Variants!');
}

main().finally(async () => {
  await prisma.$disconnect();
});
