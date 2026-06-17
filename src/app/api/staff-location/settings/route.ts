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

    const [settings, property] = await Promise.all([
      (prisma as any).staffLocationSettings.findUnique({
        where: { propertyId: session.propertyId },
      }),
      prisma.property.findUnique({
        where: { id: session.propertyId },
        select: { latitude: true, longitude: true },
      })
    ]);

    const baseLat = settings?.baseLat || property?.latitude || 0;
    const baseLng = settings?.baseLng || property?.longitude || 0;

    return NextResponse.json({
      success: true,
      data: {
        propertyId: session.propertyId,
        baseLat,
        baseLng,
        alertDistanceMeters: settings?.alertDistanceMeters ?? 500,
        trackingEnabled: settings?.trackingEnabled ?? true,
      }
    });
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
