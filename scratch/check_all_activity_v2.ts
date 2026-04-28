import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const today = new Date('2026-04-28T00:00:00.000Z');
  
  const posOrders = await prisma.posOrder.count({
    where: { createdAt: { gte: today } }
  });
  console.log(`PosOrder: ${posOrders}`);

  const invoices = await prisma.invoice.count({
    where: { invoiceDate: { gte: today } }
  });
  console.log(`Invoice: ${invoices}`);

  const settlements = await prisma.settlement.count({
    where: { settlementDate: { gte: today } }
  });
  console.log(`Settlement: ${settlements}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
