import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

const secretKey = process.env.JWT_SECRET || 'super-secret-default-key-change-it-in-prod';
const key = new TextEncoder().encode(secretKey);

async function verifyRoomPortalToken(request: NextRequest) {
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
    if ((payload as any).type !== 'ROOM_PORTAL') return null;
    const session = await prisma.roomPortalSession.findFirst({ where: { token, isActive: true } });
    if (!session) return null;
    return payload as any;
  } catch {
    return null;
  }
}

import { getSession } from '@/lib/session';

// GET: Fetch property config for room portal dashboard or admin editor
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const adminMode = url.searchParams.get('adminMode') === 'true';
    const queryPropertyId = url.searchParams.get('propertyId');

    let propertyId: string | null = null;

    if (adminMode && queryPropertyId) {
      propertyId = queryPropertyId;
    } else {
      const payload = await verifyRoomPortalToken(request);
      if (payload) {
        propertyId = payload.propertyId;
      }
    }

    if (!propertyId) {
      return NextResponse.json({ success: false, message: 'Property ID required or unauthorized.' }, { status: 401 });
    }

    // Fetch or auto-create config
    let config = await prisma.roomPortalConfig.findFirst({ where: { propertyId } });

    if (!config) {
      // Seed from property settings
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
        select: {
          hotelWifiName: true,
          hotelWifiPassword: true,
          gymTimings: true,
          poolTimings: true,
          breakfastTimings: true,
          phone: true,
          brandName: true,
          name: true,
        },
      });

      config = await prisma.roomPortalConfig.create({
        data: {
          propertyId,
          wifiName: property?.hotelWifiName || 'Hotel-Free-WiFi',
          wifiPassword: property?.hotelWifiPassword || 'welcome123',
          gymTimings: property?.gymTimings || '06:00 AM - 10:00 PM',
          poolTimings: property?.poolTimings || '07:00 AM - 08:00 PM',
          breakfastTimings: property?.breakfastTimings || '07:00 AM - 10:30 AM',
          frontDeskPhone: property?.phone || '',
          welcomeTitle: `Welcome to ${property?.brandName || property?.name || 'Our Hotel'}`,
          showRoomService: true,
          showHousekeeping: true,
          showWifi: true,
          showAmenities: true,
          showBill: true,
          showContact: true,
          showFeedback: true,
          showCheckout: true,
        },
      });
    }

    return NextResponse.json({ success: true, data: config });
  } catch (error: any) {
    console.error('[Room Portal Config Error]:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch config.' }, { status: 500 });
  }
}

// PATCH: Admin update config (supports admin session and Bearer token)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const cookieSession = request.cookies.get('session')?.value;

    let isAuthorized = !!session || !!cookieSession;

    if (!isAuthorized && token) {
      const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] }).catch(() => ({ payload: null }));
      if (payload && (payload as any).id) isAuthorized = true;
    }

    const body = await request.json();
    const { propertyId, id, createdAt, updatedAt, ...rawUpdates } = body;

    if (!propertyId) {
      return NextResponse.json({ success: false, message: 'Property ID required.' }, { status: 400 });
    }

    // Clean boolean toggles & values
    const updates: Record<string, any> = {};
    for (const [k, v] of Object.entries(rawUpdates)) {
      if (v !== undefined) updates[k] = v;
    }

    const config = await prisma.roomPortalConfig.upsert({
      where: { propertyId },
      update: updates,
      create: { propertyId, ...updates },
    });

    return NextResponse.json({ success: true, data: config });
  } catch (error: any) {
    console.error('[Room Portal Config PATCH Error]:', error);
    return NextResponse.json({ success: false, message: 'Failed to update config.' }, { status: 500 });
  }
}
