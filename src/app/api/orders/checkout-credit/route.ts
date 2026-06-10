import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';
import { createNotification } from '@/lib/notificationService';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const { items, totalAmount, guestId, restaurantTableId } = body;

    if (!guestId) {
      return apiResponse(null, 'Customer is required for credit sales', 400);
    }

    const result = await prisma.$transaction(async (tx: any) => {
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

      // Calculate true totals from items
      const productDetails = await tx.product.findMany({
        where: { id: { in: items.map((i: any) => i.id) } },
        select: { id: true, hsnCode: true, taxRate: true, taxType: true }
      });

      let subtotal = 0;
      let taxAmount = 0;
      let grandTotal = 0;

      const itemsWithTax = items.map((item: any) => {
        const detail = productDetails.find((p: any) => p.id === item.id);
        const unitPrice = item.sellingPrice || item.unitPrice || item.basePrice || 0;
        const qty = item.quantity || item.qty || 1;
        const lineTotalRaw = unitPrice * qty;

        const taxRate = detail?.taxRate ?? 5;
        const taxType = detail?.taxType || 'EXCLUSIVE';

        let lineSubtotal = 0;
        let lineTax = 0;
        let lineGrandTotal = 0;

        if (taxType === 'EXEMPT') {
          lineSubtotal = lineTotalRaw;
          lineTax = 0;
          lineGrandTotal = lineTotalRaw;
        } else if (taxType === 'INCLUSIVE') {
          lineSubtotal = lineTotalRaw / (1 + (taxRate / 100));
          lineTax = lineTotalRaw - lineSubtotal;
          lineGrandTotal = lineTotalRaw;
        } else { // EXCLUSIVE
          lineSubtotal = lineTotalRaw;
          lineTax = lineTotalRaw * (taxRate / 100);
          lineGrandTotal = lineTotalRaw + lineTax;
        }

        subtotal += lineSubtotal;
        taxAmount += lineTax;
        grandTotal += lineGrandTotal;

        return {
          ...item,
          qty,
          unitPrice,
          lineSubtotal,
          lineTax,
          lineGrandTotal,
          hsnCode: detail?.hsnCode
        };
      });

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

      await createNotification({
        propertyId: session.propertyId!,
        title: 'Credit Invoice Created',
        message: `Invoice ${invoice.invoiceNo} created for Guest. Amount: ₹${grandTotal.toFixed(2)}`,
        type: 'PAYMENT',
        priority: 'MEDIUM',
        tableId: restaurantTableId || null,
        metadata: {
          invoiceId: invoice.id,
          invoiceNo: invoice.invoiceNo,
          amount: grandTotal,
          tableId: restaurantTableId || null,
          link: `/invoices`
        }
      }, tx);

      // 5. Create Invoice Items
      await (tx as any).invoiceItem.createMany({
        data: itemsWithTax.map((item: any) => {
          return {
            invoiceId: invoice.id,
            productId: item.id,
            qty: item.qty,
            unitPrice: item.unitPrice,
            taxAmount: item.lineTax,
            totalAmount: item.qty * item.unitPrice,
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
