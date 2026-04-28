import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

// Physical stock adjustment: can be positive (excess) or negative (shortage)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.propertyId)
      return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const { stockItemId, physicalQty, reason } = body;

    if (!stockItemId || physicalQty === undefined || physicalQty === null)
      return apiError(new Error('stockItemId and physicalQty required'), 400);

    let warehouse = await prisma.warehouse.findFirst({
      where: { propertyId: session.propertyId },
    });
    if (!warehouse) {
      warehouse = await prisma.warehouse.create({
        data: { propertyId: session.propertyId, name: 'Main Store', code: 'MAIN' },
      });
    }

    const result = await prisma.$transaction(async (tx: any) => {
      const agg = await tx.stockMovement.aggregate({
        where: { stockItemId, warehouseId: warehouse!.id },
        _sum: { qtyIn: true, qtyOut: true },
      });
      const stockItem = await tx.stockItem.findUnique({ where: { id: stockItemId } });
      const openingStock = stockItem?.openingStock || 0;
      const currentBalance = openingStock + (agg._sum.qtyIn || 0) - (agg._sum.qtyOut || 0);
      const physical = Number(physicalQty);
      const diff = physical - currentBalance;

      if (diff === 0) {
        throw new Error('Physical qty matches current stock. No adjustment needed.');
      }

      // Generate adjustment number
      const count = await tx.stockAdjustment.count({ where: { propertyId: session.propertyId! } });
      const adjustmentNo = `ADJ-${(count + 1).toString().padStart(4, '0')}`;

      const adjustment = await tx.stockAdjustment.create({
        data: {
          propertyId: session.propertyId!,
          warehouseId: warehouse!.id,
          adjustmentNo,
          reason: reason || 'Physical count adjustment',
          status: 'COMPLETED',
        },
      });

      // Record movement
      await tx.stockMovement.create({
        data: {
          propertyId: session.propertyId!,
          warehouseId: warehouse!.id,
          stockItemId,
          movementType: diff > 0 ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT',
          qtyIn: diff > 0 ? Math.abs(diff) : 0,
          qtyOut: diff < 0 ? Math.abs(diff) : 0,
          balanceQty: physical,
          unitCost: stockItem?.costPrice || 0,
          referenceModule: 'STOCK_ADJUSTMENT',
          referenceId: adjustment.id,
        },
      });

      return { adjustment, diff, currentBalance, physicalQty: physical };
    });

    return apiResponse(result, 'Stock adjustment completed', 201);
  } catch (error) {
    return apiError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const adjustments = await prisma.stockAdjustment.findMany({
      where: { propertyId: session.propertyId! },
      include: { warehouse: { select: { name: true } } },
      orderBy: { adjustmentDate: 'desc' },
      take: 50,
    });

    return apiResponse(adjustments);
  } catch (error) {
    return apiError(error);
  }
}
