import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const drivers = await prisma.driver.findMany({ include: { offerProgresses: { include: { offer: true } }, offerHistories: true } });
  console.dir(drivers, { depth: null });
}
main();
