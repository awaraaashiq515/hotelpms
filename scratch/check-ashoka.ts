import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const properties = await prisma.property.findMany();
  console.log('--- All Properties ---');
  properties.forEach(p => {
    console.log(`ID: ${p.id}, Name: ${p.name}, Code: ${p.code}, upiId: ${p.upiId}, upiName: ${p.upiName}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
