import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { getWTUserFromRequest } from '@/lib/walkie-talkie-auth';

/**
 * GET /api/staff-location/settings
 * Supports WT Bearer token (mobile) AND session cookie (web portal).
 * Returns base location from Property.latitude/longitude.
 */
export async function GET(request: NextRequest) {
  try {
    const wtUser = await getWTUserFromRequest(request);
    const session = await getSession();
    const propertyId: string | undefined = wtUser?.propertyId || session?.propertyId || undefined;

    if (!propertyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Try StaffLocationSettings first, fallback to Property.latitude (graceful degradation)
    let baseLat = 0;
    let baseLng = 0;
    let alertDistanceMeters = 500;

    try {
      // Try reading StaffLocationSettings if the table exists
      const settings = await (prisma as any).staffLocationSettings?.findUnique?.({
        where: { propertyId },
      });
      if (settings?.baseLat) baseLat = settings.baseLat;
      if (settings?.baseLng) baseLng = settings.baseLng;
      if (settings?.alertDistanceMeters) alertDistanceMeters = settings.alertDistanceMeters;
    } catch (_) {
      // StaffLocationSettings table may not exist — use Property fallback
    }

    // Always fallback to Property.latitude/longitude if settings not set
    if (!baseLat || !baseLng) {
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
        select: { latitude: true, longitude: true },
      });
      if (property?.latitude) baseLat = property.latitude;
      if (property?.longitude) baseLng = property.longitude;
    }

    return NextResponse.json({
      success: true,
      data: {
        propertyId,
        baseLat,
        baseLng,
        alertDistanceMeters,
        trackingEnabled: true,
        hasBaseLocation: baseLat !== 0 || baseLng !== 0,
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
