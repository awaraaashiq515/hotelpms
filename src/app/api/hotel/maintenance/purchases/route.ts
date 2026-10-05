import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

let purchasesTablesReady = false;
async function ensurePurchasesTables() {
  if (purchasesTablesReady) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "HotelVendor" (
        "id" TEXT PRIMARY KEY,
        "propertyId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "category" TEXT NOT NULL, /* HVAC, Plumbing, Electrical, Hardware/Locks, Chemicals, General */
        "contactPerson" TEXT,
        "phone" TEXT,
        "email" TEXT,
        "address" TEXT,
        "gstin" TEXT,
        "paymentTerms" TEXT DEFAULT 'Net 30',
        "rating" REAL DEFAULT 4.5,
        "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "HotelPurchaseOrder" (
        "id" TEXT PRIMARY KEY,
        "propertyId" TEXT NOT NULL,
        "poNumber" TEXT NOT NULL UNIQUE,
        "vendorId" TEXT,
        "vendorName" TEXT NOT NULL,
        "vendorPhone" TEXT,
        "vendorEmail" TEXT,
        "department" TEXT NOT NULL DEFAULT 'Maintenance', /* Maintenance, Housekeeping, Front Desk, Engineering */
        "status" TEXT NOT NULL DEFAULT 'DRAFT', /* DRAFT, ORDERED, IN_TRANSIT, DELIVERED, CANCELLED */
        "totalAmount" REAL NOT NULL DEFAULT 0,
        "taxAmount" REAL NOT NULL DEFAULT 0,
        "grandTotal" REAL NOT NULL DEFAULT 0,
        "itemsCount" INTEGER NOT NULL DEFAULT 1,
        "itemsJson" TEXT NOT NULL, /* JSON array of items: [{ name, qty, unit, unitPrice, total }] */
        "deliveryDate" TEXT,
        "notes" TEXT,
        "source" TEXT DEFAULT 'MANUAL', /* 'MANUAL', 'LOW_STOCK_AUTO', 'BREAKDOWN_TICKET' */
        "linkedTicketNo" TEXT,
        "createdBy" TEXT,
        "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    purchasesTablesReady = true;
  } catch (err) {
    console.error('[ensurePurchasesTables error]', err);
  }
}

const DEFAULT_VENDORS = [
  {
    name: 'CoolAir HVAC Spares & Refrigeration',
    category: 'HVAC',
    contactPerson: 'Rajesh Kumar',
    phone: '+91 98112 34501',
    email: 'orders@coolairparts.com',
    address: 'Shop 14, Industrial Area Phase 2, New Delhi',
    gstin: '07AAACK1234F1Z8',
    paymentTerms: 'Net 15 Days',
    rating: 4.8,
  },
  {
    name: 'Apex Plumbing & Sanitary Ware',
    category: 'Plumbing',
    contactPerson: 'Vikram Singh',
    phone: '+91 98220 54321',
    email: 'sales@apexplumbing.in',
    address: 'Plot 45, Sanitary Market, Sector 18, Gurugram',
    gstin: '06AABCA9876G1ZA',
    paymentTerms: 'Net 30 Days',
    rating: 4.7,
  },
  {
    name: 'Metro Electricals & Lighting Hub',
    category: 'Electrical',
    contactPerson: 'Amit Patel',
    phone: '+91 98331 67890',
    email: 'metroelectricals@gmail.com',
    address: '102 Bhagirath Palace, Electrical Market, Chandni Chowk',
    gstin: '07AAPPA5544H1Z5',
    paymentTerms: 'Immediate / UPI',
    rating: 4.9,
  },
  {
    name: 'Precision Locks & Security Hardware',
    category: 'Hardware/Locks',
    contactPerson: 'Sunil Verma',
    phone: '+91 98440 11223',
    email: 'precisionlocks@hotelhardware.com',
    address: 'B-8 Commercial Complex, Nehru Place, Delhi',
    gstin: '07AABBP7766K1Z1',
    paymentTerms: 'Net 15 Days',
    rating: 4.6,
  },
  {
    name: 'PureChem Commercial Detergents & Supplies',
    category: 'Chemicals',
    contactPerson: 'Deepak Sharma',
    phone: '+91 98552 99887',
    email: 'orders@purechem.co.in',
    address: 'Warehouse 9, Okhla Phase 1, New Delhi',
    gstin: '07AACCB1122M1Z2',
    paymentTerms: 'Net 30 Days',
    rating: 4.8,
  },
];

