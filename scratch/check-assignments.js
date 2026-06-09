const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const staff = await prisma.user.findMany({
    where: { email: { endsWith: '@pos-staff.local' } },
    include: {
      tableAssignments: {
        include: {
          table: true
        }
      }
    }
  });
  console.log('--- STAFF ASSIGNMENTS ---');
  staff.forEach(s => {
    console.log(`Staff: ${s.email}`);
    console.log(`Assignments (${s.tableAssignments.length}):`);
    s.tableAssignments.forEach(ta => {
      console.log(`  - Table: ${ta.table?.name} (ID: ${ta.tableId})`);
    });
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
