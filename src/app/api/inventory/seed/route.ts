import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, resolveAdminProperty, resolvePropertyIdentifier } from '@/lib/api-utils';
import { getSession } from '@/lib/session';
import { getWTUserFromRequest } from '@/lib/walkie-talkie-auth';

/* ─── Seed Data ─────────────────────────────────────────────────────────── */

const RESTAURANT_ITEMS = [
  // Grains & Staples
  { name: 'Basmati Rice',         unit: 'KG',  openingStock: 50,  minimumStock: 10, reorderLevel: 15, costPrice: 90  },
  { name: 'Sona Masuri Rice',     unit: 'KG',  openingStock: 30,  minimumStock: 8,  reorderLevel: 12, costPrice: 60  },
  { name: 'Atta (Wheat Flour)',   unit: 'KG',  openingStock: 40,  minimumStock: 10, reorderLevel: 15, costPrice: 40  },
  { name: 'Maida',                unit: 'KG',  openingStock: 25,  minimumStock: 5,  reorderLevel: 8,  costPrice: 35  },
  { name: 'Sooji (Semolina)',     unit: 'KG',  openingStock: 15,  minimumStock: 3,  reorderLevel: 5,  costPrice: 45  },
  { name: 'Poha',                 unit: 'KG',  openingStock: 10,  minimumStock: 2,  reorderLevel: 4,  costPrice: 55  },
  { name: 'Dal Toor',             unit: 'KG',  openingStock: 20,  minimumStock: 5,  reorderLevel: 8,  costPrice: 120 },
  { name: 'Dal Chana',            unit: 'KG',  openingStock: 15,  minimumStock: 3,  reorderLevel: 6,  costPrice: 100 },
  { name: 'Dal Masoor',           unit: 'KG',  openingStock: 15,  minimumStock: 3,  reorderLevel: 6,  costPrice: 90  },
  { name: 'Rajma',                unit: 'KG',  openingStock: 10,  minimumStock: 2,  reorderLevel: 4,  costPrice: 140 },
  { name: 'Chole (Chickpeas)',    unit: 'KG',  openingStock: 10,  minimumStock: 2,  reorderLevel: 4,  costPrice: 110 },
  // Oils & Fats
  { name: 'Refined Oil',          unit: 'LTR', openingStock: 20,  minimumStock: 4,  reorderLevel: 6,  costPrice: 130 },
  { name: 'Mustard Oil',          unit: 'LTR', openingStock: 10,  minimumStock: 2,  reorderLevel: 4,  costPrice: 150 },
  { name: 'Ghee',                 unit: 'KG',  openingStock: 5,   minimumStock: 1,  reorderLevel: 2,  costPrice: 550 },
  { name: 'Butter',               unit: 'KG',  openingStock: 5,   minimumStock: 1,  reorderLevel: 2,  costPrice: 450 },
  // Vegetables (daily)
  { name: 'Potato',               unit: 'KG',  openingStock: 30,  minimumStock: 5,  reorderLevel: 10, costPrice: 25  },
  { name: 'Onion',                unit: 'KG',  openingStock: 30,  minimumStock: 5,  reorderLevel: 10, costPrice: 30  },
  { name: 'Tomato',               unit: 'KG',  openingStock: 20,  minimumStock: 4,  reorderLevel: 8,  costPrice: 40  },
  { name: 'Garlic',               unit: 'KG',  openingStock: 5,   minimumStock: 1,  reorderLevel: 2,  costPrice: 200 },
  { name: 'Ginger',               unit: 'KG',  openingStock: 3,   minimumStock: 1,  reorderLevel: 2,  costPrice: 180 },
  { name: 'Green Chilli',         unit: 'KG',  openingStock: 3,   minimumStock: 0.5,reorderLevel: 1,  costPrice: 60  },
  { name: 'Capsicum',             unit: 'KG',  openingStock: 5,   minimumStock: 1,  reorderLevel: 2,  costPrice: 80  },
  // Spices & Masalas
  { name: 'Red Chilli Powder',    unit: 'KG',  openingStock: 3,   minimumStock: 0.5,reorderLevel: 1,  costPrice: 200 },
  { name: 'Turmeric Powder',      unit: 'KG',  openingStock: 2,   minimumStock: 0.3,reorderLevel: 0.5,costPrice: 180 },
  { name: 'Cumin Seeds',          unit: 'KG',  openingStock: 2,   minimumStock: 0.3,reorderLevel: 0.5,costPrice: 250 },
  { name: 'Coriander Powder',     unit: 'KG',  openingStock: 2,   minimumStock: 0.3,reorderLevel: 0.5,costPrice: 160 },
  { name: 'Garam Masala',         unit: 'KG',  openingStock: 1,   minimumStock: 0.2,reorderLevel: 0.5,costPrice: 350 },
  { name: 'Biryani Masala',       unit: 'KG',  openingStock: 1,   minimumStock: 0.2,reorderLevel: 0.5,costPrice: 400 },
  { name: 'Salt',                 unit: 'KG',  openingStock: 10,  minimumStock: 2,  reorderLevel: 4,  costPrice: 20  },
  { name: 'Sugar',                unit: 'KG',  openingStock: 10,  minimumStock: 2,  reorderLevel: 4,  costPrice: 45  },
  // Dairy
  { name: 'Milk',                 unit: 'LTR', openingStock: 30,  minimumStock: 5,  reorderLevel: 10, costPrice: 60  },
  { name: 'Paneer',               unit: 'KG',  openingStock: 10,  minimumStock: 2,  reorderLevel: 4,  costPrice: 320 },
  { name: 'Curd / Yoghurt',       unit: 'KG',  openingStock: 10,  minimumStock: 2,  reorderLevel: 4,  costPrice: 70  },
  { name: 'Fresh Cream',          unit: 'LTR', openingStock: 5,   minimumStock: 1,  reorderLevel: 2,  costPrice: 250 },
  { name: 'Cheese (Processed)',   unit: 'KG',  openingStock: 3,   minimumStock: 0.5,reorderLevel: 1,  costPrice: 400 },
  // Proteins
  { name: 'Chicken (Whole)',      unit: 'KG',  openingStock: 20,  minimumStock: 4,  reorderLevel: 8,  costPrice: 180 },
  { name: 'Chicken Boneless',     unit: 'KG',  openingStock: 15,  minimumStock: 3,  reorderLevel: 6,  costPrice: 250 },
  { name: 'Mutton',               unit: 'KG',  openingStock: 10,  minimumStock: 2,  reorderLevel: 4,  costPrice: 650 },
  { name: 'Eggs',                 unit: 'PCS', openingStock: 200, minimumStock: 30, reorderLevel: 50, costPrice: 8   },
  { name: 'Fish (Pomfret)',       unit: 'KG',  openingStock: 5,   minimumStock: 1,  reorderLevel: 2,  costPrice: 400 },
  { name: 'Prawns',               unit: 'KG',  openingStock: 5,   minimumStock: 1,  reorderLevel: 2,  costPrice: 550 },
  // Beverages (Kitchen)
  { name: 'Tea Leaves',           unit: 'KG',  openingStock: 3,   minimumStock: 0.5,reorderLevel: 1,  costPrice: 350 },
  { name: 'Coffee Powder',        unit: 'KG',  openingStock: 2,   minimumStock: 0.3,reorderLevel: 0.5,costPrice: 550 },
].map(i => ({ ...i, itemType: 'RESTAURANT' }));

