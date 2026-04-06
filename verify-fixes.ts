import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Verifying Database Integrity ---');
  
  const properties = await prisma.property.findMany();
  console.log(`Found ${properties.length} properties.`);
  
  const drivers = await prisma.driver.findMany();
  console.log(`Found ${drivers.length} drivers.`);
  
  const offers = await prisma.offer.findMany();
  console.log(`Found ${offers.length} offers.`);
  
  const floors = await prisma.floor.findMany();
  console.log(`Found ${floors.length} floors.`);

  console.log('\n--- Verifying Data Mapping ---');
  if (properties.length > 0) {
    const prop = properties[0];
    const propDrivers = await prisma.driver.findMany({ where: { propertyId: prop.id } });
    console.log(`Property "${prop.name}" (${prop.id}) has ${propDrivers.length} drivers.`);
  }

  console.log('\n--- Checking for Potential Prisma Error Triggers ---');
  try {
     // This was the crashing query
     const openOrders = await (prisma as any).posOrder.findMany({
       where: { 
         propertyId: 'non-existent-id', // Simulating the null/bad ID case
         status: { in: ['OPEN', 'PENDING', 'PLACED', 'IN_KITCHEN', 'READY', 'BILL_PRINTED'] }
       }
     });
     console.log('Successfully ran posOrder query with non-existent ID (Returns empty list, no crash).');
  } catch (e) {
     console.error('Crash detected in posOrder query:', e);
  }

  process.exit(0);
}

main();
