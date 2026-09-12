import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';
import { getWTUserFromRequest } from '@/lib/walkie-talkie-auth';
import { createNotification } from '@/lib/notificationService';

// API for manual stock-in: purchase entry or opening stock adjustments
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    let staff: any = null;
    if (!session) staff = await getWTUserFromRequest(request as any);
    if (!session && !staff) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const { stockItemId, qty, unitCost, movementType, referenceModule, referenceId, remarks } = body;

    if (!stockItemId || !qty || Number(qty) <= 0)
      return apiError(new Error('stockItemId and qty > 0 required'), 400);

    // Fetch stockItem to safely get the correct propertyId
    const stockItem = await prisma.stockItem.findUnique({
      where: { id: stockItemId },
      select: { id: true, propertyId: true, openingStock: true },
    });
    if (!stockItem) return apiError(new Error('Stock item not found'), 404);

    const propertyId = stockItem.propertyId;
    const type = movementType || 'PURCHASE_IN';

    // Ensure warehouse exists for this exact property
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
      const newBalance = currentBalance + Number(qty);

      const movement = await tx.stockMovement.create({
        data: {
          propertyId,
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

    // Notify about stock-in
    try {
      await createNotification({
        propertyId,
        title: 'Inventory Stock-In',
        message: `New stock of ${qty} units added.`,
        type: 'INVENTORY',
        priority: 'MEDIUM',
        metadata: {
          movementId: (result as any).id,
          qty,
          link: '/inventory'
        }
      });
    } catch (e) {}

    return apiResponse(result, 'Stock-in recorded', 201);
  } catch (error) {
    return apiError(error);
  }
}
