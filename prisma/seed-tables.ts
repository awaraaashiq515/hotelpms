import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const property = await prisma.property.findFirst();
  if (!property) {
    console.error('No property found. Please seed properties first.');
    return;
  }

  const outlet = await prisma.outlet.findFirst({ where: { propertyId: property.id } });
  
  // Create Floors
  const floor1 = await prisma.floor.create({
    data: {
      name: 'Ground Floor',
      propertyId: property.id,
      outletId: outlet?.id,
      order: 1,
    },
  });

  const floor2 = await prisma.floor.create({
    data: {
      name: 'First Floor',
      propertyId: property.id,
      outletId: outlet?.id,
      order: 2,
    },
  });

  // Create Tables for Ground Floor
  const tableData1 = [
    { name: 'T1', capacity: 2, x: 100, y: 100 },
    { name: 'T2', capacity: 4, x: 250, y: 100 },
    { name: 'T3', capacity: 4, x: 400, y: 100 },
    { name: 'T4', capacity: 6, x: 100, y: 250 },
    { name: 'T5', capacity: 2, x: 250, y: 250 },
  ];

  for (const t of tableData1) {
    await prisma.table.create({
      data: {
        ...t,
        floorId: floor1.id,
        propertyId: property.id,
      },
    });
  }

  // Create Tables for First Floor
  const tableData2 = [
    { name: 'VIP 1', capacity: 8, x: 150, y: 150 },
    { name: 'VIP 2', capacity: 8, x: 350, y: 150 },
  ];

  for (const t of tableData2) {
    await prisma.table.create({
      data: {
        ...t,
        floorId: floor2.id,
        propertyId: property.id,
      },
    });
  }

  console.log('Seeding finished!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
