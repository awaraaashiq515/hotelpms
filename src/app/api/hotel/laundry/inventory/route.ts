import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';
import { getWTUserFromRequest } from '@/lib/walkie-talkie-auth';

let inventoryTablesReady = false;
async function ensureInventoryTables() {
  if (inventoryTablesReady) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "LaundryInventoryItem" (
        "id" TEXT PRIMARY KEY,
        "propertyId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "category" TEXT NOT NULL, /* "DETERGENT" or "LINEN" */
        "unit" TEXT NOT NULL, /* "kg", "Ltr", "pcs" */
        "currentStock" REAL NOT NULL DEFAULT 0,
        "minThreshold" REAL NOT NULL DEFAULT 5,
        "costPerUnit" REAL NOT NULL DEFAULT 0,
        "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "LaundryInventoryLog" (
        "id" TEXT PRIMARY KEY,
        "propertyId" TEXT NOT NULL,
        "itemId" TEXT NOT NULL,
        "itemName" TEXT NOT NULL,
        "category" TEXT NOT NULL,
        "type" TEXT NOT NULL, /* "INWARD" (Aaya) or "CONSUMED" (Use Hua) */
        "quantity" REAL NOT NULL,
        "previousStock" REAL NOT NULL,
        "newStock" REAL NOT NULL,
        "notes" TEXT,
        "loggedBy" TEXT,
        "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    inventoryTablesReady = true;
  } catch (err) {
    console.error('[ensureInventoryTables error]', err);
  }
}

// Initial default stock items (Detergents & Linens)
const DEFAULT_INVENTORY_ITEMS = [
  // Detergents & Chemicals
  { name: "Surf Excel Matic Laundry Powder", category: "DETERGENT", unit: "kg", currentStock: 35.0, minThreshold: 10.0, costPerUnit: 140 },
  { name: "Comfort Fabric Softener (Liquid)", category: "DETERGENT", unit: "Ltr", currentStock: 15.0, minThreshold: 5.0, costPerUnit: 180 },
  { name: "Vanish / Chlor Bleach & Stain Remover", category: "DETERGENT", unit: "Ltr", currentStock: 8.5, minThreshold: 3.0, costPerUnit: 160 },
  { name: "Laundry Detergent Soap Bars (Rin/Wheel)", category: "DETERGENT", unit: "pcs", currentStock: 40, minThreshold: 15, costPerUnit: 25 },
  { name: "Fabric Starch Powder (Revive)", category: "DETERGENT", unit: "kg", currentStock: 5.0, minThreshold: 2.0, costPerUnit: 120 },
  // Hotel Linens
  { name: "Double Bed Sheets (White Cotton)", category: "LINEN", unit: "pcs", currentStock: 120, minThreshold: 30, costPerUnit: 450 },
  { name: "Single Bed Sheets (White Cotton)", category: "LINEN", unit: "pcs", currentStock: 60, minThreshold: 20, costPerUnit: 350 },
  { name: "Pillow Covers (Pair)", category: "LINEN", unit: "pcs", currentStock: 250, minThreshold: 50, costPerUnit: 90 },
  { name: "Bath Towels (600 GSM Large)", category: "LINEN", unit: "pcs", currentStock: 140, minThreshold: 35, costPerUnit: 280 },
  { name: "Hand / Face Towels (Soft Cotton)", category: "LINEN", unit: "pcs", currentStock: 180, minThreshold: 40, costPerUnit: 95 },
  { name: "Bath Mats (Anti-Skid)", category: "LINEN", unit: "pcs", currentStock: 45, minThreshold: 15, costPerUnit: 150 },
];

