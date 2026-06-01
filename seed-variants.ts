import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const property = await prisma.property.findFirst();
  if (!property) return;
  const pid = property.id;

  // Get a category
  const category = await prisma.category.findFirst({
    where: { propertyId: pid, menuType: 'CAFE', parentId: null }
  });
  if (!category) return;

  // Create a product with variants
  await prisma.product.create({
    data: {
      name: 'Caramel Macchiato',
      propertyId: pid,
      categoryId: category.id,
      productType: 'FINISHED_GOOD',
      sellingPrice: 150, // base price
      menuType: 'CAFE',
      isActive: true,
      taxType: 'INCLUSIVE',
      variants: {
        create: [
          { name: 'Regular (Small)', price: 150 },
          { name: 'Medium', price: 190 },
          { name: 'Large (Venti)', price: 230 },
        ]
      }
    }
  });

  console.log('Successfully seeded Caramel Macchiato with Variants (Small, Medium, Large)!');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
