const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const propertyId = 'cmo48ezds0002rcayzy0unlkp';
  const tables = await prisma.table.findMany({
    where: { propertyId: propertyId }
  });

  console.log('Tables for test property:');
  tables.forEach(t => {
    console.log(`- Name: ${t.name}, ID: ${t.id}, QRToken: ${t.qrToken}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
