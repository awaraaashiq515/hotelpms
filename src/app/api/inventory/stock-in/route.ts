import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

// API for manual stock-in: purchase entry or opening stock adjustments
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.propertyId)
      return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const { stockItemId, qty, unitCost, movementType, referenceModule, referenceId, remarks } = body;

    if (!stockItemId || !qty || qty <= 0)
      return apiError(new Error('stockItemId and qty > 0 required'), 400);

    const type = movementType || 'PURCHASE_IN';

    // Ensure warehouse exists
    let warehouse = await prisma.warehouse.findFirst({
      where: { propertyId: session.propertyId },
    });
    if (!warehouse) {
      warehouse = await prisma.warehouse.create({
        data: { propertyId: session.propertyId, name: 'Main Store', code: 'MAIN' },
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const agg = await tx.stockMovement.aggregate({
        where: { stockItemId, warehouseId: warehouse!.id },
        _sum: { qtyIn: true, qtyOut: true },
      });
      const stockItem = await tx.stockItem.findUnique({ where: { id: stockItemId } });
      const openingStock = stockItem?.openingStock || 0;
      const currentBalance = openingStock + (agg._sum.qtyIn || 0) - (agg._sum.qtyOut || 0);
      const newBalance = currentBalance + Number(qty);

      const movement = await tx.stockMovement.create({
        data: {
          propertyId: session.propertyId!,
          warehouseId: warehouse!.id,
          stockItemId,
          movementType: type,
          qtyIn: Number(qty),
          qtyOut: 0,
          balanceQty: newBalance,
          unitCost: Number(unitCost || 0),
          referenceModule: referenceModule || null,
          referenceId: referenceId || null,
        },
      });
      return movement;
    });

    return apiResponse(result, 'Stock-in recorded', 201);
  } catch (error) {
    return apiError(error);
  }
}
