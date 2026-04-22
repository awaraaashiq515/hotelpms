const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const qrToken = 'zuyidjziquavuuuxw9vxl9i';
  const table = await prisma.table.findFirst({
    where: {
      OR: [
        { qrToken: qrToken },
        { id: qrToken }
      ]
    },
    include: { property: true }
  });

  if (table) {
    console.log('FOUND TABLE!');
    console.log('Table Name:', table.name);
    console.log('Property Name:', table.property.name);
    console.log('Property Code:', table.property.code);
  } else {
    console.log('TABLE NOT FOUND ANYWHERE');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
