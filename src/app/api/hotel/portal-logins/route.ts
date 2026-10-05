import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

let portalTableReady = false;
async function ensurePortalTable() {
  if (portalTableReady) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "HotelPortalCredential" (
        "id" TEXT PRIMARY KEY,
        "propertyId" TEXT NOT NULL,
        "portalKey" TEXT NOT NULL, /* housekeeper, spa, pos, kds, frontdesk, roomportal, kyc, admin */
        "portalName" TEXT NOT NULL,
        "role" TEXT NOT NULL,
        "urlPath" TEXT NOT NULL,
        "username" TEXT,
        "passcode" TEXT NOT NULL,
        "pinCode" TEXT,
        "isActive" INTEGER NOT NULL DEFAULT 1,
        "autoLoginEnabled" INTEGER NOT NULL DEFAULT 1,
        "notes" TEXT,
        "updatedAt" DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    portalTableReady = true;
  } catch (err) {
    console.error('[ensurePortalTable error]', err);
  }
}

const DEFAULT_PORTALS = [
  {
    portalKey: 'housekeeper',
    portalName: 'Housekeeper Mobile Portal',
    role: 'Housekeeping Staff & Supervisors',
    urlPath: '/housekeeper-portal/b0111',
    username: 'housekeeper@hotel.com',
    passcode: 'hk@2026',
    pinCode: '1122',
    notes: 'Used by room attendants on phone/tablet for cleaning checklist & room status.',
  },
  {
    portalKey: 'spa',
    portalName: 'Spa & Wellness Therapist Portal',
    role: 'Spa Therapists & Front Desk',
    urlPath: '/hotel/spa',
    username: 'spa.therapist@hotel.com',
    passcode: 'spa@relax',
    pinCode: '4455',
    notes: 'Appointments schedule, therapist assignment, and treatment price catalog.',
  },
  {
    portalKey: 'frontdesk',
    portalName: 'Front Desk & Receptionist Portal',
    role: 'Front Office Agents',
    urlPath: '/hotel/bookings',
    username: 'reception@hotel.com',
    passcode: 'front@desk2026',
    pinCode: '1001',
    notes: 'Guest check-in, checkout, folios, room keys, and live reservations calendar.',
  },
  {
    portalKey: 'pos',
    portalName: 'Restaurant POS & Waiter App',
    role: 'Waiters, Captains & Cashiers',
    urlPath: '/pos',
    username: 'pos.captain@hotel.com',
    passcode: 'pos@dine',
    pinCode: '7788',
    notes: 'Table ordering, KOT generation, room billing charge, and guest dining invoices.',
  },
  {
    portalKey: 'kds',
    portalName: 'Kitchen Order Display (KDS)',
    role: 'Executive Chef & Line Cooks',
    urlPath: '/pos',
    username: 'kitchen@hotel.com',
    passcode: 'kitchen@live',
    pinCode: '9900',
    notes: 'Live kitchen order screen with prep timer and order completion alerts.',
  },
  {
    portalKey: 'roomportal',
    portalName: 'Room Guest Self-Service App',
    role: 'Hotel In-Room Guests',
    urlPath: '/room-portal',
    username: 'guest@room',
    passcode: 'guest@pass',
    pinCode: '0000',
    notes: 'Scan room QR code to order food, book spa treatments, request laundry, and view WiFi.',
  },
  {
    portalKey: 'kyc',
    portalName: 'KYC Document & ID Scanner App',
    role: 'Security & Front Office Staff',
    urlPath: '/kyc-scan',
    username: 'kyc.guard@hotel.com',
    passcode: 'kyc@scan',
    pinCode: '3344',
    notes: 'Instant camera scan for Aadhaar, Passport, and Driving License verification.',
  },
  {
    portalKey: 'admin',
    portalName: 'General Manager / Hotel Owner Hub',
    role: 'General Manager & Property Owner',
    urlPath: '/hotel',
    username: 'hoteladmin@gmail.com',
    passcode: 'admin@pass123',
    pinCode: '9999',
    notes: 'Master hotel analytics, financial reports, room tariffs, and security audits.',
  }
];

export async function GET(req: NextRequest) {
  try {
    await ensurePortalTable();

    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get('propertyId') || 'prop_default';

    // Seed defaults if empty
    const countRes = await prisma.$queryRawUnsafe<any[]>(
      `SELECT count(*) as count FROM "HotelPortalCredential" WHERE "propertyId" = ?`,
      propertyId
    );
    const count = Number(countRes?.[0]?.count || 0);

    if (count === 0) {
      for (const p of DEFAULT_PORTALS) {
        const id = 'portal_' + Math.random().toString(36).substring(2, 9);
        await prisma.$executeRawUnsafe(
          `INSERT INTO "HotelPortalCredential" 
           ("id", "propertyId", "portalKey", "portalName", "role", "urlPath", "username", "passcode", "pinCode", "isActive", "autoLoginEnabled", "notes")
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?)`,
          id, propertyId, p.portalKey, p.portalName, p.role, p.urlPath, p.username, p.passcode, p.pinCode, p.notes
        );
      }
    }

    const portals = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM "HotelPortalCredential" WHERE "propertyId" = ? ORDER BY "id" ASC`,
      propertyId
    );

    return apiResponse(portals);
  } catch (error: any) {
    console.error('Portal Logins GET error:', error);
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensurePortalTable();
    const session = await getSession();
    const body = await req.json();

    const { id, portalKey, username, passcode, pinCode, isActive, notes, propertyId = 'prop_default' } = body;

    if (id) {
      await prisma.$executeRawUnsafe(
        `UPDATE "HotelPortalCredential"
         SET "username" = COALESCE(?, "username"),
             "passcode" = COALESCE(?, "passcode"),
             "pinCode"  = COALESCE(?, "pinCode"),
             "isActive" = COALESCE(?, "isActive"),
             "notes"    = COALESCE(?, "notes"),
             "updatedAt" = CURRENT_TIMESTAMP
         WHERE "id" = ?`,
        username || null,
        passcode || null,
        pinCode || null,
        typeof isActive === 'number' ? isActive : null,
        notes || null,
        id
      );
    } else if (portalKey) {
      await prisma.$executeRawUnsafe(
        `UPDATE "HotelPortalCredential"
         SET "username" = COALESCE(?, "username"),
             "passcode" = COALESCE(?, "passcode"),
             "pinCode"  = COALESCE(?, "pinCode"),
             "updatedAt" = CURRENT_TIMESTAMP
         WHERE "portalKey" = ? AND "propertyId" = ?`,
        username || null,
        passcode || null,
        pinCode || null,
        portalKey,
        propertyId
      );
    }

    return apiResponse({ success: true }, 'Portal login credentials updated successfully!');
  } catch (error: any) {
    console.error('Portal Logins POST error:', error);
    return apiError(error);
  }
}
