import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const properties = await prisma.property.findMany({ select: { id: true, name: true, code: true } });
  console.log('Properties:', properties);

  const passes = await prisma.poolPassCategory.findMany();
  console.log('Pool Passes in DB count:', passes.length);
  console.log('Pool Passes:', passes);
}

main().finally(() => prisma.$disconnect());
