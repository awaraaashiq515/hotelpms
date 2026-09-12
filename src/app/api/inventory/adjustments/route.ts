import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, getMultiTenantWhere, resolveAdminProperty, resolvePropertyIdentifier } from '@/lib/api-utils';
import { getSession } from '@/lib/session';
import { getWTUserFromRequest } from '@/lib/walkie-talkie-auth';

// Physical stock adjustment: can be positive (excess) or negative (shortage)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    let staff: any = null;
    if (!session) staff = await getWTUserFromRequest(request as any);
    if (!session && !staff) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const { stockItemId, physicalQty, reason } = body;

    if (!stockItemId || physicalQty === undefined || physicalQty === null)
      return apiError(new Error('stockItemId and physicalQty required'), 400);

    // Fetch stockItem to safely get the correct propertyId
    const stockItem = await prisma.stockItem.findUnique({
      where: { id: stockItemId },
      select: { id: true, propertyId: true, openingStock: true, costPrice: true },
    });
    if (!stockItem) return apiError(new Error('Stock item not found'), 404);

    const propertyId = stockItem.propertyId;

    let warehouse = await prisma.warehouse.findFirst({
      where: { propertyId },
    });
    if (!warehouse) {
      warehouse = await prisma.warehouse.create({
        data: { propertyId, name: 'Main Store', code: 'MAIN' },
      });
    }

    const result = await prisma.$transaction(async (tx: any) => {
      const agg = await tx.stockMovement.aggregate({
        where: { stockItemId, warehouseId: warehouse!.id },
        _sum: { qtyIn: true, qtyOut: true },
      });
      const openingStock = stockItem.openingStock || 0;
      const currentBalance = openingStock + (agg._sum.qtyIn || 0) - (agg._sum.qtyOut || 0);
      const physical = Number(physicalQty);
      const diff = physical - currentBalance;

      if (diff === 0) {
        throw new Error('Physical qty matches current stock. No adjustment needed.');
      }

      // Generate adjustment number
      const count = await tx.stockAdjustment.count({ where: { propertyId } });
      const adjustmentNo = `ADJ-${(count + 1).toString().padStart(4, '0')}`;

      const adjustment = await tx.stockAdjustment.create({
        data: {
          propertyId,
          warehouseId: warehouse!.id,
          adjustmentNo,
          reason: reason || 'Physical count adjustment',
          status: 'COMPLETED',
        },
      });

      // Record movement
      await tx.stockMovement.create({
        data: {
          propertyId,
          warehouseId: warehouse!.id,
          stockItemId,
          movementType: diff > 0 ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT',
          qtyIn: diff > 0 ? diff : 0,
          qtyOut: diff < 0 ? Math.abs(diff) : 0,
          balanceQty: physical,
          unitCost: stockItem.costPrice || 0,
          referenceModule: 'ADJUSTMENT',
          referenceId: adjustment.id,
        },
      });

      return { adjustment, diff, physicalQty: physical };
    });

    return apiResponse(result, 'Stock adjusted successfully');
  } catch (error) {
    return apiError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    let staff: any = null;
    if (!session) staff = await getWTUserFromRequest(request as any);
    if (!session && !staff) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    let rawPropertyId = searchParams.get('propertyId') || searchParams.get('propertyCode') || session?.propertyId || staff?.propertyId;
    const prop = await resolvePropertyIdentifier(rawPropertyId, session);
    const propertyId = prop?.id;

    const adjustments = await prisma.stockAdjustment.findMany({
      where: propertyId ? { propertyId } : {},
      include: {
        warehouse: { select: { name: true } },
      },
      orderBy: { adjustmentDate: 'desc' },
      take: 50,
    });

    return apiResponse(adjustments);
  } catch (error) {
    return apiError(error);
  }
}
