const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function checkRole() {
  const roles = await prisma.role.findMany();
  console.log("All roles:", roles.map(r => r.name));
  
  const adminUsers = await prisma.user.findMany({
    include: { role: true },
    where: { role: { name: 'ADMIN' } }
  });
  console.log("Users with ADMIN role:", adminUsers.length);
  
  const restAdminUsers = await prisma.user.findMany({
    include: { role: true },
    where: { role: { name: 'RESTAURANTS_ADMIN' } }
  });
  console.log("Users with RESTAURANTS_ADMIN role:", restAdminUsers.length);
}
checkRole()
  .then(() => process.exit(0))
  .catch(e => { console.error(e); process.exit(1); });