export async function GET(req: NextRequest) {
  try {
    await ensureInventoryTables();
    const { searchParams } = new URL(req.url);
    const propId = searchParams.get('propertyId') || 'default-property';
    const category = searchParams.get('category'); // "DETERGENT" or "LINEN" or null for both

    let itemsQuery = `SELECT * FROM "LaundryInventoryItem" WHERE ("propertyId" = ? OR "propertyId" = 'default-property')`;
    const params: any[] = [propId];
    if (category) {
      itemsQuery += ` AND "category" = ?`;
      params.push(category);
    }
    itemsQuery += ` ORDER BY "category", "name" ASC`;

    let items: any[] = [];
    try {
      items = await prisma.$queryRawUnsafe(itemsQuery, ...params);
    } catch {
      items = [];
    }

    // Auto-seed if empty
    if (!items || items.length === 0) {
      for (const it of DEFAULT_INVENTORY_ITEMS) {
        const id = 'lii_' + Math.random().toString(36).substring(2, 10);
        await prisma.$executeRawUnsafe(
          `INSERT INTO "LaundryInventoryItem" ("id", "propertyId", "name", "category", "unit", "currentStock", "minThreshold", "costPerUnit")
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          id, propId, it.name, it.category, it.unit, it.currentStock, it.minThreshold, it.costPerUnit
        );

        // Add initial log
        const logId = 'lil_' + Math.random().toString(36).substring(2, 10);
        await prisma.$executeRawUnsafe(
          `INSERT INTO "LaundryInventoryLog" ("id", "propertyId", "itemId", "itemName", "category", "type", "quantity", "previousStock", "newStock", "notes", "loggedBy")
           VALUES (?, ?, ?, ?, ?, 'INWARD', ?, 0, ?, 'Opening initial stock setup', 'System')`,
          logId, propId, id, it.name, it.category, it.currentStock, it.currentStock
        );
      }

      items = await prisma.$queryRawUnsafe(itemsQuery, ...params);
    }

    // Fetch recent movement logs (Aaya / Use Hua)
    let logs: any[] = [];
    try {
      logs = await prisma.$queryRawUnsafe(
        `SELECT * FROM "LaundryInventoryLog" WHERE "propertyId" = ? OR "propertyId" = 'default-property' ORDER BY "createdAt" DESC LIMIT 50`,
        propId
      );
    } catch {
      logs = [];
    }

    return apiResponse({ items, logs });
  } catch (err: any) {
    return apiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureInventoryTables();
    const session = await getSession();
    const staff = !session ? await getWTUserFromRequest(req as any) : null;
    const body = await req.json();
    const { action, itemId, propertyId, name, category, unit, quantity, notes, loggedBy, costPerUnit } = body;

    const targetPropId = propertyId || (session?.propertyId || staff?.propertyId || 'default-property');
    const staffName = loggedBy || (session?.email || staff?.fullName || 'Housekeeping Staff');

    // Action 1: Create a brand new inventory item (e.g. New Detergent or Linen item)
    if (action === 'ADD_ITEM') {
      if (!name || !unit) {
        return apiError(new Error('Item name and unit are required'), 400);
      }
      const id = 'lii_' + Math.random().toString(36).substring(2, 10);
      const initStock = Number(quantity) || 0;
      const cat = category || 'DETERGENT';

      await prisma.$executeRawUnsafe(
        `INSERT INTO "LaundryInventoryItem" ("id", "propertyId", "name", "category", "unit", "currentStock", "minThreshold", "costPerUnit")
         VALUES (?, ?, ?, ?, ?, ?, 5, ?)`,
        id, targetPropId, name, cat, unit, initStock, Number(costPerUnit) || 0
      );

      if (initStock > 0) {
        const logId = 'lil_' + Math.random().toString(36).substring(2, 10);
        await prisma.$executeRawUnsafe(
          `INSERT INTO "LaundryInventoryLog" ("id", "propertyId", "itemId", "itemName", "category", "type", "quantity", "previousStock", "newStock", "notes", "loggedBy")
           VALUES (?, ?, ?, ?, ?, 'INWARD', ?, 0, ?, ?, ?)`,
          logId, targetPropId, id, name, cat, initStock, initStock, notes || 'Initial stock addition', staffName
        );
      }

      return apiResponse({ id, success: true, message: `Added ${name} to laundry stock!` }, 'Created', 201);
    }

    // Action 2: INWARD Stock (Aaya - Received soap, detergent, or fresh linens)
    if (action === 'INWARD') {
      if (!itemId || !quantity || Number(quantity) <= 0) {
        return apiError(new Error('Valid Item ID and positive quantity are required'), 400);
      }

      const itemRows: any[] = await prisma.$queryRawUnsafe(
        `SELECT * FROM "LaundryInventoryItem" WHERE "id" = ?`,
        itemId
      );
      if (!itemRows || itemRows.length === 0) {
        return apiError(new Error('Inventory item not found'), 404);
      }
      const item = itemRows[0];
      const prevStock = Number(item.currentStock) || 0;
      const qtyIn = Number(quantity);
      const newStock = prevStock + qtyIn;

      await prisma.$executeRawUnsafe(
        `UPDATE "LaundryInventoryItem" SET "currentStock" = ?, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ?`,
        newStock, itemId
      );

      const logId = 'lil_' + Math.random().toString(36).substring(2, 10);
      await prisma.$executeRawUnsafe(
        `INSERT INTO "LaundryInventoryLog" ("id", "propertyId", "itemId", "itemName", "category", "type", "quantity", "previousStock", "newStock", "notes", "loggedBy")
         VALUES (?, ?, ?, ?, ?, 'INWARD', ?, ?, ?, ?, ?)`,
        logId, targetPropId, itemId, item.name, item.category, qtyIn, prevStock, newStock, notes || 'Stock received / Inward supply', staffName
      );

      return apiResponse({
        success: true,
        message: `Inward logged: +${qtyIn} ${item.unit} ${item.name}. New Stock: ${newStock} ${item.unit}`,
        newStock,
      });
    }

    // Action 3: CONSUMED Stock (Use Hua - Detergent/soap used for laundry washing)
    if (action === 'CONSUME') {
      if (!itemId || !quantity || Number(quantity) <= 0) {
        return apiError(new Error('Valid Item ID and positive quantity are required'), 400);
      }

      const itemRows: any[] = await prisma.$queryRawUnsafe(
        `SELECT * FROM "LaundryInventoryItem" WHERE "id" = ?`,
        itemId
      );
      if (!itemRows || itemRows.length === 0) {
        return apiError(new Error('Inventory item not found'), 404);
      }
      const item = itemRows[0];
      const prevStock = Number(item.currentStock) || 0;
      const qtyUsed = Number(quantity);
      const newStock = Math.max(0, prevStock - qtyUsed);

      await prisma.$executeRawUnsafe(
        `UPDATE "LaundryInventoryItem" SET "currentStock" = ?, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ?`,
        newStock, itemId
      );

      const logId = 'lil_' + Math.random().toString(36).substring(2, 10);
      await prisma.$executeRawUnsafe(
        `INSERT INTO "LaundryInventoryLog" ("id", "propertyId", "itemId", "itemName", "category", "type", "quantity", "previousStock", "newStock", "notes", "loggedBy")
         VALUES (?, ?, ?, ?, ?, 'CONSUMED', ?, ?, ?, ?, ?)`,
        logId, targetPropId, itemId, item.name, item.category, qtyUsed, prevStock, newStock, notes || 'Used for daily wash cycles', staffName
      );

      return apiResponse({
        success: true,
        message: `Usage logged: -${qtyUsed} ${item.unit} ${item.name} used. Remaining: ${newStock} ${item.unit}`,
        newStock,
      });
    }

    return apiError(new Error('Invalid action. Use INWARD, CONSUME, or ADD_ITEM'), 400);
  } catch (err: any) {
    return apiError(err);
  }
}
