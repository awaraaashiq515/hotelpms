import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const props = await prisma.property.findMany({ select: { name: true, code: true } });
  console.log("Properties:", props);
}

main().finally(() => prisma.$disconnect());
