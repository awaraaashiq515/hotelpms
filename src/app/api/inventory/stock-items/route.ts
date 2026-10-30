import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, getMultiTenantWhere, resolveAdminProperty, resolvePropertyIdentifier } from '@/lib/api-utils';
import { getSession } from '@/lib/session';
import { getWTUserFromRequest } from '@/lib/walkie-talkie-auth';

export async function GET(request: NextRequest) {
  try {
    let session = await getSession();
    let staff: any = null;
    if (!session) {
      staff = await getWTUserFromRequest(request as any);
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const lowStockOnly = searchParams.get('lowStock') === 'true';
    const itemType = searchParams.get('itemType');
    
    // WT staff or portal must pass propertyId/propertyCode explicitly
    let propertyIdParam = searchParams.get('propertyId') || searchParams.get('propertyCode');
    let targetPropertyIds: string[] = [];
    if (propertyIdParam && propertyIdParam !== 'all') {
      const prop = await resolvePropertyIdentifier(propertyIdParam, session);
      if (prop) {
        propertyIdParam = prop.id;
        targetPropertyIds = [prop.id];
        const fullProp = await prisma.property.findUnique({
          where: { id: prop.id },
          select: { organizationId: true },
        });
        if (fullProp?.organizationId) {
          const siblings = await prisma.property.findMany({
            where: { organizationId: fullProp.organizationId },
            select: { id: true },
          });
          targetPropertyIds = siblings.map((s) => s.id);
        }
      }
    }

    if (!session && !staff && !propertyIdParam) {
      return apiError(new Error('Unauthorized: propertyId or propertyCode is required'), 401);
    }

    let where: any;
    if (session) {
      where = getMultiTenantWhere(session, propertyIdParam);
      if (targetPropertyIds.length > 1) {
        where.propertyId = { in: targetPropertyIds };
      }
    } else {
      if (targetPropertyIds.length > 0) {
        where = { propertyId: { in: targetPropertyIds } };
      } else {
        const propertyId = propertyIdParam || staff?.propertyId;
        if (!propertyId) return apiError(new Error('propertyId is required'), 400);
        where = { propertyId };
      }
    }
    if (search) {
      where.name = { contains: search };
    }
    where.isActive = true;
    if (itemType) {
      where.itemType = itemType;
    }

    const warehouseId = searchParams.get('warehouseId');

    // 1. Fetch from StockItem
    const stockItems = await prisma.stockItem.findMany({
      where,
      include: {
        products: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });

    // Calculate current balance from movements for StockItem
    const enrichedStock = await Promise.all(
      stockItems.map(async (item: any) => {
        const movementWhere: any = { stockItemId: item.id };
        if (warehouseId) {
          movementWhere.warehouseId = warehouseId;
        }

        const agg = await prisma.stockMovement.aggregate({
          where: movementWhere,
          _sum: { qtyIn: true, qtyOut: true },
        });

        const currentStock = (agg._sum.qtyIn || 0) - (agg._sum.qtyOut || 0);
        const finalStock = currentStock;
        const isLow = finalStock <= item.reorderLevel;
        return {
          id: item.id,
          propertyId: item.propertyId,
          name: item.name,
          sku: item.sku || item.itemType || 'RESTAURANT',
          unit: item.unit || 'kg',
          openingStock: item.openingStock,
          minimumStock: item.minimumStock,
          reorderLevel: item.reorderLevel,
          costPrice: item.costPrice,
          itemType: item.itemType || 'RESTAURANT',
          currentStock: finalStock,
          isLow,
          products: item.products || [],
          source: 'STOCK_ITEM',
        };
      })
    );

    // 2. Fetch existing items from InventoryItem (Hotel & Store Inventory)
    const activePropertyIds = targetPropertyIds.length > 0
      ? targetPropertyIds
      : (where.propertyId?.in ? where.propertyId.in : [where.propertyId].filter(Boolean));

    const inventoryWhere: any = {
      isActive: true,
      propertyId: activePropertyIds.length > 1 ? { in: activePropertyIds } : (activePropertyIds[0] ? activePropertyIds[0] : where.propertyId),
    };
    if (search) {
      inventoryWhere.name = { contains: search };
    }

    const inventoryItems = await prisma.inventoryItem.findMany({
      where: inventoryWhere,
      orderBy: [{ sku: 'asc' }, { name: 'asc' }],
    });

    const enrichedInventory = inventoryItems.map((item) => {
      const currentStock = Number(item.currentQuantity) || 0;
      const minThreshold = Number(item.minThreshold) || 0;
      const isLow = currentStock <= minThreshold;
      return {
        id: item.id,
        propertyId: item.propertyId,
        name: item.name,
        sku: item.sku || 'F&B',
        unit: item.unit || 'pcs',
        openingStock: 0,
        minimumStock: minThreshold,
        reorderLevel: minThreshold,
        costPrice: Number(item.costPrice) || 0,
        itemType: item.sku || 'F&B',
        currentStock,
        isLow,
        products: [],
        source: 'INVENTORY_ITEM',
      };
    });

    // Merge without duplicates by lowercase name
    const existingNames = new Set(enrichedStock.map((i) => i.name.toLowerCase().trim()));
    const combined = [...enrichedStock];

    for (const inv of enrichedInventory) {
      if (!existingNames.has(inv.name.toLowerCase().trim())) {
        existingNames.add(inv.name.toLowerCase().trim());
        combined.push(inv);
      }
    }

    let filtered = combined;
    if (itemType && itemType !== 'ALL') {
      filtered = filtered.filter(
        (i) =>
          String(i.itemType || '').toUpperCase() === itemType.toUpperCase() ||
          String(i.sku || '').toUpperCase() === itemType.toUpperCase()
      );
    }

    if (lowStockOnly) {
      filtered = filtered.filter((i) => i.isLow || i.currentStock <= 0);
    }

    return apiResponse(filtered);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    let staff: any = null;
    if (!session) staff = await getWTUserFromRequest(request as any);
    if (!session && !staff) return apiError(new Error('Unauthorized'), 401);

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

    let rawPropertyId = body.propertyId || body.propertyCode || session?.propertyId || staff?.propertyId;
    const prop = await resolvePropertyIdentifier(rawPropertyId, session);
    const propertyId = prop?.id;
    if (!propertyId) return apiError(new Error('propertyId is required'), 400);

    // Create stock item
    const stockItem = await prisma.stockItem.create({
      data: {
        propertyId,
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
        where: { propertyId },
      });
      if (!warehouse) {
        warehouse = await prisma.warehouse.create({
          data: {
            propertyId,
            name: 'Main Store',
            code: 'MAIN',
          },
        });
      }

      await prisma.stockMovement.create({
        data: {
          propertyId,
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
