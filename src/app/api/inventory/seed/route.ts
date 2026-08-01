import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';
import { getWTUserFromRequest } from '@/lib/walkie-talkie-auth';

const DEFAULT_ITEMS = [
  { name: 'Bath Towels', unit: 'pcs', openingStock: 50, minimumStock: 10, costPrice: 150, itemType: 'HOUSEKEEPING' },
  { name: 'Hand Towels', unit: 'pcs', openingStock: 50, minimumStock: 10, costPrice: 60, itemType: 'HOUSEKEEPING' },
  { name: 'Bed Sheets (Single)', unit: 'pcs', openingStock: 40, minimumStock: 10, costPrice: 250, itemType: 'HOUSEKEEPING' },
  { name: 'Bed Sheets (Double)', unit: 'pcs', openingStock: 40, minimumStock: 10, costPrice: 400, itemType: 'HOUSEKEEPING' },
  { name: 'Pillow Covers', unit: 'pcs', openingStock: 100, minimumStock: 20, costPrice: 40, itemType: 'HOUSEKEEPING' },
  { name: 'Shampoo Bottles (50ml)', unit: 'bottles', openingStock: 200, minimumStock: 30, costPrice: 15, itemType: 'HOUSEKEEPING' },
  { name: 'Conditioner Bottles (50ml)', unit: 'bottles', openingStock: 150, minimumStock: 25, costPrice: 18, itemType: 'HOUSEKEEPING' },
  { name: 'Body Wash (50ml)', unit: 'bottles', openingStock: 200, minimumStock: 30, costPrice: 15, itemType: 'HOUSEKEEPING' },
  { name: 'Bath Soap Bars', unit: 'bars', openingStock: 300, minimumStock: 50, costPrice: 10, itemType: 'HOUSEKEEPING' },
  { name: 'Toilet Paper Rolls', unit: 'rolls', openingStock: 250, minimumStock: 40, costPrice: 20, itemType: 'HOUSEKEEPING' },
  { name: 'Dental Kit', unit: 'sets', openingStock: 150, minimumStock: 20, costPrice: 12, itemType: 'HOUSEKEEPING' },
  { name: 'Shaving Kit', unit: 'sets', openingStock: 100, minimumStock: 15, costPrice: 15, itemType: 'HOUSEKEEPING' },
  { name: 'Shower Caps & Comb Set', unit: 'sets', openingStock: 150, minimumStock: 20, costPrice: 8, itemType: 'HOUSEKEEPING' },
  { name: 'Room Air Freshener', unit: 'cans', openingStock: 20, minimumStock: 5, costPrice: 120, itemType: 'HOUSEKEEPING' },
  { name: 'Trash Bag Liners', unit: 'pcs', openingStock: 200, minimumStock: 30, costPrice: 5, itemType: 'HOUSEKEEPING' },
  { name: 'Water Bottles (500ml)', unit: 'bottles', openingStock: 500, minimumStock: 50, costPrice: 10, itemType: 'HOUSEKEEPING' },
  { name: 'Laundry Bags', unit: 'pcs', openingStock: 100, minimumStock: 20, costPrice: 25, itemType: 'HOUSEKEEPING' }
];

export async function POST(request: NextRequest) {
  try {
    let session = await getSession();
    let staff: any = null;
    if (!session) {
      staff = await getWTUserFromRequest(request as any);
    }
    if (!session && !staff) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json().catch(() => ({}));
    const propertyId = body.propertyId || session?.propertyId || staff?.propertyId;

    if (!propertyId) {
      return apiError(new Error('propertyId is required'), 400);
    }

    let warehouse = await prisma.warehouse.findFirst({ where: { propertyId } });
    if (!warehouse) {
      warehouse = await prisma.warehouse.create({
        data: { propertyId, name: 'Main Store', code: 'MAIN' },
      });
    }

    const createdItems = [];
    for (const item of DEFAULT_ITEMS) {
      const existing = await prisma.stockItem.findFirst({
        where: { propertyId, name: item.name },
      });

      if (!existing) {
        const stockItem = await prisma.stockItem.create({
          data: {
            propertyId,
            name: item.name,
            unit: item.unit,
            openingStock: item.openingStock,
            minimumStock: item.minimumStock,
            reorderLevel: item.minimumStock,
            costPrice: item.costPrice,
            itemType: item.itemType,
            isActive: true,
          },
        });

        await prisma.stockMovement.create({
          data: {
            propertyId,
            warehouseId: warehouse.id,
            stockItemId: stockItem.id,
            movementType: 'OPENING',
            qtyIn: item.openingStock,
            qtyOut: 0,
            balanceQty: item.openingStock,
            unitCost: item.costPrice,
            referenceModule: 'OPENING_STOCK',
          },
        });

        createdItems.push(stockItem);
      }
    }

    return apiResponse(createdItems, `Seeded ${createdItems.length} default housekeeping items`, 201);
  } catch (error) {
    return apiError(error);
  }
}
