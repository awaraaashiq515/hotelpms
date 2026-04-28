import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const startDate = '2026-04-27';
  const endDate = '2026-04-27';

  const gte = new Date(`${startDate}T00:00:00.000Z`);
  const lte = new Date(`${endDate}T23:59:59.999Z`);

  console.log('Querying from:', gte.toISOString());
  console.log('Querying to:', lte.toISOString());

  const items = await prisma.posOrderItem.findMany({
    where: {
      posOrder: {
        createdAt: { gte, lte },
        status: { not: 'CANCELLED' }
      }
    }
  });

  console.log('Items found:', items.length);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
