import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const property = await prisma.property.findFirst();
  if (!property) {
    console.error('No property found!');
    return;
  }
  const pid = property.id;

  // 1. Create Main Category
  const mainCat = await prisma.category.create({
    data: {
      name: 'Cafe Beverages',
      description: 'All types of cafe beverages',
      propertyId: pid,
      menuType: 'CAFE',
      isActive: true,
    }
  });

  // 2. Create Subcategories
  const hotCoffee = await prisma.category.create({
    data: {
      name: 'Hot Coffee',
      parentId: mainCat.id,
      propertyId: pid,
      menuType: 'CAFE',
      isActive: true,
    }
  });

  const coldBrews = await prisma.category.create({
    data: {
      name: 'Cold Brews',
      parentId: mainCat.id,
      propertyId: pid,
      menuType: 'CAFE',
      isActive: true,
    }
  });

  // 3. Find some existing CAFE products or create new ones
  const products = [
    { name: 'Espresso', catId: hotCoffee.id, price: 120 },
    { name: 'Cappuccino', catId: hotCoffee.id, price: 150 },
    { name: 'Latte', catId: hotCoffee.id, price: 160 },
    { name: 'Iced Americano', catId: coldBrews.id, price: 140 },
    { name: 'Cold Mocha', catId: coldBrews.id, price: 180 },
    { name: 'Frappuccino', catId: coldBrews.id, price: 200 },
  ];

  for (const p of products) {
    await prisma.product.create({
      data: {
        name: p.name,
        propertyId: pid,
        categoryId: p.catId,
        productType: 'FINISHED_GOOD',
        sellingPrice: p.price,
        menuType: 'CAFE',
        isActive: true,
        taxType: 'INCLUSIVE',
      }
    });
  }

  console.log('Successfully seeded Cafe Beverages, subcategories, and products!');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
