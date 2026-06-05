import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('--- USERS ---');
  const users = await prisma.user.findMany({
    select: {
      id: true,
      fullName: true,
      email: true,
      isActive: true,
      propertyId: true,
      role: { select: { name: true } },
      tableAssignments: {
        select: {
          id: true,
          tableId: true,
          propertyId: true,
          table: { select: { name: true } }
        }
      }
    }
  });
  console.dir(users, { depth: null });

  console.log('\n--- ACTIVE POS ORDERS ---');
  const activeOrders = await prisma.posOrder.findMany({
    where: {
      status: {
        in: ['OPEN', 'PENDING', 'PLACED', 'ACCEPTED', 'IN_KITCHEN', 'READY', 'SERVED', 'BILL_PRINTED', 'KOT_RUNNING', 'HOLD', 'PAYMENT_AWAITING_APPROVAL']
      }
    },
    select: {
      id: true,
      orderNo: true,
      orderType: true,
      tableNo: true,
      propertyId: true,
      restaurantTableId: true,
      status: true,
      grandTotal: true,
      createdAt: true,
      table: { select: { name: true } }
    }
  });
  console.dir(activeOrders, { depth: null });

  console.log('\n--- ALL TABLES ---');
  const tables = await prisma.table.findMany({
    select: {
      id: true,
      name: true,
      status: true
    }
  });
  console.dir(tables, { depth: null });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

