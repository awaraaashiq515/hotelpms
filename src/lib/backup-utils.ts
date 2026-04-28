import { prisma } from './prisma';

export async function generateBackupData(organizationId: string, propertyId?: string) {
  const propertyFilter = propertyId && propertyId !== 'all' ? { id: propertyId } : {};
  
  // Fetch Organization & Properties
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      properties: {
        where: propertyFilter,
        include: {
          outlets: true,
          categories: true,
          products: true,
          floors: true,
          tables: true,
          staffMembers: true,
          paymentModes: true,
          expenseCategories: true,
          warehouses: true,
          stockItems: true,
        }
      },
      guests: true,
      vendors: true,
      accountGroups: {
        include: {
          accounts: true
        }
      }
    }
  });

  if (!organization) return null;

  const propertyIds = organization.properties.map((p: any) => p.id);
  const transWhere = { propertyId: { in: propertyIds } };

  // Fetch Transactional Data
  const posOrders = await prisma.posOrder.findMany({
    where: transWhere,
    include: { items: true }
  });

  const invoices = await prisma.invoice.findMany({
    where: transWhere,
    include: { items: true }
  });

  const kotTickets = await prisma.kotTicket.findMany({
    where: transWhere,
    include: { items: true }
  });

  const drivers = await prisma.driver.findMany({
    where: transWhere
  });

  const expenses = await prisma.expense.findMany({
    where: transWhere
  });

  const stockMovements = await prisma.stockMovement.findMany({
    where: transWhere
  });

  const dayClosings = await prisma.dayClosing.findMany({
    where: transWhere
  });

  const shifts = await prisma.shift.findMany({
    where: transWhere
  });

  const vouchers = await prisma.voucher.findMany({
    where: transWhere,
    include: { entries: true }
  });

  const tableReservations = await prisma.tableReservation.findMany({
    where: transWhere
  });

  const settlements = await prisma.settlement.findMany({
    where: transWhere
  });

  const purchaseInvoices = await prisma.purchaseInvoice.findMany({
    where: transWhere
  });

  const stockAdjustments = await prisma.stockAdjustment.findMany({
    where: transWhere
  });

  const backup = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    propertyId: propertyId === 'all' ? null : propertyId,
    organization,
    posOrders,
    invoices,
    kotTickets,
    drivers,
    expenses,
    stockMovements,
    dayClosings,
    shifts,
    vouchers,
    tableReservations,
    settlements,
    purchaseInvoices,
    stockAdjustments
  };

  return backup;
}
