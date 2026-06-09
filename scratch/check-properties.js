const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const props = await prisma.property.findMany();
  console.log('--- PROPERTIES ---');
  props.forEach(p => {
    console.log(`Property: ${p.name}, Code: ${p.code}, ID: ${p.id}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
