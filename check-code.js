const { PrismaClient } = require('@prisma/client');
const { ApiError } = require('next/dist/server/api-utils');
const prisma = new PrismaClient();

async function main() {
  const code = 'TEST';
  const p = await prisma.property.findUnique({ where: { code } });
  console.log(`Property with code ${code}:`, p ? 'EXISTS' : 'NOT FOUND');
}

main().finally(() => prisma.$disconnect());
