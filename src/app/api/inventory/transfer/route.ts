import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

// POST: Transfer stock between warehouses
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.propertyId)
      return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const { stockItemId, fromWarehouseId, toWarehouseId, qty } = body;

    if (!stockItemId || !fromWarehouseId || !toWarehouseId || !qty || qty <= 0)
      return apiError(new Error('stockItemId, warehouses and qty > 0 required'), 400);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Deduct from source
      const lastMovFrom = await tx.stockMovement.findFirst({
        where: { stockItemId, warehouseId: fromWarehouseId },
        orderBy: { movementDate: 'desc' }
      });
      const balanceFrom = lastMovFrom?.balanceQty || 0;

      await tx.stockMovement.create({
        data: {
          propertyId: session.propertyId!,
          warehouseId: fromWarehouseId,
          stockItemId,
          movementType: 'TRANSFER_OUT',
          qtyIn: 0,
          qtyOut: Number(qty),
          balanceQty: balanceFrom - Number(qty),
          referenceModule: 'TRANSFER',
        }
      });

      // 2. Add to destination
      const lastMovTo = await tx.stockMovement.findFirst({
        where: { stockItemId, warehouseId: toWarehouseId },
        orderBy: { movementDate: 'desc' }
      });
      const balanceTo = lastMovTo?.balanceQty || 0;

      await tx.stockMovement.create({
        data: {
          propertyId: session.propertyId!,
          warehouseId: toWarehouseId,
          stockItemId,
          movementType: 'TRANSFER_IN',
          qtyIn: Number(qty),
          qtyOut: 0,
          balanceQty: balanceTo + Number(qty),
          referenceModule: 'TRANSFER',
        }
      });

      return { success: true };
    });

    return apiResponse(result, 'Stock transfer successful');
  } catch (error) {
    return apiError(error);
  }
}

// GET: List warehouses for this property
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    let warehouses = await prisma.warehouse.findMany({
      where: { propertyId: session.propertyId! }
    });

    // Ensure at least Main Store and Kitchen exist
    if (warehouses.length === 0) {
      await prisma.warehouse.createMany({
        data: [
          { propertyId: session.propertyId!, name: 'Main Store', code: 'MAIN' },
          { propertyId: session.propertyId!, name: 'Kitchen Store', code: 'KITCHEN' },
        ]
      });
      warehouses = await prisma.warehouse.findMany({
        where: { propertyId: session.propertyId! }
      });
    } else if (!warehouses.some(w => w.name.toLowerCase().includes('kitchen'))) {
       const k = await prisma.warehouse.create({
         data: { propertyId: session.propertyId!, name: 'Kitchen Store', code: 'KITCHEN' }
       });
       warehouses.push(k);
    }

    return apiResponse(warehouses);
  } catch (error) {
    return apiError(error);
  }
}
