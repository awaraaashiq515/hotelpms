import { NextRequest } from 'next/server';
import { apiResponse, apiError } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const sessionRes = await fetch(new URL('/api/auth/session', req.url), {
      headers: req.headers,
    });
    const session = await sessionRes.json();

    if (!session.authenticated || (session.user.role !== 'RESTAURANTS_ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return apiError('Unauthorized', 401);
    }

    const { propertyId } = await req.json();

    if (!propertyId) {
      return apiError('Property ID is required', 400);
    }

    // Begin Reset Transaction
    await prisma.$transaction(async (tx: any) => {
      const where = { propertyId };

      // 1. KOT Tickets & Items (Delete items first)
      await tx.kotStatusLog.deleteMany({ where: { kot: { propertyId } } });
      await tx.kotItem.deleteMany({ where: { kot: { propertyId } } });
      await tx.kotTicket.deleteMany({ where });

      // 2. POS Orders & Items (Delete items first)
      await tx.posOrderItem.deleteMany({ where: { posOrder: { propertyId } } });
      await tx.posOrder.deleteMany({ where });

      // 3. Invoices & Items (Delete items first)
      await tx.invoiceItem.deleteMany({ where: { invoice: { propertyId } } });
      await tx.invoice.deleteMany({ where });

      // 4. Financial Transactions
      await tx.settlement.deleteMany({ where });
      await tx.receipt.deleteMany({ where });
      await tx.payment.deleteMany({ where });
      await tx.folioTransaction.deleteMany({ where: { folio: { reservation: { propertyId } } } });

      // 5. Inventory & Stock
      await tx.stockMovement.deleteMany({ where });
      await tx.stockAdjustment.deleteMany({ where });
      await tx.purchaseOrderItem.deleteMany({ where: { purchaseOrder: { propertyId } } });
      await tx.purchaseOrder.deleteMany({ where });
      await tx.purchaseInvoice.deleteMany({ where });

      // 6. Accounting & Expenses
      await tx.expense.deleteMany({ where });
      await tx.voucherEntry.deleteMany({ where: { voucher: { propertyId } } });
      await tx.voucher.deleteMany({ where });

      // 7. Operations
      await tx.dayClosing.deleteMany({ where });
      await tx.cashTopUp.deleteMany({ where });
      await tx.cashWithdrawal.deleteMany({ where });
      await tx.shift.deleteMany({ where });
      await tx.tableReservation.deleteMany({ where });

      // 8. Setup Data (Menu & Tables)
      await tx.orderRating.deleteMany({ where: { order: { propertyId } } });
      await tx.product.deleteMany({ where });
      await tx.category.deleteMany({ where });
      await tx.table.deleteMany({ where: { floor: { outlet: { propertyId } } } });
      await tx.floor.deleteMany({ where: { outlet: { propertyId } } });
      await tx.outlet.deleteMany({ where });
      
      // 9. Drivers & Guests
      await tx.driver.deleteMany({ where });
    });

    return apiResponse(null, 'Property data has been completely reset.');

  } catch (error: any) {
    return apiError(error);
  }
}
