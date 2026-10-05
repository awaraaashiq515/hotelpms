import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';
import { getWTUserFromRequest } from '@/lib/walkie-talkie-auth';

let washLogsTableReady = false;
async function ensureWashLogsTable() {
  if (washLogsTableReady) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "DailyWashLog" (
        "id" TEXT PRIMARY KEY,
        "propertyId" TEXT NOT NULL,
        "date" TEXT NOT NULL,
        "itemName" TEXT NOT NULL,
        "washType" TEXT NOT NULL, /* "HOTEL_LINEN" or "GUEST_CLOTHES" */
        "piecesWashed" INTEGER NOT NULL,
        "cleanCount" INTEGER NOT NULL,
        "soiledPending" INTEGER NOT NULL DEFAULT 0,
        "detergentUsed" TEXT,
        "washStatus" TEXT NOT NULL DEFAULT 'COMPLETED', /* "WASHING", "DRYING", "COMPLETED" */
        "notes" TEXT,
        "loggedBy" TEXT,
        "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    washLogsTableReady = true;
  } catch (err) {
    console.error('[ensureWashLogsTable error]', err);
  }
}

// Default initial daily wash logs
const DEFAULT_WASH_LOGS = [
  {
    date: new Date().toISOString().split('T')[0],
    itemName: "Double Bed Sheets",
    washType: "HOTEL_LINEN",
    piecesWashed: 30,
    cleanCount: 28,
    soiledPending: 2,
    detergentUsed: "1.2 kg Surf Excel + 300ml Softener",
    washStatus: "COMPLETED",
    notes: "From 2nd & 3rd floor checkout rooms, fully sanitized & ironed",
    loggedBy: "Ramesh (Housekeeping)",
  },
  {
    date: new Date().toISOString().split('T')[0],
    itemName: "Bath Towels (600 GSM)",
    washType: "HOTEL_LINEN",
    piecesWashed: 45,
    cleanCount: 45,
    soiledPending: 0,
    detergentUsed: "1.5 kg Surf Excel + 400ml Comfort",
    washStatus: "COMPLETED",
    notes: "Fluffy dry cycle with fabric conditioner",
    loggedBy: "Sunita (Laundry Staff)",
  },
  {
    date: new Date().toISOString().split('T')[0],
    itemName: "Pillow Covers (Pairs)",
    washType: "HOTEL_LINEN",
    piecesWashed: 60,
    cleanCount: 58,
    soiledPending: 2,
    detergentUsed: "800g Powder + Bleach for tea stains",
    washStatus: "COMPLETED",
    notes: "2 covers had stubborn stains, kept for secondary soak",
    loggedBy: "Ramesh (Housekeeping)",
  },
];

export async function GET(req: NextRequest) {
  try {
    await ensureWashLogsTable();
    const { searchParams } = new URL(req.url);
    const propId = searchParams.get('propertyId') || 'default-property';
    const date = searchParams.get('date');

    let query = `SELECT * FROM "DailyWashLog" WHERE ("propertyId" = ? OR "propertyId" = 'default-property')`;
    const params: any[] = [propId];
    if (date) {
      query += ` AND "date" = ?`;
      params.push(date);
    }
    query += ` ORDER BY "createdAt" DESC LIMIT 100`;

    let logs: any[] = [];
    try {
      logs = await prisma.$queryRawUnsafe(query, ...params);
    } catch {
      logs = [];
    }

    // Auto-seed if empty
    if (!logs || logs.length === 0) {
      for (const it of DEFAULT_WASH_LOGS) {
        const id = 'dwl_' + Math.random().toString(36).substring(2, 10);
        await prisma.$executeRawUnsafe(
          `INSERT INTO "DailyWashLog" ("id", "propertyId", "date", "itemName", "washType", "piecesWashed", "cleanCount", "soiledPending", "detergentUsed", "washStatus", "notes", "loggedBy")
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          id, propId, it.date, it.itemName, it.washType, it.piecesWashed, it.cleanCount, it.soiledPending, it.detergentUsed, it.washStatus, it.notes, it.loggedBy
        );
      }
      logs = await prisma.$queryRawUnsafe(query, ...params);
    }

    // Calculate daily summary stats
    const todayStr = new Date().toISOString().split('T')[0];
    const todayLogs = (logs || []).filter((l: any) => l.date === todayStr);
    const todayPiecesWashed = todayLogs.reduce((sum: number, l: any) => sum + (Number(l.piecesWashed) || 0), 0);
    const todayCleanReady = todayLogs.reduce((sum: number, l: any) => sum + (Number(l.cleanCount) || 0), 0);
    const todaySoiledPending = todayLogs.reduce((sum: number, l: any) => sum + (Number(l.soiledPending) || 0), 0);

    return apiResponse({
      logs,
      summary: {
        todayPiecesWashed,
        todayCleanReady,
        todaySoiledPending,
        totalBatches: todayLogs.length,
      }
    });
  } catch (err: any) {
    return apiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureWashLogsTable();
    const session = await getSession();
    const staff = !session ? await getWTUserFromRequest(req as any) : null;
    const body = await req.json();

    const {
      propertyId,
      date,
      itemName,
      washType,
      piecesWashed,
      cleanCount,
      soiledPending,
      detergentUsed,
      washStatus,
      notes,
      loggedBy,
    } = body;

    if (!itemName || piecesWashed === undefined) {
      return apiError(new Error('Item name and pieces count are required'), 400);
    }

    const id = 'dwl_' + Math.random().toString(36).substring(2, 10);
    const targetPropId = propertyId || (session?.propertyId || staff?.propertyId || 'default-property');
    const washDate = date || new Date().toISOString().split('T')[0];
    const staffName = loggedBy || (session?.email || staff?.fullName || 'Housekeeping Staff');

    const totalWashed = Number(piecesWashed) || 0;
    const clean = cleanCount !== undefined ? Number(cleanCount) : totalWashed;
    const soiled = soiledPending !== undefined ? Number(soiledPending) : Math.max(0, totalWashed - clean);

    await prisma.$executeRawUnsafe(
      `INSERT INTO "DailyWashLog" ("id", "propertyId", "date", "itemName", "washType", "piecesWashed", "cleanCount", "soiledPending", "detergentUsed", "washStatus", "notes", "loggedBy")
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      targetPropId,
      washDate,
      itemName,
      washType || "HOTEL_LINEN",
      totalWashed,
      clean,
      soiled,
      detergentUsed || "Standard Detergent Cycle",
      washStatus || "COMPLETED",
      notes || "",
      staffName
    );

    return apiResponse({ id, success: true, message: `Logged ${totalWashed} pieces of ${itemName} washed!` }, 'Created', 201);
  } catch (err: any) {
    return apiError(err);
  }
}
