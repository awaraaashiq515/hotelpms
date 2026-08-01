import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

/**
 * POST /api/hotel/folios/link-order
 * Links a POS order to a hotel folio and posts a DEBIT transaction for the order amount.
 * Body: { folioId: string, posOrderId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const { folioId, posOrderId } = body;

    if (!folioId || !posOrderId) {
      return apiError(new Error('Folio ID and POS Order ID are required.'), 400);
    }

    const folio = await prisma.folio.findUnique({ where: { id: folioId } });
    if (!folio) return apiError(new Error('Folio not found.'), 404);
    if (folio.status !== 'OPEN') return apiError(new Error('Folio is already closed.'), 400);

    const order = await prisma.posOrder.findUnique({
      where: { id: posOrderId },
      include: {
        outlet: { select: { name: true, type: true } },
        items: { select: { quantity: true, unitPrice: true, totalAmount: true, product: { select: { name: true } } } }
      }
    });
    if (!order) return apiError(new Error('POS Order not found.'), 404);
    if (order.folioId) return apiError(new Error('This order is already linked to a folio.'), 400);

    const chargeAmount = order.grandTotal;
    const description = `${order.outlet?.name || 'Restaurant'} – Order #${order.orderNo}`;

    await prisma.$transaction(async (tx) => {
      await tx.posOrder.update({ where: { id: posOrderId }, data: { folioId } });

      await tx.folioTransaction.create({
        data: {
          folioId,
          txnType: 'DEBIT',
          sourceModule: 'POS',
          sourceRefId: posOrderId,
          description,
          debitAmount: chargeAmount,
          creditAmount: 0,
          taxAmount: order.taxAmount,
          netAmount: chargeAmount,
        }
      });

      const allTxns = await tx.folioTransaction.findMany({ where: { folioId } });
      const totalCharges = allTxns.reduce((s: number, t: any) => s + t.debitAmount, 0);
      const totalPayments = allTxns.reduce((s: number, t: any) => s + t.creditAmount, 0);
      await tx.folio.update({
        where: { id: folioId },
        data: { totalCharges, totalPayments, closingBalance: totalCharges - totalPayments }
      });
    });

    return apiResponse({}, `Order #${order.orderNo} linked to folio successfully`);
  } catch (error) {
    return apiError(error);
  }
}

/**
 * GET /api/hotel/folios/link-order?guestId=xxx
 * Returns unlinked POS orders for a guest
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const guestId = searchParams.get('guestId');
    if (!guestId) return apiError(new Error('Guest ID is required.'), 400);

    const unlinkedOrders = await prisma.posOrder.findMany({
      where: { guestId, folioId: null, status: { in: ['PAID', 'COMPLETED', 'CLOSED'] } },
      include: {
        outlet: { select: { name: true, type: true } },
        items: { select: { quantity: true, unitPrice: true, totalAmount: true, product: { select: { name: true } } } }
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return apiResponse(unlinkedOrders);
  } catch (error) {
    return apiError(error);
  }
}
