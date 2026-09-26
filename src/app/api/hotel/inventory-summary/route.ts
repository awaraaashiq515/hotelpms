import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

const DEFAULT_HOTEL_INVENTORY = [
  /* ── Linen ── */
  { name: 'Bath Towel (Large)',        category: 'Linen',        unit: 'Pcs',    currentQuantity: 120, minThreshold: 50,  costPrice: 350 },
  { name: 'Bath Towel (Small)',        category: 'Linen',        unit: 'Pcs',    currentQuantity: 90,  minThreshold: 40,  costPrice: 180 },
  { name: 'Hand Towel',                category: 'Linen',        unit: 'Pcs',    currentQuantity: 100, minThreshold: 40,  costPrice: 120 },
  { name: 'Face Towel',                category: 'Linen',        unit: 'Pcs',    currentQuantity: 80,  minThreshold: 40,  costPrice: 80  },
  { name: 'Bed Sheet (King)',          category: 'Linen',        unit: 'Set',    currentQuantity: 40,  minThreshold: 30,  costPrice: 800 },
  { name: 'Bed Sheet (Queen)',         category: 'Linen',        unit: 'Set',    currentQuantity: 35,  minThreshold: 25,  costPrice: 650 },
  { name: 'Pillow Cover',              category: 'Linen',        unit: 'Pcs',    currentQuantity: 90,  minThreshold: 40,  costPrice: 150 },
  { name: 'Duvet Cover',               category: 'Linen',        unit: 'Set',    currentQuantity: 30,  minThreshold: 20,  costPrice: 1200 },
  { name: 'Blanket (Single)',          category: 'Linen',        unit: 'Pcs',    currentQuantity: 25,  minThreshold: 15,  costPrice: 500 },
  { name: 'Bath Robe',                 category: 'Linen',        unit: 'Pcs',    currentQuantity: 20,  minThreshold: 10,  costPrice: 900 },
  { name: 'Bath Mat',                  category: 'Linen',        unit: 'Pcs',    currentQuantity: 60,  minThreshold: 25,  costPrice: 200 },

  /* ── Toiletries ── */
  { name: 'Shampoo (30ml)',             category: 'Toiletries',   unit: 'Pcs',    currentQuantity: 15,  minThreshold: 100, costPrice: 25  },
  { name: 'Conditioner (30ml)',         category: 'Toiletries',   unit: 'Pcs',    currentQuantity: 20,  minThreshold: 80,  costPrice: 30  },
  { name: 'Soap Bar (30g)',             category: 'Toiletries',   unit: 'Pcs',    currentQuantity: 80,  minThreshold: 100, costPrice: 15  },
  { name: 'Body Lotion (30ml)',         category: 'Toiletries',   unit: 'Pcs',    currentQuantity: 50,  minThreshold: 80,  costPrice: 35  },
  { name: 'Shower Cap',                 category: 'Toiletries',   unit: 'Pcs',    currentQuantity: 120, minThreshold: 80,  costPrice: 8   },
  { name: 'Toothbrush Kit',            category: 'Toiletries',   unit: 'Kit',    currentQuantity: 60,  minThreshold: 50,  costPrice: 20  },
  { name: 'Dental Kit (Mini)',          category: 'Toiletries',   unit: 'Kit',    currentQuantity: 40,  minThreshold: 60,  costPrice: 25  },
  { name: 'Razor (Disposable)',         category: 'Toiletries',   unit: 'Pcs',    currentQuantity: 70,  minThreshold: 50,  costPrice: 12  },
  { name: 'Shaving Cream Sachet',      category: 'Toiletries',   unit: 'Pcs',    currentQuantity: 60,  minThreshold: 50,  costPrice: 18  },
  { name: 'Vanity Kit',                category: 'Toiletries',   unit: 'Kit',    currentQuantity: 55,  minThreshold: 50,  costPrice: 30  },
  { name: 'Sewing Kit',                category: 'Toiletries',   unit: 'Kit',    currentQuantity: 40,  minThreshold: 30,  costPrice: 15  },
  { name: 'Cotton Swabs (Box)',         category: 'Toiletries',   unit: 'Box',    currentQuantity: 30,  minThreshold: 20,  costPrice: 40  },

  /* ── F&B ── */
  { name: 'Mineral Water 1L',           category: 'F&B',          unit: 'Bottle', currentQuantity: 60,  minThreshold: 50,  costPrice: 20  },
  { name: 'Mineral Water 500ml',        category: 'F&B',          unit: 'Bottle', currentQuantity: 80,  minThreshold: 60,  costPrice: 12  },
  { name: 'Basmati Rice',               category: 'F&B',          unit: 'Kg',     currentQuantity: 25,  minThreshold: 20,  costPrice: 90  },
  { name: 'Cooking Oil',                category: 'F&B',          unit: 'Litre',  currentQuantity: 8,   minThreshold: 10,  costPrice: 120 },
  { name: 'Tea Bags (Box of 100)',      category: 'F&B',          unit: 'Box',    currentQuantity: 15,  minThreshold: 10,  costPrice: 180 },
  { name: 'Coffee Sachets',             category: 'F&B',          unit: 'Box',    currentQuantity: 12,  minThreshold: 10,  costPrice: 250 },
  { name: 'Sugar Sachets (Box)',        category: 'F&B',          unit: 'Box',    currentQuantity: 20,  minThreshold: 15,  costPrice: 60  },
  { name: 'Creamer Sachets (Box)',      category: 'F&B',          unit: 'Box',    currentQuantity: 18,  minThreshold: 12,  costPrice: 80  },
  { name: 'Ketchup Sachets (Box)',      category: 'F&B',          unit: 'Box',    currentQuantity: 10,  minThreshold: 8,   costPrice: 90  },

  /* ── Housekeeping ── */
  { name: 'Floor Cleaner',              category: 'Housekeeping', unit: 'Litre',  currentQuantity: 45,  minThreshold: 20,  costPrice: 75  },
  { name: 'Toilet Cleaner',             category: 'Housekeeping', unit: 'Bottle', currentQuantity: 30,  minThreshold: 15,  costPrice: 60  },
  { name: 'Glass Cleaner',              category: 'Housekeeping', unit: 'Bottle', currentQuantity: 22,  minThreshold: 12,  costPrice: 80  },
  { name: 'Garbage Bags (Medium)',      category: 'Housekeeping', unit: 'Roll',   currentQuantity: 22,  minThreshold: 15,  costPrice: 80  },
  { name: 'Garbage Bags (Large)',       category: 'Housekeeping', unit: 'Roll',   currentQuantity: 18,  minThreshold: 12,  costPrice: 120 },
  { name: 'Mop Heads',                  category: 'Housekeeping', unit: 'Pcs',    currentQuantity: 10,  minThreshold: 5,   costPrice: 150 },
  { name: 'Scrub Pad',                  category: 'Housekeeping', unit: 'Pcs',    currentQuantity: 25,  minThreshold: 15,  costPrice: 30  },
  { name: 'Broom (Soft)',               category: 'Housekeeping', unit: 'Pcs',    currentQuantity: 8,   minThreshold: 4,   costPrice: 200 },
  { name: 'Air Freshener (Can)',        category: 'Housekeeping', unit: 'Can',    currentQuantity: 15,  minThreshold: 10,  costPrice: 120 },
  { name: 'Toilet Paper Roll',          category: 'Housekeeping', unit: 'Roll',   currentQuantity: 200, minThreshold: 100, costPrice: 15  },
  { name: 'Tissue Box',                 category: 'Housekeeping', unit: 'Box',    currentQuantity: 60,  minThreshold: 40,  costPrice: 35  },

  /* ── Safety ── */
  { name: 'Hand Sanitizer (500ml)',     category: 'Safety',       unit: 'Bottle', currentQuantity: 5,   minThreshold: 20,  costPrice: 150 },
  { name: 'Disinfectant Spray',         category: 'Safety',       unit: 'Bottle', currentQuantity: 18,  minThreshold: 25,  costPrice: 200 },
  { name: 'Disposable Gloves (Box)',    category: 'Safety',       unit: 'Box',    currentQuantity: 12,  minThreshold: 10,  costPrice: 180 },
  { name: 'Face Mask (Box of 50)',      category: 'Safety',       unit: 'Box',    currentQuantity: 8,   minThreshold: 10,  costPrice: 220 },
  { name: 'First Aid Kit',              category: 'Safety',       unit: 'Kit',    currentQuantity: 5,   minThreshold: 3,   costPrice: 800 },
  { name: 'Fire Extinguisher Recharge', category: 'Safety',       unit: 'Pcs',    currentQuantity: 3,   minThreshold: 2,   costPrice: 1200 },

  /* ── Stationery ── */
  { name: 'Printer Paper A4 (Ream)',   category: 'Stationery',   unit: 'Ream',   currentQuantity: 30,  minThreshold: 10,  costPrice: 450 },
  { name: 'Pen (Blue)',                category: 'Stationery',   unit: 'Pcs',    currentQuantity: 150, minThreshold: 50,  costPrice: 10  },
  { name: 'Notepad (A5)',              category: 'Stationery',   unit: 'Pcs',    currentQuantity: 60,  minThreshold: 30,  costPrice: 35  },
  { name: 'Marker (Black)',            category: 'Stationery',   unit: 'Pcs',    currentQuantity: 25,  minThreshold: 10,  costPrice: 20  },

  /* ── Maintenance ── */
  { name: 'LED Bulb (9W)',             category: 'Maintenance',  unit: 'Pcs',    currentQuantity: 30,  minThreshold: 15,  costPrice: 80  },
  { name: 'LED Tube Light (18W)',      category: 'Maintenance',  unit: 'Pcs',    currentQuantity: 15,  minThreshold: 8,   costPrice: 150 },
  { name: 'AA Battery (Pack of 4)',    category: 'Maintenance',  unit: 'Pack',   currentQuantity: 20,  minThreshold: 10,  costPrice: 60  },
  { name: 'WD-40 Spray',              category: 'Maintenance',  unit: 'Can',    currentQuantity: 8,   minThreshold: 5,   costPrice: 250 },
];

