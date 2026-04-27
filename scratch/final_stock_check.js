const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const propertyId = 'cmnzmsvxz00054lxelewobdf2';
  const items = await prisma.stockItem.findMany({
    where: { propertyId, name: { in: ['Chicken', 'P Mark oil'] } }
  });

  for (const item of items) {
    const agg = await prisma.stockMovement.aggregate({
      where: { stockItemId: item.id },
      _sum: { qtyIn: true, qtyOut: true }
    });
    const currentStock = (agg._sum.qtyIn || 0) - (agg._sum.qtyOut || 0);
    console.log(`${item.name}: OpeningField=${item.openingStock}, CalcStock=${currentStock}`);
  }
  
  await prisma.$disconnect();
}
run();
