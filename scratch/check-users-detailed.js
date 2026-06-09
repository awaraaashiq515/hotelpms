const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: {
      property: true
    }
  });
  console.log('--- DETAILED USERS ---');
  users.forEach(u => {
    console.log(`User: ${u.email}, PropertyName: ${u.property?.name}, PropertyCode: ${u.property?.code}, PropertyId: ${u.propertyId}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
