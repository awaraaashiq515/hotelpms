import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, getMultiTenantWhere } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);
    const { id } = await params;

    const where = getMultiTenantWhere(session);
    (where as any).id = id;

    const item = await prisma.stockItem.findFirst({
      where,
      include: {
        products: { select: { id: true, name: true, sku: true } },
        stockMovements: {
          orderBy: { movementDate: 'desc' },
          take: 20,
          include: { warehouse: { select: { name: true } } },
        },
      },
    });

    if (!item) return apiError(new Error('Stock item not found'), 404);
    return apiResponse(item);
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);
    const { id } = await params;
    const body = await request.json();

    const {
      name,
      sku,
      unit,
      minimumStock,
      reorderLevel,
      costPrice,
      isActive,
      itemType,
    } = body;

    const updated = await prisma.stockItem.update({
      where: { id },
      data: {
        name,
        sku: sku || null,
        unit: unit || null,
        minimumStock: Number(minimumStock || 0),
        reorderLevel: Number(reorderLevel || 0),
        costPrice: Number(costPrice || 0),
        isActive: isActive !== false,
        itemType: itemType !== undefined ? itemType : undefined,
      },
    });

    return apiResponse(updated, 'Stock item updated');
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);
    const { id } = await params;

    // Soft delete
    await prisma.stockItem.update({
      where: { id },
      data: { isActive: false },
    });

    return apiResponse(null, 'Stock item deactivated');
  } catch (error) {
    return apiError(error);
  }
}
