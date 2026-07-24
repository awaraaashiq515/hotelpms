import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, getMultiTenantWhere } from '@/lib/api-utils';
import { getSession } from '@/lib/session';
import { getWTUserFromRequest } from '@/lib/walkie-talkie-auth';

export async function GET(request: NextRequest) {
  try {
    let session = await getSession();
    let staff: any = null;
    if (!session) {
      staff = await getWTUserFromRequest(request as any);
    }
    if (!session && !staff) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const lowStockOnly = searchParams.get('lowStock') === 'true';
    const itemType = searchParams.get('itemType');
    // WT staff must pass propertyId explicitly
    const propertyIdParam = searchParams.get('propertyId');

    let where: any;
    if (session) {
      where = getMultiTenantWhere(session);
    } else {
      // WT token path — filter by propertyId passed in query
      const propertyId = propertyIdParam || staff?.propertyId;
      if (!propertyId) return apiError(new Error('propertyId is required'), 400);
      where = { propertyId };
    }
    if (search) {
      where.name = { contains: search };
    }
    where.isActive = true;
    if (itemType) {
      where.itemType = itemType;
    }

    const warehouseId = searchParams.get('warehouseId');

    const stockItems = await prisma.stockItem.findMany({
      where,
      include: {
        products: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });

    // Calculate current balance from movements
    const enriched = await Promise.all(
      stockItems.map(async (item: any) => {
        const movementWhere: any = { stockItemId: item.id };
        if (warehouseId) {
          movementWhere.warehouseId = warehouseId;
        }

        const agg = await prisma.stockMovement.aggregate({
          where: movementWhere,
          _sum: { qtyIn: true, qtyOut: true },
        });

        // If filtering by warehouse, opening stock usually applies only to the default warehouse
        // or we treat it as 0 for other warehouses unless there's an OPENING movement there.
        // For simplicity, if warehouseId is provided, we only use movements in that warehouse.
        const currentStock = (agg._sum.qtyIn || 0) - (agg._sum.qtyOut || 0);
        const finalStock = currentStock;
        
        const isLow = finalStock <= item.reorderLevel;
        return { ...item, currentStock: finalStock, isLow };
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
      itemType,
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
        itemType: itemType || 'RESTAURANT',
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
