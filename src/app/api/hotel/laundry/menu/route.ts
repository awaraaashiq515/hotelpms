import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';
import { getWTUserFromRequest } from '@/lib/walkie-talkie-auth';

// Ensure SQLite table exists
let tableReady = false;
async function ensureMenuTable() {
  if (tableReady) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "LaundryMenuItem" (
        "id" TEXT PRIMARY KEY,
        "propertyId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "category" TEXT NOT NULL,
        "serviceType" TEXT NOT NULL,
        "price" REAL NOT NULL,
        "turnaround" TEXT NOT NULL,
        "description" TEXT,
        "isActive" INTEGER DEFAULT 1,
        "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    tableReady = true;
  } catch (err) {
    console.error('[ensureMenuTable error]', err);
  }
}

// Default Hotel Laundry Rate Menu seed
const DEFAULT_MENU_ITEMS = [
  { name: "Men's Shirt (Formal / Casual)", category: "Men's Clothing", serviceType: "Wash & Iron", price: 60, turnaround: "Same Day" },
  { name: "T-Shirt / Polo", category: "Men's Clothing", serviceType: "Wash & Iron", price: 50, turnaround: "Same Day" },
  { name: "Trousers / Jeans", category: "Men's Clothing", serviceType: "Wash & Iron", price: 80, turnaround: "Same Day" },
  { name: "Men's Suit (2-Piece)", category: "Dry Cleaning", serviceType: "Dry Clean & Press", price: 300, turnaround: "24 Hours" },
  { name: "Blazer / Coat", category: "Dry Cleaning", serviceType: "Dry Clean & Press", price: 200, turnaround: "24 Hours" },
  { name: "Kurta Pyjama Set", category: "Men's Clothing", serviceType: "Wash & Iron", price: 120, turnaround: "Same Day" },
  { name: "Saree (Cotton / Silk)", category: "Women's Clothing", serviceType: "Dry Clean & Steam Press", price: 220, turnaround: "24 Hours" },
  { name: "Ladies Salwar Kameez Suit", category: "Women's Clothing", serviceType: "Wash & Iron", price: 120, turnaround: "Same Day" },
  { name: "Ladies Top / Blouse", category: "Women's Clothing", serviceType: "Wash & Iron", price: 60, turnaround: "Same Day" },
  { name: "Double Bed Sheet", category: "Linen & Bedding", serviceType: "Wash & Fold", price: 80, turnaround: "Same Day" },
  { name: "Pillow Cover (Pair)", category: "Linen & Bedding", serviceType: "Wash & Iron", price: 40, turnaround: "Same Day" },
  { name: "Bath Towel (Large)", category: "Linen & Bedding", serviceType: "Wash & Soften", price: 50, turnaround: "Same Day" },
  { name: "Heavy Blanket / Quilt", category: "Dry Cleaning", serviceType: "Deep Clean & Sanitize", price: 350, turnaround: "48 Hours" },
  { name: "Undergarments / Socks", category: "Men's Clothing", serviceType: "Hygiene Wash & Fold", price: 30, turnaround: "Same Day" },
  { name: "Express Shirt & Pant Wash", category: "Express Service", serviceType: "Super Express 4-Hour", price: 180, turnaround: "Express 4 Hours" },
];

export async function GET(req: NextRequest) {
  try {
    await ensureMenuTable();
    const { searchParams } = new URL(req.url);
    const propId = searchParams.get('propertyId') || 'default-property';

    let items: any[] = [];
    try {
      items = await prisma.$queryRawUnsafe(
        `SELECT * FROM "LaundryMenuItem" WHERE "propertyId" = ? OR "propertyId" = 'default-property' ORDER BY "category", "price" ASC`,
        propId
      );
    } catch {
      items = [];
    }

    // Auto-seed if empty
    if (!items || items.length === 0) {
      for (const it of DEFAULT_MENU_ITEMS) {
        const id = 'lmi_' + Math.random().toString(36).substring(2, 10);
        await prisma.$executeRawUnsafe(
          `INSERT INTO "LaundryMenuItem" ("id", "propertyId", "name", "category", "serviceType", "price", "turnaround", "description", "isActive") 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          id, propId, it.name, it.category, it.serviceType, it.price, it.turnaround, 'Professional hotel laundry service'
        );
      }
      items = await prisma.$queryRawUnsafe(
        `SELECT * FROM "LaundryMenuItem" WHERE "propertyId" = ? ORDER BY "category", "price" ASC`,
        propId
      );
    }

    return apiResponse(items);
  } catch (err: any) {
    return apiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureMenuTable();
    const body = await req.json();
    const { propertyId, name, category, serviceType, price, turnaround, description } = body;

    if (!name || price === undefined) {
      return apiError(new Error('Item name and price are required'), 400);
    }

    const id = 'lmi_' + Math.random().toString(36).substring(2, 10);
    const targetPropId = propertyId || 'default-property';

    await prisma.$executeRawUnsafe(
      `INSERT INTO "LaundryMenuItem" ("id", "propertyId", "name", "category", "serviceType", "price", "turnaround", "description", "isActive") 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      id,
      targetPropId,
      name,
      category || "General Laundry",
      serviceType || "Wash & Iron",
      Number(price) || 50,
      turnaround || "Same Day",
      description || ""
    );

    return apiResponse({ id, success: true, message: 'Laundry Menu item created!' }, 'Created', 201);
  } catch (err: any) {
    return apiError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await ensureMenuTable();
    const body = await req.json();
    const { id, name, category, serviceType, price, turnaround, isActive } = body;

    if (!id) return apiError(new Error('Item ID is required'), 400);

    await prisma.$executeRawUnsafe(
      `UPDATE "LaundryMenuItem" 
       SET "name" = COALESCE(?, "name"),
           "category" = COALESCE(?, "category"),
           "serviceType" = COALESCE(?, "serviceType"),
           "price" = COALESCE(?, "price"),
           "turnaround" = COALESCE(?, "turnaround"),
           "isActive" = COALESCE(?, "isActive"),
           "updatedAt" = CURRENT_TIMESTAMP
       WHERE "id" = ?`,
      name, category, serviceType, price !== undefined ? Number(price) : null, turnaround, isActive !== undefined ? (isActive ? 1 : 0) : null, id
    );

    return apiResponse({ success: true, message: 'Item updated successfully!' });
  } catch (err: any) {
    return apiError(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await ensureMenuTable();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return apiError(new Error('Item ID is required'), 400);

    await prisma.$executeRawUnsafe(`DELETE FROM "LaundryMenuItem" WHERE "id" = ?`, id);
    return apiResponse({ success: true, message: 'Item removed from laundry menu!' });
  } catch (err: any) {
    return apiError(err);
  }
}
