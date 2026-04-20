import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { itemId } = await params;
    const body = await request.json();
    const { reason, replacementProductId, replacementQty } = body;

    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.invoiceItem.findUnique({
        where: { id: itemId },
        include: { invoice: true, product: true }
      });

      if (!item) throw new Error('Item not found');
      if (item.status !== 'NORMAL') throw new Error('Item already processed for return/replace');

      // 1. Mark original item as REPLACED
      const updatedItem = await tx.invoiceItem.update({
        where: { id: itemId },
        data: { status: 'REPLACED' }
      });

      // 2. If a replacement product is provided, add it as a new line item with 0 cost (or original cost)
      // For "Didn't like it", usually it's an even exchange.
      if (replacementProductId) {
        const product = await tx.product.findUnique({ where: { id: replacementProductId } });
        if (!product) throw new Error('Replacement product not found');

        await tx.invoiceItem.create({
          data: {
            invoiceId: item.invoiceId,
            productId: replacementProductId,
            description: `Exchange for ${item.product?.name || item.description}: ${reason || 'Customer dislike'}`,
            qty: replacementQty || item.qty,
            unitPrice: 0, // Even exchange
            taxAmount: 0,
            totalAmount: 0,
            hsnCode: product.hsnCode,
            status: 'NORMAL'
          }
        });
      }

      return updatedItem;
    });

    return apiResponse(result, 'Item replacement processed');
  } catch (error: any) {
    console.error('Replacement Error:', error);
    return apiError(error, 400);
  }
}
