const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const drivers = await prisma.driver.findMany({
    include: {
      property: true
    }
  });
  console.log('Total drivers:', drivers.length);
  drivers.forEach(d => {
    console.log(`Driver: ${d.name}, Property: ${d.property.name} (${d.propertyId})`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
