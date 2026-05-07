import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, propertyId, paymentMethod } = body;

    if (!orderId || !propertyId) {
      return apiError(new Error('Missing orderId or propertyId'), 400);
    }

    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Fetch Order
      const order = await tx.posOrder.findUnique({
        where: { id: orderId },
        include: { guest: true }
      });

      if (!order || order.propertyId !== propertyId) {
        throw new Error('Order not found or invalid property');
      }

      if (order.status === 'SETTLED') {
        return { success: true, message: 'Already settled' };
      }

      // 2. Create Receipt & Settlement (Mocking UPI success)
      const cashAccount = await tx.account.findFirst({ where: { propertyId, accountType: 'CASH' } });
      const upiMode = await tx.paymentMode.findFirst({ where: { propertyId, name: { contains: 'UPI' } } }) 
                      || await tx.paymentMode.findFirst({ where: { propertyId } });

      await tx.receipt.create({
        data: {
          propertyId,
          receiptNo: `REC-QR-S-${Date.now()}`,
          receivedFromAccountId: cashAccount?.id || 'default-account',
          amount: order.grandTotal,
          paymentModeId: upiMode?.id || 'default-mode',
          sourceModule: 'POS_ORDER',
          sourceRefId: order.id,
        }
      });

      await tx.settlement.create({
        data: {
          propertyId,
          settlementNo: `SET-QR-S-${Date.now()}`,
          sourceId: order.id,
          sourceType: 'POS_ORDER',
          guestId: order.guestId,
          grossAmount: order.grandTotal,
          paidAmount: order.grandTotal,
          balanceAmount: 0,
          status: 'COMPLETED',
          settlementDate: new Date(),
        }
      });

      // 3. Update Order Status
      await tx.posOrder.update({
        where: { id: order.id },
        data: { status: 'SETTLED' }
      });

      // 4. Update Table Status
      await tx.table.update({
        where: { id: order.restaurantTableId },
        data: { status: 'VACANT' }
      });

      // 5. Update UPI Received Amount tracking
      if (paymentMethod === 'UPI') {
        const prop = await tx.property.findUnique({
          where: { id: propertyId },
          select: {
            id: true,
            upiId: true,
            upiLimit: true,
            upiReceivedToday: true,
            upiId2: true,
            upiLimit2: true,
            upiReceivedToday2: true,
            lastUpiResetDate: true
          }
        });

        if (prop) {
          const now = new Date();
          const lastReset = prop.lastUpiResetDate ? new Date(prop.lastUpiResetDate) : null;
          const isDifferentDay = !lastReset || 
            lastReset.getDate() !== now.getDate() || 
            lastReset.getMonth() !== now.getMonth() || 
            lastReset.getFullYear() !== now.getFullYear();

          if (isDifferentDay) {
            await tx.property.update({
              where: { id: propertyId },
              data: {
                upiReceivedToday: order.grandTotal,
                upiReceivedToday2: 0,
                lastUpiResetDate: now
              }
            });
          } else {
            // Logic to decide which bucket to increment
            if (prop.upiReceivedToday >= prop.upiLimit && prop.upiId2 && prop.upiReceivedToday2 < prop.upiLimit2) {
              await tx.property.update({
                where: { id: propertyId },
                data: { upiReceivedToday2: { increment: order.grandTotal } }
              });
            } else {
              await tx.property.update({
                where: { id: propertyId },
                data: { upiReceivedToday: { increment: order.grandTotal } }
              });
            }
          }
        }
      }

      return { success: true, orderNo: order.orderNo };
    });

    return apiResponse(result, 'Payment settled successfully');
  } catch (error) {
    console.error('Public Order Settle Error:', error);
    return apiError(error);
  }
}
