import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  // Get property
  const property = await prisma.property.findFirst({
    where: { code: 'MB01' }
  });

  if (!property) {
    console.error('Property MB01 not found. Please run main seed first.');
    return;
  }

  // 1. Create Tables
  const tableData = [
    { name: '101', capacity: 4 },
    { name: '102', capacity: 4 },
    { name: '103', capacity: 2 },
    { name: '201', capacity: 6 },
    { name: '202', capacity: 4 },
  ];

  console.log('Seeding Tables...');
  const createdTables = [];
  for (const t of tableData) {
    // We need a floor for the table
    let floor = await prisma.floor.findFirst({
      where: { propertyId: property.id, name: 'Ground Floor' }
    });
    
    if (!floor) {
      floor = await prisma.floor.create({
        data: {
          id: randomUUID(),
          name: 'Ground Floor',
          propertyId: property.id,
          order: 1,
          updatedAt: new Date(),
        }
      });
    }

    const table = await prisma.table.upsert({
      where: { id: `table-${t.name}` },
      update: {
        updatedAt: new Date(),
      },
      create: {
        id: `table-${t.name}`,
        name: t.name,
        capacity: t.capacity,
        propertyId: property.id,
        floorId: floor.id,
        updatedAt: new Date(),
      }
    });
    createdTables.push(table);
  }

  // 2. Create Tablets
  const tabletData = [
    { name: 'Waiter Tab 1', mode: 'WAITER' },
    { name: 'Waiter Tab 2', mode: 'WAITER' },
    { name: 'Table 101 Tab', mode: 'TABLE', tableId: 'table-101' },
    { name: 'Table 102 Tab', mode: 'TABLE', tableId: 'table-102' },
  ];

  console.log('Seeding Tablets...');
  for (const t of tabletData) {
    await prisma.tablet.upsert({
      where: { id: `tablet-${t.name.toLowerCase().replace(/\s+/g, '-')}` },
      update: {
        mode: t.mode,
        tableId: t.tableId || null,
        updatedAt: new Date(),
      },
      create: {
        id: `tablet-${t.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: t.name,
        mode: t.mode,
        propertyId: property.id,
        tableId: t.tableId || null,
        updatedAt: new Date(),
      }
    });
  }

  console.log('Tablet and Table seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
