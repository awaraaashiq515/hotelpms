import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

/**
 * GET /api/staff-location/settings
 * Returns the current StaffLocationSettings for the logged-in property.
 * If no row exists yet, returns safe defaults.
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.propertyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    let settings = await (prisma as any).staffLocationSettings.findUnique({
      where: { propertyId: session.propertyId },
    });

    if (!settings) {
      // Return defaults — nothing saved yet
      settings = {
        propertyId: session.propertyId,
        baseLat: 0,
        baseLng: 0,
        alertDistanceMeters: 500,
        trackingEnabled: true,
      };
    }

    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    console.error('[StaffLocation Settings GET]', error);
    return NextResponse.json({ message: error.message || 'Server error' }, { status: 500 });
  }
}

/**
 * PUT /api/staff-location/settings
 * Body: { baseLat, baseLng, alertDistanceMeters, trackingEnabled }
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.propertyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { baseLat, baseLng, alertDistanceMeters, trackingEnabled } = body;

    const settings = await (prisma as any).staffLocationSettings.upsert({
      where: { propertyId: session.propertyId },
      update: {
        baseLat: parseFloat(baseLat) || 0,
        baseLng: parseFloat(baseLng) || 0,
        alertDistanceMeters: parseFloat(alertDistanceMeters) || 500,
        trackingEnabled: Boolean(trackingEnabled),
      },
      create: {
        propertyId: session.propertyId,
        baseLat: parseFloat(baseLat) || 0,
        baseLng: parseFloat(baseLng) || 0,
        alertDistanceMeters: parseFloat(alertDistanceMeters) || 500,
        trackingEnabled: Boolean(trackingEnabled),
      },
    });

    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    console.error('[StaffLocation Settings PUT]', error);
    return NextResponse.json({ message: error.message || 'Server error' }, { status: 500 });
  }
}
