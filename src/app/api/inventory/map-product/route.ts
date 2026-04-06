import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

// Link/unlink a product to a stock item
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const { productId, stockItemId } = body;

    if (!productId) return apiError(new Error('productId required'), 400);

    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        stockItemId: stockItemId || null,
        trackInventory: !!stockItemId,
      },
      include: { stockItem: { select: { name: true, unit: true } } },
    });

    return apiResponse(
      updated,
      stockItemId ? 'Product linked to stock item' : 'Product unlinked from stock item'
    );
  } catch (error) {
    return apiError(error);
  }
}
