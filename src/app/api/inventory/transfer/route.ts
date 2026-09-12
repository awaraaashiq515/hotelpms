import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, resolveAdminProperty, resolvePropertyIdentifier } from '@/lib/api-utils';
import { getSession } from '@/lib/session';
import { getWTUserFromRequest } from '@/lib/walkie-talkie-auth';

// Helper to resolve propertyId safely
async function getResolvedPropertyId(request: NextRequest, session: any, explicitIdOrCode?: string | null): Promise<string | null> {
  const { searchParams } = new URL(request.url);
  const target = explicitIdOrCode || searchParams.get('propertyId') || searchParams.get('propertyCode') || session?.propertyId;
  const prop = await resolvePropertyIdentifier(target, session);
  return prop?.id ?? null;
}

// POST: Transfer stock between warehouses
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    let staff: any = null;
    if (!session) staff = await getWTUserFromRequest(request as any);
    if (!session && !staff) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json().catch(() => ({}));
    const { stockItemId, fromWarehouseId, toWarehouseId, qty } = body;

    if (!stockItemId || !fromWarehouseId || !toWarehouseId || !qty || Number(qty) <= 0)
      return apiError(new Error('stockItemId, warehouses and qty > 0 required'), 400);

    const stockItem = await prisma.stockItem.findUnique({
      where: { id: stockItemId },
      select: { id: true, propertyId: true },
    });
    if (!stockItem) return apiError(new Error('Stock item not found'), 404);

    const propertyId = stockItem.propertyId;

    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Deduct from source
      const lastMovFrom = await tx.stockMovement.findFirst({
        where: { stockItemId, warehouseId: fromWarehouseId },
        orderBy: { movementDate: 'desc' }
      });
      const balanceFrom = lastMovFrom?.balanceQty || 0;

      await tx.stockMovement.create({
        data: {
          propertyId,
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
          propertyId,
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
    let staff: any = null;
    if (!session) staff = await getWTUserFromRequest(request as any);
    if (!session && !staff) return apiError(new Error('Unauthorized'), 401);

    const propertyId = await getResolvedPropertyId(request, session, staff?.propertyId);
    if (!propertyId) return apiError(new Error('Property context required'), 400);

    let warehouses = await prisma.warehouse.findMany({
      where: { propertyId }
    });

    // Ensure at least Main Store exists for this property
    if (warehouses.length === 0) {
      await prisma.warehouse.create({
        data: { propertyId, name: 'Main Store', code: 'MAIN' },
      });
      warehouses = await prisma.warehouse.findMany({
        where: { propertyId }
      });
    }

    return apiResponse(warehouses);
  } catch (error) {
    return apiError(error);
  }
}
