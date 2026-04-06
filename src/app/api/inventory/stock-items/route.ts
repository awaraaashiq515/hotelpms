import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const lowStockOnly = searchParams.get('lowStock') === 'true';

    const stockItems = await prisma.stockItem.findMany({
      where: {
        propertyId: session.propertyId!,
        isActive: true,
        ...(search ? { name: { contains: search } } : {}),
      },
      include: {
        products: { select: { id: true, name: true } },
        stockMovements: {
          orderBy: { movementDate: 'desc' },
          take: 1,
          select: { balanceQty: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Calculate current balance from movements
    const enriched = await Promise.all(
      stockItems.map(async (item) => {
        const agg = await prisma.stockMovement.aggregate({
          where: { stockItemId: item.id },
          _sum: { qtyIn: true, qtyOut: true },
        });
        const currentStock =
          item.openingStock +
          (agg._sum.qtyIn || 0) -
          (agg._sum.qtyOut || 0);
        const isLow = currentStock <= item.reorderLevel;
        return { ...item, currentStock, isLow };
      })
    );

    const result = lowStockOnly ? enriched.filter((i) => i.isLow) : enriched;
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.propertyId)
      return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const {
      name,
      sku,
      unit,
      openingStock,
      minimumStock,
      reorderLevel,
      costPrice,
    } = body;

    if (!name) return apiError(new Error('Name is required'), 400);

    // Create stock item
    const stockItem = await prisma.stockItem.create({
      data: {
        propertyId: session.propertyId,
        name,
        sku: sku || null,
        unit: unit || null,
        openingStock: Number(openingStock || 0),
        minimumStock: Number(minimumStock || 0),
        reorderLevel: Number(reorderLevel || 0),
        costPrice: Number(costPrice || 0),
        isActive: true,
      },
    });

    // If opening stock > 0, create an opening stock movement
    // We need a default warehouse for this property
    if (Number(openingStock) > 0) {
      let warehouse = await prisma.warehouse.findFirst({
        where: { propertyId: session.propertyId },
      });
      if (!warehouse) {
        warehouse = await prisma.warehouse.create({
          data: {
            propertyId: session.propertyId,
            name: 'Main Store',
            code: 'MAIN',
          },
        });
      }

      await prisma.stockMovement.create({
        data: {
          propertyId: session.propertyId,
          warehouseId: warehouse.id,
          stockItemId: stockItem.id,
          movementType: 'OPENING',
          qtyIn: Number(openingStock),
          qtyOut: 0,
          balanceQty: Number(openingStock),
          unitCost: Number(costPrice || 0),
          referenceModule: 'OPENING_STOCK',
        },
      });
    }

    return apiResponse(stockItem, 'Stock item created', 201);
  } catch (error) {
    return apiError(error);
  }
}
