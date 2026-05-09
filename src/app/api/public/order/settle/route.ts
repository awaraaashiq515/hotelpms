import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, propertyId, paymentMethod, rating, comments } = body;

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

      // 2. Handle Payment Status
      const isOnline = paymentMethod === 'UPI';
      
      if (isOnline) {
        // For online payments, we don't settle immediately. 
        // We mark it as awaiting approval so staff can verify the payment.
        await tx.posOrder.update({
          where: { id: order.id },
          data: { 
            status: 'PAYMENT_AWAITING_APPROVAL',
            onlinePaymentMethod: 'UPI',
            onlinePaymentReference: body.upiTxnRef || null,
            paymentRequested: true // Also show up on counter
          }
        });
      } else {
        // Legacy flow (if any) or other methods that don't need approval
        // 2. Create Receipt & Settlement (Mocking UPI success)
        try {
          const cashAccount = await tx.account.findFirst({ where: { propertyId, accountType: 'CASH' } })
                           || await tx.account.findFirst({ where: { propertyId } });
          const upiMode = await tx.paymentMode.findFirst({ where: { propertyId, name: { contains: 'UPI' } } }) 
                          || await tx.paymentMode.findFirst({ where: { propertyId } });

          if (cashAccount && upiMode) {
            await tx.receipt.create({
              data: {
                propertyId,
                receiptNo: `REC-QR-S-${Date.now()}`,
                receivedFromAccountId: cashAccount.id,
                amount: order.grandTotal,
                paymentModeId: upiMode.id,
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
          }
        } catch (payErr) {
          console.error('Settlement record creation failed but continuing:', payErr);
        }

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
      }

      // 6. Save Rating if provided
      if (rating) {
        await tx.orderRating.upsert({
          where: { orderId: order.id },
          update: { rating, comments },
          create: { orderId: order.id, rating, comments }
        });
      }

      // 7. Create Notification for Staff
      const table = await tx.table.findUnique({
        where: { id: order.restaurantTableId },
        include: { floor: true }
      });

      const orderWithItems = await tx.posOrder.findUnique({
        where: { id: order.id },
        include: { items: { include: { product: true } } }
      });

      if (table && orderWithItems) {
        await tx.notification.create({
          data: {
            propertyId,
            title: 'Online Payment Received',
            message: `Payment of ₹${order.grandTotal.toFixed(2)} received from Table ${table.name} (${table.floor.name})`,
            type: 'PAYMENT',
            priority: 'URGENT',
            metadata: JSON.stringify({
              tableId: table.id,
              tableName: table.name,
              floorName: table.floor.name,
              amount: order.grandTotal,
              orderId: order.id,
              orderNo: order.orderNo,
              paymentMethod: 'UPI',
              items: orderWithItems.items.map((i: any) => ({ name: i.product.name, qty: i.quantity }))
            }),
          }
        });
      }

      return { success: true, orderNo: order.orderNo };
    });

    return apiResponse(result, 'Payment settled successfully');
  } catch (error) {
    console.error('Public Order Settle Error:', error);
    return apiError(error);
  }
}
