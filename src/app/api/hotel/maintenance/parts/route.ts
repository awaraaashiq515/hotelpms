import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

let partsTablesReady = false;
async function ensurePartsTables() {
  if (partsTablesReady) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "MaintenancePart" (
        "id" TEXT PRIMARY KEY,
        "propertyId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "partNumber" TEXT,
        "category" TEXT NOT NULL, /* HVAC, Plumbing, Electrical, Lock/Hardware, Electronics, Appliances */
        "unit" TEXT NOT NULL DEFAULT 'pcs',
        "currentStock" REAL NOT NULL DEFAULT 0,
        "minThreshold" REAL NOT NULL DEFAULT 2,
        "unitCost" REAL NOT NULL DEFAULT 0,
        "preferredVendor" TEXT,
        "location" TEXT,
        "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "MaintenancePartReplacement" (
        "id" TEXT PRIMARY KEY,
        "propertyId" TEXT NOT NULL,
        "ticketId" TEXT,
        "ticketTitle" TEXT,
        "partId" TEXT,
        "partName" TEXT NOT NULL,
        "category" TEXT NOT NULL,
        "quantity" REAL NOT NULL DEFAULT 1,
        "unitCost" REAL NOT NULL DEFAULT 0,
        "totalCost" REAL NOT NULL DEFAULT 0,
        "locationFitted" TEXT NOT NULL, /* e.g. "Room 101 - AC Unit" */
        "breakdownReason" TEXT, /* What broke down / why replaced */
        "damageCondition" TEXT, /* Broken, Burnt, Corroded, Worn Out */
        "replacedBy" TEXT,
        "poNumber" TEXT, /* Linked Purchase Order Number */
        "status" TEXT NOT NULL DEFAULT 'INSTALLED', /* INSTALLED, ORDER_PENDING, AWAITING_PART */
        "notes" TEXT,
        "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    partsTablesReady = true;
  } catch (err) {
    console.error('[ensurePartsTables error]', err);
  }
}

const DEFAULT_PARTS = [
  { name: 'Split AC Dual Run Capacitor (45+5 uF)', partNumber: 'CAP-45-5', category: 'HVAC', unit: 'pcs', currentStock: 4, minThreshold: 2, unitCost: 380, preferredVendor: 'CoolAir HVAC Spares & Refrigeration', location: 'Rack A-01' },
  { name: 'Brass Basin Mixer Cartridge 35mm', partNumber: 'PLM-CRT-35', category: 'Plumbing', unit: 'pcs', currentStock: 6, minThreshold: 3, unitCost: 450, preferredVendor: 'Apex Plumbing & Sanitary Ware', location: 'Rack B-03' },
  { name: 'Heavy Duty Mortise Door Lock Body (SS 304)', partNumber: 'LCK-MRT-85', category: 'Lock/Hardware', unit: 'pcs', currentStock: 3, minThreshold: 2, unitCost: 850, preferredVendor: 'Precision Locks & Security Hardware', location: 'Rack D-02' },
  { name: '15W LED Ceiling Panel Light Driver', partNumber: 'ELE-LED-15W', category: 'Electrical', unit: 'pcs', currentStock: 8, minThreshold: 4, unitCost: 220, preferredVendor: 'Metro Electricals & Lighting Hub', location: 'Rack C-05' },
  { name: 'Geyser Copper Heating Element 2000W', partNumber: 'GYS-ELM-2K', category: 'Electrical', unit: 'pcs', currentStock: 1, minThreshold: 2, unitCost: 650, preferredVendor: 'Metro Electricals & Lighting Hub', location: 'Rack C-02' },
  { name: 'Universal Hotel TV Remote Control', partNumber: 'ELC-RMT-UNI', category: 'Electronics', unit: 'pcs', currentStock: 10, minThreshold: 5, unitCost: 180, preferredVendor: 'Metro Electricals & Lighting Hub', location: 'Rack E-01' },
  { name: 'Flush Cistern Dual Flush Syphon Valve', partNumber: 'PLM-FLS-DF', category: 'Plumbing', unit: 'set', currentStock: 2, minThreshold: 3, unitCost: 390, preferredVendor: 'Apex Plumbing & Sanitary Ware', location: 'Rack B-01' },
  { name: 'Split AC Blower Cross Flow Fan', partNumber: 'AC-BLW-01', category: 'HVAC', unit: 'pcs', currentStock: 1, minThreshold: 2, unitCost: 1250, preferredVendor: 'CoolAir HVAC Spares & Refrigeration', location: 'Rack A-04' },
  { name: 'Flexible Braided Stainless Water Pipe (1/2" 18 inch)', partNumber: 'PLM-HOS-18', category: 'Plumbing', unit: 'pcs', currentStock: 14, minThreshold: 5, unitCost: 120, preferredVendor: 'Apex Plumbing & Sanitary Ware', location: 'Rack B-05' },
  { name: 'RFID Smart Keycard Door Encoder Coil & Spring', partNumber: 'LCK-ENC-02', category: 'Lock/Hardware', unit: 'pcs', currentStock: 2, minThreshold: 2, unitCost: 520, preferredVendor: 'Precision Locks & Security Hardware', location: 'Rack D-04' },
];

