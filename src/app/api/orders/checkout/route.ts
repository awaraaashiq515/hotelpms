import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';
import { sendSMS } from '@/lib/notificationService';
import { processDriverRide } from '@/lib/driverOfferEngine';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const { items, paymentModeId, totalAmount, guestId, restaurantTableId, driverId, staffMemberId } = body;

    const result = await prisma.$transaction(async (tx: any) => {
      // 0. Find target account (Cash Account)
      const cashAccount = await tx.account.findFirst({
        where: { 
          propertyId: session.propertyId!,
          accountType: 'CASH'
        }
      });

      if (!cashAccount) {
        throw new Error('Cash account not found. Please ensure accounts are set up.');
      }

      // 1. Find or Create PosOrder
      let posOrder = null;
      if (restaurantTableId) {
        posOrder = await (tx as any).posOrder.findFirst({
          where: { 
            restaurantTableId, 
            status: { in: ['OPEN', 'PENDING', 'PLACED', 'IN_KITCHEN', 'READY', 'BILL_PRINTED'] } 
          }
        });
      }

      const grandTotal = Number(totalAmount) || 0;
      const taxAmount = (grandTotal / 1.05) * 0.05;
      const subtotal = grandTotal - taxAmount;

      if (posOrder) {
        // Update existing order
        posOrder = await tx.posOrder.update({
          where: { id: posOrder.id },
          data: {
            status: 'SETTLED',
            subtotal: subtotal,
            taxAmount: taxAmount,
            grandTotal: grandTotal,
            ...(driverId && { driverId }),
            ...(staffMemberId && { staffMemberId })
          }
        });
      } else {
        // Create new order (Fast Billing)
        const outlet = await (tx as any).outlet.findFirst({ where: { propertyId: session.propertyId! } });
        if (!outlet) {
          throw new Error('No POS outlet found for this property.');
        }
        
        const table = restaurantTableId ? await (tx as any).table.findUnique({ where: { id: restaurantTableId } }) : null;

        posOrder = await (tx as any).posOrder.create({
          data: {
              propertyId: session.propertyId!,
              outletId: outlet.id,
              orderNo: `POS-${Date.now()}`,
              orderType: 'DINE_IN',
              status: 'SETTLED',
              subtotal: subtotal,
              taxAmount: taxAmount,
              discountAmount: 0,
              grandTotal: grandTotal,
              restaurantTableId: restaurantTableId || null,
              tableNo: table?.name || null,
              driverId: driverId || null,
              staffMemberId: staffMemberId || null,
              items: {
                create: items.map((item: any) => {
                  const unitPrice = item.sellingPrice || item.unitPrice || item.basePrice || 0;
                  const qty = item.quantity || item.qty || 1;
                  const lineSubtotal = unitPrice * qty;
                  const lineTax = lineSubtotal * 0.05;
                  return {
                    productId: item.id,
                    quantity: qty,
                    unitPrice: unitPrice,
                    taxAmount: lineTax,
                    totalAmount: lineSubtotal + lineTax,
                    discountAmount: 0
                  };
                })
              }
          }
        });
      }


      // 2. Generate Professional Invoice Number
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const fy = month >= 4 ? `${year}-${(year + 1).toString().slice(-2)}` : `${year - 1}-${year.toString().slice(-2)}`;
      
      const count = await tx.invoice.count({
        where: { propertyId: session.propertyId! }
      });
      const invoiceNo = `PJ/${fy}/${(count + 1).toString().padStart(4, '0')}`;

      // 3. Create Invoice linked to the order
      const invoice = await tx.invoice.create({
        data: {
          invoiceNo,
          propertyId: session.propertyId!,
          guestId: guestId || null,
          subtotal: totalAmount,
          taxAmount: taxAmount,
          totalAmount: grandTotal,
          paymentStatus: 'PAID',
          invoiceStatus: 'SETTLED',
        },
      });

      // 4. Create Invoice Items
      const productDetails = await tx.product.findMany({
        where: { id: { in: items.map((i: any) => i.id) } },
        select: { id: true, hsnCode: true }
      });

      await tx.invoiceItem.createMany({
        data: items.map((item: any) => {
          const detail = productDetails.find((p: any) => p.id === item.id);
          const unitPrice = item.sellingPrice || item.unitPrice || item.basePrice || 0;
          const qty = item.quantity || item.qty || 1;
          const lineSubtotal = unitPrice * qty;
          const lineTax = lineSubtotal * 0.05;
          return {
            invoiceId: invoice.id,
            productId: item.id,
            hsnCode: detail?.hsnCode || null,
            qty: qty,
            unitPrice: unitPrice,
            taxAmount: lineTax,
            totalAmount: lineSubtotal + lineTax,
          };
        }),
      });

      // 5. Create Settlement & Payment ( Financial Tracking )
      await tx.settlement.create({
        data: {
          propertyId: session.propertyId!,
          settlementNo: `SET-${Date.now()}`,
          sourceId: invoice.id,
          sourceType: 'INVOICE',
          grossAmount: grandTotal,
          paidAmount: grandTotal,
          balanceAmount: 0,
          status: 'COMPLETED',
          settlementDate: new Date(),
        }
      });

      await tx.payment.create({
        data: {
          paymentNo: `PAY-${Date.now()}`,
          propertyId: session.propertyId!,
          amount: grandTotal,
          paymentModeId: paymentModeId,
          paidToAccountId: cashAccount.id,
        },
      });

      // 6. Update Table Status to VACANT
      if (restaurantTableId) {
        await (tx as any).table.update({
          where: { id: restaurantTableId },
          data: { status: 'VACANT' }
        });
      }

      return { invoice, orderNo: posOrder.orderNo, grandTotal, driverId: posOrder.driverId || driverId };
    });

    // Check Driver Offer rule
    if (result.driverId) {
      processDriverRide(result.driverId).catch(err => console.error('Driver Engine Error:', err));
    }

    // Send SMS Notification
    if (guestId) {
      const guest = await prisma.guest.findUnique({ where: { id: guestId } });
      const property = await prisma.property.findUnique({ where: { id: session.propertyId! } });
      
      if (guest?.mobile) {
        sendSMS(guest.mobile, 'TEMPLATE_BILL_PAID', {
          NAME: guest.firstName || 'Guest',
          AMOUNT: result.grandTotal.toString(),
          HOTEL: property?.name || 'OrderMint Solutions',
          ORDER_NO: result.orderNo
        }).catch(err => console.error('Failed to trigger SMS:', err));
      }
    }

    return apiResponse(result, 'Checkout successful', 201);
  } catch (error: any) {
    console.error('Checkout Error:', error);
    return apiError(error, 400);
  }
}