async function resolveProperty(propertyParam: string | null, session: any) {
  if (propertyParam) {
    const prop = await prisma.property.findFirst({
      where: {
        OR: [{ id: propertyParam }, { code: propertyParam }],
      },
    });
    if (prop) return prop;
  }

  if (session?.propertyId) {
    const prop = await prisma.property.findUnique({
      where: { id: session.propertyId },
    });
    if (prop) return prop;
  }

  if (session?.organizationId) {
    const prop = await prisma.property.findFirst({
      where: {
        organizationId: session.organizationId,
        OR: [{ hmsEnabled: true }, { type: 'HOTEL' }],
      },
    });
    if (prop) return prop;
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(request.url);
    const rawParam = searchParams.get('propertyId');

    const property = await resolveProperty(rawParam, session);
    if (!property) {
      return NextResponse.json({
        success: true,
        data: { items: [], summary: { total: 0, critical: 0, low: 0, ok: 0 } },
      });
    }

    const propertyId = property.id;

    // Check existing inventory items
    let items = await prisma.inventoryItem.findMany({
      where: { propertyId, isActive: true },
      orderBy: [{ currentQuantity: 'asc' }, { name: 'asc' }],
    });

    // If no items found, auto-seed standard hotel inventory items for this property
    if (items.length === 0) {
      try {
        await prisma.inventoryItem.createMany({
          data: DEFAULT_HOTEL_INVENTORY.map((item) => ({
            propertyId,
            name: item.name,
            sku: item.category, // store category in sku
            unit: item.unit,
            currentQuantity: item.currentQuantity,
            minThreshold: item.minThreshold,
            costPrice: item.costPrice,
            isActive: true,
          })),
        });

        // Also ensure a default warehouse exists
        let warehouse = await prisma.warehouse.findFirst({ where: { propertyId } });
        if (!warehouse) {
          warehouse = await prisma.warehouse.create({
            data: { propertyId, name: 'Main Store', code: 'MAIN' },
          });
        }

        // Re-fetch after seeding
        items = await prisma.inventoryItem.findMany({
          where: { propertyId, isActive: true },
          orderBy: [{ currentQuantity: 'asc' }, { name: 'asc' }],
        });
      } catch (seedErr) {
        console.error('[inventory-summary] Auto-seed failed:', seedErr);
      }
    }

    const enriched = items.map((item) => {
      const ratio = item.minThreshold > 0 ? item.currentQuantity / item.minThreshold : 1;
      let stockStatus: 'OK' | 'LOW' | 'CRITICAL' = 'OK';
      if (item.currentQuantity <= 0) stockStatus = 'CRITICAL';
      else if (ratio <= 1) stockStatus = 'CRITICAL';
      else if (ratio <= 1.5) stockStatus = 'LOW';
      return {
        ...item,
        category: item.sku || 'General',
        stockStatus,
        ratio,
        maxStock: Math.max(item.minThreshold * 4, item.currentQuantity * 2, 100),
      };
    });

    const critical = enriched.filter((i) => i.stockStatus === 'CRITICAL').length;
    const low = enriched.filter((i) => i.stockStatus === 'LOW').length;
    const ok = enriched.filter((i) => i.stockStatus === 'OK').length;

    return NextResponse.json({
      success: true,
      data: {
        items: enriched,
        summary: { total: enriched.length, critical, low, ok },
        property: { id: property.id, name: property.name, code: property.code },
      },
    });
  } catch (error: any) {
    console.error('[inventory-summary] GET error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const body = await request.json();
    const { action, propertyId: rawParam, entries, newItem, updatedItem, itemId, quantityDelta } = body;

    const property = await resolveProperty(rawParam, session);
    if (!property) {
      return NextResponse.json({ success: false, message: 'Property not found' }, { status: 400 });
    }

    const propertyId = property.id;

    // 1. Restock multiple items
    if (action === 'RESTOCK' && Array.isArray(entries)) {
      for (const entry of entries) {
        if (!entry.id || !entry.qty) continue;
        const current = await prisma.inventoryItem.findUnique({ where: { id: entry.id } });
        if (!current) continue;
        const newQty = Math.max(0, current.currentQuantity + Number(entry.qty));
        await prisma.inventoryItem.update({
          where: { id: entry.id },
          data: { currentQuantity: newQty },
        });
        await prisma.inventoryLog.create({
          data: {
            inventoryItemId: entry.id,
            type: 'IN',
            quantity: Number(entry.qty),
            previousQty: current.currentQuantity,
            newQty,
            note: entry.note || 'Admin Restock',
          },
        });
      }
      return NextResponse.json({ success: true, message: `Restocked ${entries.length} items successfully` });
    }

    // 2. Add single new item
    if (action === 'ADD_ITEM' && newItem) {
      const created = await prisma.inventoryItem.create({
        data: {
          propertyId,
          name: newItem.name,
          sku: newItem.category || 'General',
          unit: newItem.unit || 'Pcs',
          currentQuantity: Number(newItem.currentStock || newItem.currentQuantity || 0),
          minThreshold: Number(newItem.reorderLevel || newItem.minThreshold || 0),
          costPrice: Number(newItem.unitCost || newItem.costPrice || 0),
          isActive: true,
        },
      });
      return NextResponse.json({ success: true, data: created, message: 'Item created successfully' });
    }

    // 3. Update single item (Edit)
    if (action === 'UPDATE_ITEM' && (updatedItem || itemId)) {
      const id = updatedItem?.id || itemId;
      const existing = await prisma.inventoryItem.findUnique({ where: { id } });
      if (!existing) {
        return NextResponse.json({ success: false, message: 'Item not found' }, { status: 404 });
      }

      const updated = await prisma.inventoryItem.update({
        where: { id },
        data: {
          ...(updatedItem?.name ? { name: updatedItem.name } : {}),
          ...(updatedItem?.category ? { sku: updatedItem.category } : {}),
          ...(updatedItem?.unit ? { unit: updatedItem.unit } : {}),
          ...(updatedItem?.currentStock !== undefined ? { currentQuantity: Number(updatedItem.currentStock) } : {}),
          ...(updatedItem?.reorderLevel !== undefined ? { minThreshold: Number(updatedItem.reorderLevel) } : {}),
          ...(updatedItem?.unitCost !== undefined ? { costPrice: Number(updatedItem.unitCost) } : {}),
        },
      });

      return NextResponse.json({ success: true, data: updated, message: 'Item updated successfully' });
    }

    // 4. Quantity Delta (Adjustment / Usage deduction)
    if (action === 'ADJUST_QTY' && itemId && quantityDelta !== undefined) {
      const existing = await prisma.inventoryItem.findUnique({ where: { id: itemId } });
      if (!existing) return NextResponse.json({ success: false, message: 'Item not found' }, { status: 404 });
      const newQty = Math.max(0, existing.currentQuantity + Number(quantityDelta));
      await prisma.inventoryItem.update({
        where: { id: itemId },
        data: { currentQuantity: newQty },
      });
      await prisma.inventoryLog.create({
        data: {
          inventoryItemId: itemId,
          type: quantityDelta >= 0 ? 'IN' : 'OUT',
          quantity: Math.abs(Number(quantityDelta)),
          previousQty: existing.currentQuantity,
          newQty,
          note: body.note || 'Quantity Adjustment',
        },
      });
      return NextResponse.json({ success: true, currentQuantity: newQty });
    }

    return NextResponse.json({ success: false, message: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('[inventory-summary] POST error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
