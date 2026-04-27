const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const propertyId = 'cmnzmsvxz00054lxelewobdf2';
  const kitchenWarehouse = await prisma.warehouse.findFirst({
    where: { propertyId, name: { contains: 'Kitchen' } }
  });
  const mainWarehouse = await prisma.warehouse.findFirst({
    where: { propertyId, name: 'Main Store' }
  });

  const chicken = await prisma.stockItem.findFirst({
    where: { propertyId, name: 'Chicken' }
  });

  async function getStock(warehouseId) {
    const agg = await prisma.stockMovement.aggregate({
      where: { stockItemId: chicken.id, warehouseId },
      _sum: { qtyIn: true, qtyOut: true }
    });
    return (agg._sum.qtyIn || 0) - (agg._sum.qtyOut || 0);
  }

  const mainStock = await getStock(mainWarehouse.id);
  const kitchenStock = await getStock(kitchenWarehouse.id);

  console.log(`Chicken Stock in Main Store: ${chicken.openingStock + mainStock}`); // opening stock is in main
  console.log(`Chicken Stock in Kitchen Store: ${kitchenStock}`);
  
  await prisma.$disconnect();
}
run();
