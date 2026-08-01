import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getWTUserFromRequest } from '@/lib/walkie-talkie-auth';
import { getSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    let session = await getSession();
    let staff: any = null;
    if (!session) {
      staff = await getWTUserFromRequest(request as any);
    }
    if (!session && !staff) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const body = await request.json();
    const { propertyId, roomId, roomNumber, items, staffName } = body;

    if (!propertyId || !roomId || !Array.isArray(items) || items.length === 0) {
      return apiError(new Error('propertyId, roomId, and items[] are required'), 400);
    }

    let warehouse = await prisma.warehouse.findFirst({ where: { propertyId } });
    if (!warehouse) {
      warehouse = await prisma.warehouse.create({
        data: { propertyId, name: 'Main Store', code: 'MAIN' },
      });
    }

    const resolvedStaffName = staffName || staff?.fullName || session?.email || 'Housekeeper';

    const movements = await prisma.$transaction(async (tx: any) => {
      const results = [];
      for (const item of items) {
        const { stockItemId, qty } = item;
        if (!stockItemId || !qty || qty <= 0) continue;

        const agg = await tx.stockMovement.aggregate({
          where: { stockItemId, warehouseId: warehouse!.id },
          _sum: { qtyIn: true, qtyOut: true },
        });
        const stockRecord = await tx.stockItem.findUnique({ where: { id: stockItemId } });
        const openingStock = stockRecord?.openingStock || 0;
        const currentBalance = openingStock + (agg._sum.qtyIn || 0) - (agg._sum.qtyOut || 0);
        const newBalance = currentBalance - qty;

        const movement = await tx.stockMovement.create({
          data: {
            propertyId,
            warehouseId: warehouse!.id,
            stockItemId,
            movementType: 'OUT',
            qtyIn: 0,
            qtyOut: qty,
            balanceQty: Math.max(0, newBalance),
            unitCost: stockRecord?.costPrice || 0,
            referenceModule: 'HOUSEKEEPING',
            referenceId: roomId,
          },
          include: { stockItem: { select: { name: true, unit: true } } },
        });

        results.push({ ...movement, roomNumber, placedBy: resolvedStaffName });
      }
      return results;
    });

    return apiResponse(movements, `${movements.length} item(s) logged and deducted from inventory`, 201);
  } catch (error) {
    return apiError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    let session = await getSession();
    let staff: any = null;
    if (!session) {
      staff = await getWTUserFromRequest(request as any);
    }
    if (!session && !staff) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const roomId = searchParams.get('roomId');

    if (!propertyId) return apiError(new Error('propertyId is required'), 400);

    const movements = await prisma.stockMovement.findMany({
      where: {
        propertyId,
        referenceModule: 'HOUSEKEEPING',
        ...(roomId ? { referenceId: roomId } : {}),
      },
      include: { stockItem: { select: { name: true, unit: true } } },
      orderBy: { movementDate: 'desc' },
      take: 50,
    });

    return apiResponse(movements, 'Room item logs fetched');
  } catch (error) {
    return apiError(error);
  }
}
