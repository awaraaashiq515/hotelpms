import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const outlets = await prisma.outlet.findMany();
  console.log('--- OUTLETS ---');
  console.log(outlets);

  const floors = await prisma.floor.findMany({
    include: { outlet: true }
  });
  console.log('--- FLOORS ---');
  console.log(floors);
}

main().catch(console.error).finally(() => prisma.$disconnect());
