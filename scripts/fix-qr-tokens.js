const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tables = await prisma.table.findMany({
    where: { qrToken: null }
  });

  console.log(`Found ${tables.length} tables with null qrToken. Updating...`);

  for (const table of tables) {
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    await prisma.table.update({
      where: { id: table.id },
      data: { qrToken: token }
    });
  }

  console.log('All tables updated with unique qrTokens.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
