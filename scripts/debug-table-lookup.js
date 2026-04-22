const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const propertyCode = 'test-nlkp';
  const qrToken = 'zuyidjziquavuuuxw9vxl9i';

  console.log('--- Debugging Table Lookup ---');
  console.log('Searching for property with code:', propertyCode);
  const property = await prisma.property.findUnique({
    where: { code: propertyCode }
  });

  if (!property) {
    console.log('FAILED: Property not found');
    return;
  }
  console.log('SUCCESS: Property found:', property.id, property.name);

  console.log('Searching for table with token/id:', qrToken, 'and propertyId:', property.id);
  const table = await prisma.table.findFirst({
    where: {
      OR: [
        { qrToken: qrToken },
        { id: qrToken }
      ],
      propertyId: property.id
    }
  });

  if (!table) {
    console.log('FAILED: Table not found in this property');
    
    // Check if table exists AT ALL in any property
    const anyTable = await prisma.table.findFirst({
      where: {
        OR: [
          { qrToken: qrToken },
          { id: qrToken }
        ]
      },
      include: { property: true }
    });
    
    if (anyTable) {
      console.log('TABLE EXISTS BUT IN DIFFERENT PROPERTY!');
      console.log('Current Table Property:', anyTable.property.name, '(', anyTable.property.id, ')');
      console.log('Expected Property:', property.name, '(', property.id, ')');
    } else {
      console.log('TABLE DOES NOT EXIST AT ALL IN DB');
    }
  } else {
    console.log('SUCCESS: Table found:', table.id, table.name);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
