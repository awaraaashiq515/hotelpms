import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const { items, totalAmount, guestId, restaurantTableId } = body;

    if (!guestId) {
      return apiResponse(null, 'Customer is required for credit sales', 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify guest exists
      const guest = await (tx as any).guest.findUnique({ where: { id: guestId } });
      if (!guest) throw new Error('Customer not found');

      // 1.5 Handle PosOrder lifecycle
      let posOrder = null;
      if (restaurantTableId) {
        posOrder = await (tx as any).posOrder.findFirst({
          where: { restaurantTableId, status: { in: ['OPEN', 'PENDING'] } }
        });
      }

      const grandTotal = Number(totalAmount) || 0;
      const taxAmount = (grandTotal / 1.05) * 0.05;
      const subtotal = grandTotal - taxAmount;

      if (posOrder) {
        // Update existing order
        posOrder = await (tx as any).posOrder.update({
          where: { id: posOrder.id },
          data: {
            status: 'SETTLED',
            subtotal: subtotal,
            taxAmount: taxAmount,
            grandTotal: grandTotal,
            guestId: guestId,
          }
        });
      }

      // 2. Calculate totals (already done above)

      // 3. Generate Invoice Number
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const fy = month >= 4 ? `${year}-${(year + 1).toString().slice(-2)}` : `${year - 1}-${year.toString().slice(-2)}`;
      const count = await (tx as any).invoice.count({ where: { propertyId: session.propertyId! } });
      const invoiceNo = `PJ/${fy}/CR-${(count + 1).toString().padStart(4, '0')}`;

      // 4. Create Invoice as UNPAID
      const invoice = await (tx as any).invoice.create({
        data: {
          invoiceNo,
          propertyId: session.propertyId!,
          guestId: guestId,
          subtotal: subtotal,
          taxAmount: taxAmount,
          totalAmount: grandTotal,
          paymentStatus: 'UNPAID',
          invoiceStatus: 'ACTIVE',
        },
      });

      // 5. Create Invoice Items
      await (tx as any).invoiceItem.createMany({
        data: items.map((item: any) => {
          const unitPrice = item.sellingPrice || item.unitPrice || 0;
          const qty = item.quantity || item.qty || 1;
          const lineSubtotal = unitPrice * qty;
          const lineTax = lineSubtotal * 0.05;
          return {
            invoiceId: invoice.id,
            productId: item.id,
            qty,
            unitPrice,
            taxAmount: lineTax,
            totalAmount: lineSubtotal + lineTax,
          };
        }),
      });

      // 6. Update Table Status to VACANT
      if (restaurantTableId) {
        await (tx as any).table.update({
          where: { id: restaurantTableId },
          data: { status: 'VACANT' }
        });
      }

      return { invoice, orderNo: posOrder?.orderNo };
    });

    return apiResponse(result, 'Credit bill created. Due amount added to customer outstanding.', 201);
  } catch (error: any) {
    console.error('Credit Checkout Error:', error);
    return apiResponse(null, error.message, 400);
  }
}