const DEFAULT_POS = [
  {
    poNumber: 'PO-2026-MNT-001',
    vendorName: 'CoolAir HVAC Spares & Refrigeration',
    vendorPhone: '+91 98112 34501',
    vendorEmail: 'orders@coolairparts.com',
    department: 'Maintenance',
    status: 'DELIVERED',
    totalAmount: 3800,
    taxAmount: 684,
    grandTotal: 4484,
    itemsCount: 2,
    itemsJson: JSON.stringify([
      { name: 'Split AC Dual Run Capacitor (45+5 uF)', qty: 5, unit: 'pcs', unitPrice: 380, total: 1900 },
      { name: 'Split AC Indoor Blower Motor', qty: 1, unit: 'pcs', unitPrice: 1900, total: 1900 }
    ]),
    deliveryDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    notes: 'Urgent replacement stock for Floor 1 & 2 guest room AC units',
    source: 'BREAKDOWN_TICKET',
    linkedTicketNo: 'MNT-101',
    createdBy: 'Chief Engineer',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    poNumber: 'PO-2026-MNT-002',
    vendorName: 'Apex Plumbing & Sanitary Ware',
    vendorPhone: '+91 98220 54321',
    vendorEmail: 'sales@apexplumbing.in',
    department: 'Maintenance',
    status: 'IN_TRANSIT',
    totalAmount: 4500,
    taxAmount: 810,
    grandTotal: 5310,
    itemsCount: 2,
    itemsJson: JSON.stringify([
      { name: 'Brass Basin Mixer Cartridge 35mm', qty: 6, unit: 'pcs', unitPrice: 450, total: 2700 },
      { name: 'Flexible Braided Stainless Water Pipe (1/2")', qty: 15, unit: 'pcs', unitPrice: 120, total: 1800 }
    ]),
    deliveryDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    notes: 'Plumbing fittings restock for routine bathroom maintenance',
    source: 'LOW_STOCK_AUTO',
    linkedTicketNo: 'MNT-205',
    createdBy: 'Maintenance Manager',
    createdAt: new Date(Date.now() - 43200000).toISOString(),
  },
  {
    poNumber: 'PO-2026-MNT-003',
    vendorName: 'Precision Locks & Security Hardware',
    vendorPhone: '+91 98440 11223',
    vendorEmail: 'precisionlocks@hotelhardware.com',
    department: 'Maintenance',
    status: 'ORDERED',
    totalAmount: 4250,
    taxAmount: 765,
    grandTotal: 5015,
    itemsCount: 1,
    itemsJson: JSON.stringify([
      { name: 'Heavy Duty Mortise Door Lock Body (SS 304)', qty: 5, unit: 'pcs', unitPrice: 850, total: 4250 }
    ]),
    deliveryDate: new Date(Date.now() + 172800000).toISOString().split('T')[0],
    notes: 'Guest room door locks replacement order',
    source: 'BREAKDOWN_TICKET',
    linkedTicketNo: 'MNT-402',
    createdBy: 'Front Office & Security',
    createdAt: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    poNumber: 'PO-2026-CHM-004',
    vendorName: 'PureChem Commercial Detergents & Supplies',
    vendorPhone: '+91 98552 99887',
    vendorEmail: 'orders@purechem.co.in',
    department: 'Housekeeping',
    status: 'DRAFT',
    totalAmount: 9800,
    taxAmount: 1764,
    grandTotal: 11564,
    itemsCount: 3,
    itemsJson: JSON.stringify([
      { name: 'Surf Excel Matic Laundry Powder 25kg Pack', qty: 2, unit: 'bag', unitPrice: 3200, total: 6400 },
      { name: 'Comfort Professional Fabric Softener (20L Can)', qty: 1, unit: 'can', unitPrice: 2200, total: 2200 },
      { name: 'Chlor Bleach Liquid (5L Can)', qty: 4, unit: 'can', unitPrice: 300, total: 1200 }
    ]),
    deliveryDate: new Date(Date.now() + 259200000).toISOString().split('T')[0],
    notes: 'Monthly bulk chemical replenishment for in-house hotel laundry',
    source: 'LOW_STOCK_AUTO',
    linkedTicketNo: '',
    createdBy: 'Executive Housekeeper',
    createdAt: new Date().toISOString(),
  }
];