const BAR_ITEMS = [
  // Whisky
  { name: 'Royal Stag (750ml)',         unit: 'BTL', openingStock: 24, minimumStock: 4, reorderLevel: 6,  costPrice: 680  },
  { name: "Officer's Choice (750ml)",   unit: 'BTL', openingStock: 24, minimumStock: 4, reorderLevel: 6,  costPrice: 560  },
  { name: 'Black Dog (750ml)',           unit: 'BTL', openingStock: 12, minimumStock: 2, reorderLevel: 4,  costPrice: 1400 },
  { name: 'Blenders Pride (750ml)',      unit: 'BTL', openingStock: 12, minimumStock: 2, reorderLevel: 4,  costPrice: 1200 },
  { name: 'Jack Daniels (750ml)',        unit: 'BTL', openingStock: 6,  minimumStock: 1, reorderLevel: 2,  costPrice: 3500 },
  { name: "Johnnie Walker Black (750ml)",unit: 'BTL', openingStock: 6,  minimumStock: 1, reorderLevel: 2,  costPrice: 4200 },
  // Vodka
  { name: 'Magic Moments (750ml)',       unit: 'BTL', openingStock: 12, minimumStock: 2, reorderLevel: 4,  costPrice: 650  },
  { name: 'Smirnoff (750ml)',            unit: 'BTL', openingStock: 12, minimumStock: 2, reorderLevel: 4,  costPrice: 1200 },
  { name: 'Absolut (750ml)',             unit: 'BTL', openingStock: 6,  minimumStock: 1, reorderLevel: 2,  costPrice: 1900 },
  // Rum
  { name: 'Old Monk (750ml)',            unit: 'BTL', openingStock: 12, minimumStock: 2, reorderLevel: 4,  costPrice: 580  },
  { name: "McDowell's No.1 (750ml)",    unit: 'BTL', openingStock: 12, minimumStock: 2, reorderLevel: 4,  costPrice: 520  },
  { name: 'Captain Morgan (750ml)',      unit: 'BTL', openingStock: 6,  minimumStock: 1, reorderLevel: 2,  costPrice: 1500 },
  // Gin
  { name: 'Bombay Sapphire (750ml)',     unit: 'BTL', openingStock: 6,  minimumStock: 1, reorderLevel: 2,  costPrice: 2800 },
  { name: "Gordon's Gin (750ml)",        unit: 'BTL', openingStock: 6,  minimumStock: 1, reorderLevel: 2,  costPrice: 1800 },
  // Beer (cases)
  { name: 'Kingfisher Premium (330ml)', unit: 'CAN', openingStock: 120, minimumStock: 24, reorderLevel: 48, costPrice: 65  },
  { name: 'Kingfisher Strong (330ml)',   unit: 'CAN', openingStock: 120, minimumStock: 24, reorderLevel: 48, costPrice: 72  },
  { name: 'Budweiser (330ml)',           unit: 'CAN', openingStock: 96,  minimumStock: 12, reorderLevel: 24, costPrice: 85  },
  { name: 'Corona (355ml)',              unit: 'BTL', openingStock: 48,  minimumStock: 6,  reorderLevel: 12, costPrice: 120 },
  // Wine
  { name: 'Sula Shiraz (750ml)',         unit: 'BTL', openingStock: 12, minimumStock: 2, reorderLevel: 4,  costPrice: 900  },
  { name: 'Sula Sauvignon Blanc (750ml)',unit: 'BTL', openingStock: 12, minimumStock: 2, reorderLevel: 4,  costPrice: 950  },
  { name: 'Fratelli Sangiovese (750ml)', unit: 'BTL', openingStock: 6,  minimumStock: 1, reorderLevel: 2,  costPrice: 1400 },
  // Mixers & Non-Alcoholic
  { name: 'Soda Water (300ml)',          unit: 'BTL', openingStock: 200, minimumStock: 24, reorderLevel: 48, costPrice: 15  },
  { name: 'Tonic Water (300ml)',         unit: 'BTL', openingStock: 100, minimumStock: 12, reorderLevel: 24, costPrice: 40  },
  { name: 'Coca Cola (300ml)',           unit: 'CAN', openingStock: 100, minimumStock: 12, reorderLevel: 24, costPrice: 30  },
  { name: 'Sprite (300ml)',              unit: 'CAN', openingStock: 60,  minimumStock: 12, reorderLevel: 24, costPrice: 30  },
  { name: 'Orange Juice (1L)',           unit: 'PKT', openingStock: 24,  minimumStock: 6,  reorderLevel: 12, costPrice: 80  },
  { name: 'Lemon Cordial',               unit: 'BTL', openingStock: 6,   minimumStock: 1,  reorderLevel: 2,  costPrice: 120 },
  { name: 'Grenadine Syrup',             unit: 'BTL', openingStock: 4,   minimumStock: 1,  reorderLevel: 2,  costPrice: 200 },
].map(i => ({ ...i, itemType: 'BAR' }));

