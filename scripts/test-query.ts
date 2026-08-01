import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const propertyId = 'cmrj1ce750002w4d6dbaqakk7'; // hotel123 propertyId

  console.log('Query 1 - strictly where: { propertyId }');
  const q1 = await prisma.poolPassCategory.findMany({ where: { propertyId } });
  console.log('Q1 count:', q1.length);

  console.log('Query 2 - where: { OR: [{ propertyId }, { propertyId: null }] }');
  const q2 = await prisma.poolPassCategory.findMany({
    where: {
      OR: [
        { propertyId },
        { propertyId: null }
      ]
    }
  });
  console.log('Q2 count:', q2.length);

  console.log('Query 3 - ALL passes without where filter');
  const q3 = await prisma.poolPassCategory.findMany();
  console.log('Q3 count:', q3.length);
}

main().finally(() => prisma.$disconnect());
