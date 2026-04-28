import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const ashokaDhabaId = 'cmnfz7gms001bhef1i5muffo0';
  const orders = await prisma.posOrder.findMany({
    where: { propertyId: ashokaDhabaId },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  console.log('Latest orders for ASHOKA DHABA (id cmnfz...):');
  console.log(JSON.stringify(orders, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
