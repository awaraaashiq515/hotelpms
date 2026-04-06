const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function fixRole() {
  const adminRole = await prisma.role.findFirst({ where: { name: 'ADMIN' } });
  if (adminRole) {
    await prisma.role.update({
      where: { id: adminRole.id },
      data: { name: 'RESTAURANTS_ADMIN' }
    });
    console.log("Fixed role ADMIN to RESTAURANTS_ADMIN");
  } else {
    console.log("No ADMIN role found, already RESTAURANTS_ADMIN?");
  }
}
fixRole().catch(console.error).finally(() => prisma.$disconnect());