const HOUSEKEEPING_ITEMS = [
  { name: 'Bath Towels',              unit: 'PCS', openingStock: 50,  minimumStock: 10, reorderLevel: 15, costPrice: 150 },
  { name: 'Hand Towels',              unit: 'PCS', openingStock: 50,  minimumStock: 10, reorderLevel: 15, costPrice: 60  },
  { name: 'Bed Sheets (Single)',      unit: 'PCS', openingStock: 40,  minimumStock: 10, reorderLevel: 15, costPrice: 250 },
  { name: 'Bed Sheets (Double)',      unit: 'PCS', openingStock: 40,  minimumStock: 10, reorderLevel: 15, costPrice: 400 },
  { name: 'Pillow Covers',            unit: 'PCS', openingStock: 100, minimumStock: 20, reorderLevel: 30, costPrice: 40  },
  { name: 'Shampoo Bottles (50ml)',   unit: 'PCS', openingStock: 200, minimumStock: 30, reorderLevel: 50, costPrice: 15  },
  { name: 'Conditioner (50ml)',       unit: 'PCS', openingStock: 150, minimumStock: 25, reorderLevel: 40, costPrice: 18  },
  { name: 'Body Wash (50ml)',         unit: 'PCS', openingStock: 200, minimumStock: 30, reorderLevel: 50, costPrice: 15  },
  { name: 'Bath Soap Bars',           unit: 'PCS', openingStock: 300, minimumStock: 50, reorderLevel: 80, costPrice: 10  },
  { name: 'Toilet Paper Rolls',       unit: 'PCS', openingStock: 250, minimumStock: 40, reorderLevel: 60, costPrice: 20  },
  { name: 'Dental Kit',               unit: 'SET', openingStock: 150, minimumStock: 20, reorderLevel: 30, costPrice: 12  },
  { name: 'Shaving Kit',              unit: 'SET', openingStock: 100, minimumStock: 15, reorderLevel: 25, costPrice: 15  },
  { name: 'Shower Caps & Comb Set',   unit: 'SET', openingStock: 150, minimumStock: 20, reorderLevel: 30, costPrice: 8   },
  { name: 'Room Air Freshener',       unit: 'CAN', openingStock: 20,  minimumStock: 5,  reorderLevel: 8,  costPrice: 120 },
  { name: 'Trash Bag Liners',         unit: 'PCS', openingStock: 200, minimumStock: 30, reorderLevel: 50, costPrice: 5   },
  { name: 'Water Bottles (500ml)',    unit: 'PCS', openingStock: 500, minimumStock: 50, reorderLevel: 100,costPrice: 10  },
  { name: 'Laundry Bags',             unit: 'PCS', openingStock: 100, minimumStock: 20, reorderLevel: 30, costPrice: 25  },
].map(i => ({ ...i, itemType: 'HOUSEKEEPING' }));

