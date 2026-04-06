import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const stockItemId = searchParams.get('stockItemId');
    const movementType = searchParams.get('movementType');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const movements = await prisma.stockMovement.findMany({
      where: {
        propertyId: session.propertyId!,
        ...(stockItemId ? { stockItemId } : {}),
        ...(movementType ? { movementType } : {}),
      },
      include: {
        stockItem: { select: { name: true, unit: true } },
        warehouse: { select: { name: true } },
      },
      orderBy: { movementDate: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.stockMovement.count({
      where: {
        propertyId: session.propertyId!,
        ...(stockItemId ? { stockItemId } : {}),
        ...(movementType ? { movementType } : {}),
      },
    });

    return apiResponse({ movements, total, page, limit });
  } catch (error) {
    return apiError(error);
  }
}
