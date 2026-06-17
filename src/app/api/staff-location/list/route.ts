import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

/**
 * GET /api/staff-location/list
 * Returns all staff users for this property with:
 *  - Their latest location ping
 *  - Last 10 pings (history)
 *  - isOutOfRange flag
 *  - distanceFromBase in metres
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.propertyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const propertyId = session.propertyId;

    // Fetch all staff users for this property
    const staffUsers = await prisma.user.findMany({
      where: { propertyId, isActive: true },
      select: {
        id: true,
        fullName: true,
        designation: true,
        phone: true,
        wtStatus: true,
        staffLocationPings: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            lat: true,
            lng: true,
            distanceFromBase: true,
            isOutOfRange: true,
            createdAt: true,
          },
        },
      },
      orderBy: { fullName: 'asc' },
    });

    // Shape response — attach latestPing and history
    const result = (staffUsers as any[]).map((u: any) => {
      const pings = u.staffLocationPings as any[];
      const latest = pings[0] || null;
      return {
        userId: u.id,
        fullName: u.fullName,
        designation: u.designation,
        phone: u.phone,
        wtStatus: u.wtStatus,
        latestPing: latest,
        lastSeen: latest?.createdAt || null,
        distanceFromBase: latest?.distanceFromBase ?? null,
        isOutOfRange: latest?.isOutOfRange ?? false,
        isTracking: !!latest,
        history: pings,
      };
    });
    // Also fetch settings & property coordinates
    const [settings, property] = await Promise.all([
      (prisma as any).staffLocationSettings.findUnique({
        where: { propertyId },
      }),
      prisma.property.findUnique({
        where: { id: propertyId },
        select: { latitude: true, longitude: true },
      })
    ]);

    return NextResponse.json({
      success: true,
      data: result,
      settings: {
        propertyId,
        baseLat: settings?.baseLat || property?.latitude || 0,
        baseLng: settings?.baseLng || property?.longitude || 0,
        alertDistanceMeters: settings?.alertDistanceMeters ?? 500,
        trackingEnabled: settings?.trackingEnabled ?? true,
      },
    });
  } catch (error: any) {
    console.error('[StaffLocation List]', error);
    return NextResponse.json({ message: error.message || 'Server error' }, { status: 500 });
  }
}