const ALL_ITEM_SETS: Record<string, typeof RESTAURANT_ITEMS> = {
  RESTAURANT: RESTAURANT_ITEMS,
  BAR: BAR_ITEMS,
  HOUSEKEEPING: HOUSEKEEPING_ITEMS,
};

/* ─── Handler ────────────────────────────────────────────────────────────── */

export async function POST(request: NextRequest) {
  try {
    let session = await getSession();
    let staff: any = null;
    if (!session) {
      staff = await getWTUserFromRequest(request as any);
    }
    if (!session && !staff) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json().catch(() => ({}));
    let rawPropertyId = body.propertyId || body.propertyCode || session?.propertyId || staff?.propertyId;
    const prop = await resolvePropertyIdentifier(rawPropertyId, session);
    const propertyId = prop?.id;

    if (!propertyId) {
      return apiError(new Error('propertyId is required'), 400);
    }

    const itemType: string = body.itemType || 'HOUSEKEEPING'; // RESTAURANT | BAR | HOUSEKEEPING
    const SEED_ITEMS = ALL_ITEM_SETS[itemType] || HOUSEKEEPING_ITEMS;

    let warehouse = await prisma.warehouse.findFirst({ where: { propertyId } });
    if (!warehouse) {
      warehouse = await prisma.warehouse.create({
        data: { propertyId, name: 'Main Store', code: 'MAIN' },
      });
    }

    const createdItems = [];
    for (const item of SEED_ITEMS) {
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
            reorderLevel: item.reorderLevel,
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

    return apiResponse(
      { created: createdItems.length, skipped: SEED_ITEMS.length - createdItems.length, items: createdItems },
      `Seeded ${createdItems.length} ${itemType.toLowerCase()} items (${SEED_ITEMS.length - createdItems.length} already existed)`,
      201,
    );
  } catch (error) {
    return apiError(error);
  }
}