const DEFAULT_REPLACEMENTS = [
  {
    ticketTitle: 'Leaking tap in bathroom',
    partName: 'Brass Basin Mixer Cartridge 35mm',
    category: 'Plumbing',
    quantity: 1,
    unitCost: 450,
    totalCost: 450,
    locationFitted: 'Room 205 - Bathroom Wash Basin',
    breakdownReason: 'Ceramic disc cracked causing non-stop dripping water leak',
    damageCondition: 'Cracked & Worn Out',
    replacedBy: 'Raju (Plumber)',
    poNumber: 'PO-2026-MNT-002',
    status: 'INSTALLED',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    ticketTitle: 'Door lock jammed',
    partName: 'Heavy Duty Mortise Door Lock Body (SS 304)',
    category: 'Lock/Hardware',
    quantity: 1,
    unitCost: 850,
    totalCost: 850,
    locationFitted: 'Room 402 - Main Entrance Door',
    breakdownReason: 'Internal latch spring fractured, latch not retracting with keycard',
    damageCondition: 'Broken Spring / Jammed',
    replacedBy: 'Sunil (Technician)',
    poNumber: 'PO-2026-MNT-003',
    status: 'ORDER_PENDING',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    ticketTitle: 'AC not cooling properly',
    partName: 'Split AC Dual Run Capacitor (45+5 uF)',
    category: 'HVAC',
    quantity: 1,
    unitCost: 380,
    totalCost: 380,
    locationFitted: 'Room 101 - Outdoor AC Condenser Unit',
    breakdownReason: 'Capacitor swollen & blown due to summer voltage fluctuation',
    damageCondition: 'Burnt / Swollen',
    replacedBy: 'Dinesh (HVAC Tech)',
    poNumber: 'PO-2026-MNT-001',
    status: 'INSTALLED',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  }
];

