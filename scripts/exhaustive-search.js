const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const token = 'zuyidjziquavuuuxw9vxl9i';
  const table = await prisma.table.findFirst({
    where: {
      OR: [
        { qrToken: token },
        { id: token }
      ]
    },
    include: { property: true }
  });

  if (table) {
    console.log('TABLE FOUND!');
    console.log('Property Code in DB:', table.property.code);
    console.log('Property ID in DB:', table.property.id);
  } else {
    console.log('TABLE NOT FOUND IN ANY PROPERTY');
    
    // List all tables to see what tokens we actually have
    const allTables = await prisma.table.findMany({
      include: { property: true }
    });
    console.log('All Tables in DB:', allTables.map(t => ({ name: t.name, token: t.qrToken, propCode: t.property.code })));
  }
}

main().finally(() => prisma.$disconnect());
