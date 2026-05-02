import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const { orderId, paymentMethod, tipAmount, guestName } = body;

    if (!orderId) return apiError(new Error('orderId is required'), 400);

    const result = await prisma.$transaction(async (tx: any) => {
      const order = await tx.posOrder.findUnique({
        where: { id: orderId },
        include: { guest: true },
      });

      if (!order) throw new Error('Order not found');
      if (order.status === 'SETTLED') return { success: true, message: 'Already settled' };

      const tip = parseFloat(tipAmount) || 0;
      const totalPaid = order.grandTotal + tip;

      // Find payment mode
      const payMode = paymentMethod === 'CASH'
        ? await tx.paymentMode.findFirst({ where: { propertyId: order.propertyId, name: { contains: 'Cash' } } })
          || await tx.paymentMode.findFirst({ where: { propertyId: order.propertyId } })
        : paymentMethod === 'CARD'
        ? await tx.paymentMode.findFirst({ where: { propertyId: order.propertyId, name: { contains: 'Card' } } })
          || await tx.paymentMode.findFirst({ where: { propertyId: order.propertyId } })
        : await tx.paymentMode.findFirst({ where: { propertyId: order.propertyId, name: { contains: 'UPI' } } })
          || await tx.paymentMode.findFirst({ where: { propertyId: order.propertyId } });

      const cashAccount = await tx.account.findFirst({
        where: { propertyId: order.propertyId, accountType: 'CASH' },
      });

      // Create receipt
      await tx.receipt.create({
        data: {
          propertyId: order.propertyId,
          receiptNo: `REC-CTR-${Date.now()}`,
          receivedFromAccountId: cashAccount?.id || 'default-account',
          amount: totalPaid,
          paymentModeId: payMode?.id || 'default-mode',
          sourceModule: 'POS_ORDER',
          sourceRefId: order.id,
        },
      });

      // Create settlement
      await tx.settlement.create({
        data: {
          propertyId: order.propertyId,
          settlementNo: `SET-CTR-${Date.now()}`,
          sourceId: order.id,
          sourceType: 'POS_ORDER',
          guestId: order.guestId,
          grossAmount: order.grandTotal,
          paidAmount: totalPaid,
          balanceAmount: 0,
          status: 'COMPLETED',
          settlementDate: new Date(),
        },
      });

      // Update order
      await tx.posOrder.update({
        where: { id: order.id },
        data: {
          status: 'SETTLED',
          paymentRequested: false,
          ...(guestName && !order.guestId
            ? {}
            : {}),
        },
      });

      // Vacate table
      if (order.restaurantTableId) {
        await tx.table.update({
          where: { id: order.restaurantTableId },
          data: { status: 'VACANT' },
        });
      }

      return { success: true, orderNo: order.orderNo };
    });

    return apiResponse(result, 'Counter payment settled successfully');
  } catch (error) {
    console.error('Counter settle error:', error);
    return apiError(error);
  }
}
