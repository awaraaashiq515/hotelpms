const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: { role: true, organization: true }
  });
  console.log('--- USERS ---');
  users.forEach(u => {
    console.log(`User: ${u.email}, Role: ${u.role?.name}, OrgId: ${u.organizationId}, OrgName: ${u.organization?.name}`);
  });
  
  const roles = await prisma.role.findMany();
  console.log('--- ROLES ---');
  roles.forEach(r => {
    console.log(`Role: ${r.name}`);
  });
}

main().finally(() => prisma.$disconnect());
