import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const statuses = await prisma.posOrder.groupBy({
    by: ['status'],
    _count: { id: true }
  });

  console.log('Order status counts:');
  console.log(JSON.stringify(statuses, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