export async function GET(request: NextRequest) {
  try {
    await ensurePurchasesTables();

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId') || 'prop_default';
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Seed default vendors and POs if empty
    const existingVendors = await prisma.$queryRawUnsafe<any[]>(
      `SELECT count(*) as count FROM "HotelVendor" WHERE "propertyId" = ?`,
      propertyId
    );
    const vCount = Number(existingVendors?.[0]?.count || 0);

    if (vCount === 0) {
      for (const v of DEFAULT_VENDORS) {
        const id = 'v_' + Math.random().toString(36).substring(2, 9);
        await prisma.$executeRawUnsafe(
          `INSERT INTO "HotelVendor" ("id", "propertyId", "name", "category", "contactPerson", "phone", "email", "address", "gstin", "paymentTerms", "rating")
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          id, propertyId, v.name, v.category, v.contactPerson, v.phone, v.email, v.address, v.gstin, v.paymentTerms, v.rating
        );
      }

      for (const p of DEFAULT_POS) {
        const id = 'po_' + Math.random().toString(36).substring(2, 9);
        await prisma.$executeRawUnsafe(
          `INSERT INTO "HotelPurchaseOrder" ("id", "propertyId", "poNumber", "vendorName", "vendorPhone", "vendorEmail", "department", "status", "totalAmount", "taxAmount", "grandTotal", "itemsCount", "itemsJson", "deliveryDate", "notes", "source", "linkedTicketNo", "createdBy", "createdAt")
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          id, propertyId, p.poNumber, p.vendorName, p.vendorPhone, p.vendorEmail, p.department, p.status, p.totalAmount, p.taxAmount, p.grandTotal, p.itemsCount, p.itemsJson, p.deliveryDate, p.notes, p.source, p.linkedTicketNo, p.createdBy, p.createdAt
        );
      }
    }

    // Fetch Vendors
    const vendors = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM "HotelVendor" WHERE "propertyId" = ? ORDER BY "category" ASC, "name" ASC`,
      propertyId
    );

    // Fetch Purchase Orders
    let poQuery = `SELECT * FROM "HotelPurchaseOrder" WHERE "propertyId" = ?`;
    const poParams: any[] = [propertyId];
    if (status && status !== 'ALL') {
      poQuery += ` AND "status" = ?`;
      poParams.push(status);
    }
    if (search) {
      poQuery += ` AND ("poNumber" LIKE ? OR "vendorName" LIKE ? OR "department" LIKE ?)`;
      poParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    poQuery += ` ORDER BY "createdAt" DESC`;
    const purchaseOrders = await prisma.$queryRawUnsafe<any[]>(poQuery, ...poParams);

    // Format itemsJson for each PO
    const formattedPOs = purchaseOrders.map(po => {
      let parsedItems = [];
      try {
        parsedItems = JSON.parse(po.itemsJson || '[]');
      } catch (e) {
        parsedItems = [];
      }
      return {
        ...po,
        items: parsedItems,
      };
    });

    // Auto-scan low stock across maintenance spare parts to offer ready-made 1-click PO suggestions
    let autoReorderSuggestions: any[] = [];
    try {
      const lowStockParts = await prisma.$queryRawUnsafe<any[]>(
        `SELECT * FROM "MaintenancePart" WHERE "propertyId" = ? AND "currentStock" <= "minThreshold"`,
        propertyId
      );

      autoReorderSuggestions = (lowStockParts || []).map(part => {
        const suggestedQty = Math.max(5, Math.ceil(Number(part.minThreshold) * 2 - Number(part.currentStock)));
        const estCost = suggestedQty * Number(part.unitCost || 0);
        return {
          id: part.id,
          itemName: part.name,
          category: part.category,
          currentStock: Number(part.currentStock),
          minThreshold: Number(part.minThreshold),
          suggestedQty,
          unit: part.unit || 'pcs',
          unitCost: Number(part.unitCost || 0),
          estimatedTotal: estCost,
          vendorName: part.preferredVendor || 'Preferred Hotel Supplier',
          reason: `Stock is at ${part.currentStock} (Minimum safe threshold is ${part.minThreshold} ${part.unit})`,
        };
      });
    } catch (e) {
      console.log('Error scanning low parts for PO:', e);
    }

    // Summary KPIs
    const totalPurchasesMonth = formattedPOs
      .filter(p => p.status !== 'CANCELLED')
      .reduce((sum, p) => sum + Number(p.grandTotal || 0), 0);

    const pendingOrdersCount = formattedPOs.filter(p => p.status === 'ORDERED' || p.status === 'IN_TRANSIT').length;
    const deliveredCount = formattedPOs.filter(p => p.status === 'DELIVERED').length;

    return apiResponse({
      purchaseOrders: formattedPOs,
      vendors,
      autoReorderSuggestions,
      summary: {
        totalPurchasesMonth,
        pendingOrdersCount,
        deliveredCount,
        totalPOs: formattedPOs.length,
        totalVendors: vendors.length,
      }
    });
  } catch (error) {
    console.error('Purchases GET error:', error);
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensurePurchasesTables();
    const session = await getSession();
    const body = await request.json();
    const propertyId = body.propertyId || 'prop_default';

    const {
      vendorName,
      vendorPhone,
      vendorEmail,
      department,
      items, // array of { name, qty, unit, unitPrice, total }
      deliveryDate,
      notes,
      source,
      linkedTicketNo,
    } = body;

    if (!vendorName || !items || !Array.isArray(items) || items.length === 0) {
      return apiError(new Error('Vendor Name and at least one item are required to generate Purchase Order'), 400);
    }

    const subtotal = items.reduce((acc: number, it: any) => acc + (Number(it.qty || 1) * Number(it.unitPrice || 0)), 0);
    const taxRate = 0.18; // 18% standard GST
    const taxAmount = Math.round(subtotal * taxRate);
    const grandTotal = subtotal + taxAmount;

    // Generate unique PO sequence
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const deptPrefix = (department || 'MNT').substring(0, 3).toUpperCase();
    const poNumber = `PO-${new Date().getFullYear()}-${deptPrefix}-${randomSuffix}`;

    const poId = 'po_' + Math.random().toString(36).substring(2, 9);
    await prisma.$executeRawUnsafe(
      `INSERT INTO "HotelPurchaseOrder" 
       ("id", "propertyId", "poNumber", "vendorName", "vendorPhone", "vendorEmail", "department", "status", "totalAmount", "taxAmount", "grandTotal", "itemsCount", "itemsJson", "deliveryDate", "notes", "source", "linkedTicketNo", "createdBy", "createdAt", "updatedAt")
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      poId,
      propertyId,
      poNumber,
      vendorName,
      vendorPhone || '',
      vendorEmail || '',
      department || 'Maintenance',
      'ORDERED', // ready-made generated orders default to ORDERED
      subtotal,
      taxAmount,
      grandTotal,
      items.length,
      JSON.stringify(items),
      deliveryDate || new Date(Date.now() + 172800000).toISOString().split('T')[0],
      notes || '',
      source || 'MANUAL',
      linkedTicketNo || '',
      (session as any)?.name || session?.email || 'Hotel Procurement Manager'
    );

    return apiResponse({
      id: poId,
      poNumber,
      grandTotal,
      status: 'ORDERED',
    }, `Purchase Order ${poNumber} generated successfully! Ready for vendor dispatch.`, 201);
  } catch (error) {
    console.error('Purchases POST error:', error);
    return apiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await ensurePurchasesTables();
    const body = await request.json();
    const { poId, status, notes } = body;

    if (!poId || !status) {
      return apiError(new Error('PO ID and status are required'), 400);
    }

    await prisma.$executeRawUnsafe(
      `UPDATE "HotelPurchaseOrder" 
       SET "status" = ?, "notes" = COALESCE(?, "notes"), "updatedAt" = CURRENT_TIMESTAMP
       WHERE "id" = ?`,
      status,
      notes || null,
      poId
    );

    return apiResponse({ poId, status }, `Purchase Order status updated to ${status}`);
  } catch (error) {
    console.error('Purchases PATCH error:', error);
    return apiError(error);
  }
}