export async function GET(request: NextRequest) {
  try {
    await ensurePartsTables();

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId') || 'prop_default';
    const category = searchParams.get('category');
    const ticketId = searchParams.get('ticketId');

    // Seed default parts if empty
    const existingParts = await prisma.$queryRawUnsafe<any[]>(
      `SELECT count(*) as count FROM "MaintenancePart" WHERE "propertyId" = ?`,
      propertyId
    );
    const count = Number(existingParts?.[0]?.count || 0);

    if (count === 0) {
      for (const p of DEFAULT_PARTS) {
        const id = 'part_' + Math.random().toString(36).substring(2, 9);
        await prisma.$executeRawUnsafe(
          `INSERT INTO "MaintenancePart" ("id", "propertyId", "name", "partNumber", "category", "unit", "currentStock", "minThreshold", "unitCost", "preferredVendor", "location")
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          id, propertyId, p.name, p.partNumber, p.category, p.unit, p.currentStock, p.minThreshold, p.unitCost, p.preferredVendor, p.location
        );
      }

      for (const r of DEFAULT_REPLACEMENTS) {
        const id = 'rep_' + Math.random().toString(36).substring(2, 9);
        await prisma.$executeRawUnsafe(
          `INSERT INTO "MaintenancePartReplacement" ("id", "propertyId", "ticketId", "ticketTitle", "partName", "category", "quantity", "unitCost", "totalCost", "locationFitted", "breakdownReason", "damageCondition", "replacedBy", "poNumber", "status", "createdAt")
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          id, propertyId, '1', r.ticketTitle, r.partName, r.category, r.quantity, r.unitCost, r.totalCost, r.locationFitted, r.breakdownReason, r.damageCondition, r.replacedBy, r.poNumber, r.status, r.createdAt
        );
      }
    }

    // Fetch parts
    let partsQuery = `SELECT * FROM "MaintenancePart" WHERE "propertyId" = ?`;
    const partsParams: any[] = [propertyId];
    if (category && category !== 'ALL') {
      partsQuery += ` AND "category" = ?`;
      partsParams.push(category);
    }
    partsQuery += ` ORDER BY "category" ASC, "name" ASC`;
    const parts = await prisma.$queryRawUnsafe<any[]>(partsQuery, ...partsParams);

    // Fetch replacements
    let repQuery = `SELECT * FROM "MaintenancePartReplacement" WHERE "propertyId" = ?`;
    const repParams: any[] = [propertyId];
    if (ticketId) {
      repQuery += ` AND "ticketId" = ?`;
      repParams.push(ticketId);
    }
    repQuery += ` ORDER BY "createdAt" DESC`;
    const replacements = await prisma.$queryRawUnsafe<any[]>(repQuery, ...repParams);

    // Summary metrics
    const lowStockParts = parts.filter(p => Number(p.currentStock) <= Number(p.minThreshold));
    const totalPartsCostUsed = replacements.reduce((sum, r) => sum + Number(r.totalCost || 0), 0);

    return apiResponse({
      parts,
      replacements,
      summary: {
        totalPartTypes: parts.length,
        lowStockCount: lowStockParts.length,
        totalReplacementsLogged: replacements.length,
        totalPartsCostUsed,
        lowStockItems: lowStockParts,
      }
    });
  } catch (error) {
    console.error('Maintenance Parts GET error:', error);
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensurePartsTables();
    const session = await getSession();
    const body = await request.json();
    const propertyId = body.propertyId || 'prop_default';
    const action = body.action || 'REPLACE_PART'; // 'REPLACE_PART' or 'ADD_NEW_PART'

    if (action === 'ADD_NEW_PART') {
      const { name, partNumber, category, unit, currentStock, minThreshold, unitCost, preferredVendor, location } = body;
      if (!name) return apiError(new Error('Part name is required'), 400);

      const id = 'part_' + Math.random().toString(36).substring(2, 9);
      await prisma.$executeRawUnsafe(
        `INSERT INTO "MaintenancePart" ("id", "propertyId", "name", "partNumber", "category", "unit", "currentStock", "minThreshold", "unitCost", "preferredVendor", "location")
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        id, propertyId, name, partNumber || '', category || 'General', unit || 'pcs', Number(currentStock || 0), Number(minThreshold || 2), Number(unitCost || 0), preferredVendor || '', location || 'Main Store'
      );

      return apiResponse({ id }, 'Spare part added to catalogue successfully', 201);
    }

    // Action: REPLACE_PART (Record what broke down, what part was fitted, and link PO)
    const {
      ticketId,
      ticketTitle,
      partId,
      partName,
      category,
      quantity,
      unitCost,
      locationFitted,
      breakdownReason,
      damageCondition,
      replacedBy,
      generatePO,
      vendorName,
    } = body;

    if (!partName || !locationFitted) {
      return apiError(new Error('Part Name and Location Fitted are required'), 400);
    }

    const qty = Number(quantity || 1);
    const cost = Number(unitCost || 0);
    const totalCost = qty * cost;

    // Check if PO should be generated or if using in-house stock
    let poNumber = body.poNumber || null;
    let status = 'INSTALLED';

    if (generatePO) {
      poNumber = `PO-${new Date().getFullYear()}-MNT-${Math.floor(100 + Math.random() * 900)}`;
      status = 'ORDER_PENDING';
    } else if (!poNumber) {
      poNumber = 'IN_HOUSE_STOCK';
    }

    const repId = 'rep_' + Math.random().toString(36).substring(2, 9);
    await prisma.$executeRawUnsafe(
      `INSERT INTO "MaintenancePartReplacement" 
       ("id", "propertyId", "ticketId", "ticketTitle", "partId", "partName", "category", "quantity", "unitCost", "totalCost", "locationFitted", "breakdownReason", "damageCondition", "replacedBy", "poNumber", "status", "createdAt")
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      repId,
      propertyId,
      ticketId || '',
      ticketTitle || 'General Equipment Maintenance',
      partId || '',
      partName,
      category || 'General',
      qty,
      cost,
      totalCost,
      locationFitted,
      breakdownReason || 'Broken / Worn out during hotel operation',
      damageCondition || 'Damaged',
      replacedBy || (session as any)?.name || session?.email || 'Duty Technician',
      poNumber,
      status,
      new Date().toISOString()
    );

    // If deducted from in-house stock, update the part current stock
    if (partId && !generatePO) {
      await prisma.$executeRawUnsafe(
        `UPDATE "MaintenancePart" 
         SET "currentStock" = MAX(0, "currentStock" - ?), "updatedAt" = CURRENT_TIMESTAMP
         WHERE "id" = ?`,
        qty,
        partId
      );
    }

    return apiResponse({
      replacementId: repId,
      poNumber,
      status,
      totalCost,
    }, 'Maintenance part replacement recorded successfully', 201);
  } catch (error) {
    console.error('Maintenance Parts POST error:', error);
    return apiError(error);
  }
}
