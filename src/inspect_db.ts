import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const properties = await prisma.property.findMany({ take: 5 });
  const categories = await prisma.category.findMany({ take: 5 });

  console.log('--- PROPERTIES ---');
  console.log(JSON.stringify(properties, null, 2));
  console.log('--- CATEGORIES ---');
  console.log(JSON.stringify(categories, null, 2));

  await prisma.$disconnect();
}

main().catch(console.error);
