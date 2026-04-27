const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const recipe = await prisma.productIngredient.findMany({
    where: { productId: 'cmocnarhf0005lxzih9rmyttt' },
    include: { stockItem: true }
  });
  console.log('Recipe for Chicken Product:', JSON.stringify(recipe, null, 2));

  const movements = await prisma.stockMovement.findMany({
    where: { stockItemId: 'cmocmaatt000110tqzlheesil' },
    orderBy: { movementDate: 'desc' },
    take: 5
  });
  console.log('Last 5 movements for Chicken Stock:', JSON.stringify(movements, null, 2));
  
  await prisma.$disconnect();
}
run();
