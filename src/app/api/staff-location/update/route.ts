import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getWTUserFromRequest } from '@/lib/walkie-talkie-auth';
import { getSession } from '@/lib/session';
import { createNotification } from '@/lib/notificationService';

/** Haversine formula — returns distance in metres between two GPS points */
function haversineMetres(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth radius in metres
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * POST /api/staff-location/update
 * Body: { lat: number, lng: number, autoAttendance?: boolean }
 * Auth: Bearer WT token  OR  session cookie (supports both portals)
 */
export async function POST(request: NextRequest) {
  try {
    // Support both staff-portal (WT token) and POS session
    const wtUser = await getWTUserFromRequest(request);
    const session = await getSession();
    const userId: string | undefined = wtUser?.id || session?.id;
    const propertyId: string | undefined = wtUser?.propertyId || session?.propertyId || undefined;

    if (!userId || !propertyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const lat = parseFloat(body.lat);
    const lng = parseFloat(body.lng);
    const autoAttendance = body.autoAttendance === true;

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json({ message: 'lat and lng are required numbers' }, { status: 400 });
    }

    // Fetch property settings (base location + threshold)
    const settings = await (prisma as any).staffLocationSettings.findUnique({
      where: { propertyId },
    });

    let distanceFromBase = 0;
    let isOutOfRange = false;

    if (settings && (settings.baseLat !== 0 || settings.baseLng !== 0)) {
      distanceFromBase = haversineMetres(settings.baseLat, settings.baseLng, lat, lng);
      isOutOfRange = distanceFromBase > settings.alertDistanceMeters;
    }

    // Save ping
    const ping = await (prisma as any).staffLocation.create({
      data: {
        userId,
        propertyId,
        lat,
        lng,
        distanceFromBase,
        isOutOfRange,
      },
    });

    // ── GPS-Based Auto-Attendance Proximity Verification ──
    if (autoAttendance) {
      try {
        const active = await prisma.attendance.findFirst({
          where: {
            userId,
            clockOut: null
          },
          orderBy: { clockIn: 'desc' }
        });

        if (!isOutOfRange) {
          // Inside property range: auto clock-in if not currently active
          if (!active) {
            const attendance = await prisma.attendance.create({
              data: {
                propertyId,
                userId,
                clockIn: new Date(),
                status: 'PRESENT',
                note: 'Auto Clock-In (GPS Proximity)',
                locationIn: `${lat},${lng}`
              }
            });

            // Trigger manager notification
            try {
              const u = await prisma.user.findUnique({ where: { id: userId } });
              await createNotification({
                propertyId,
                title: 'Auto Clock-In',
                message: `${u?.fullName || 'Staff member'} logged in automatically (entered restaurant base range).`,
                type: 'STAFF',
                priority: 'LOW',
                metadata: {
                  userId,
                  attendanceId: attendance.id,
                  link: '/reports/attendance'
                }
              });
            } catch (e) {}
          }
        } else {
          // Outside property range: auto clock-out if currently active
          if (active) {
            const attendance = await prisma.attendance.update({
              where: { id: active.id },
              data: {
                clockOut: new Date(),
                locationOut: `${lat},${lng}`
              }
            });

            // Trigger manager notification
            try {
              const u = await prisma.user.findUnique({ where: { id: userId } });
              await createNotification({
                propertyId,
                title: 'Auto Clock-Out',
                message: `${u?.fullName || 'Staff member'} logged out automatically (left restaurant base range).`,
                type: 'STAFF',
                priority: 'LOW',
                metadata: {
                  userId,
                  attendanceId: attendance.id,
                  link: '/reports/attendance'
                }
              });
            } catch (e) {}
          }
        }
      } catch (autoErr) {
        console.error('[Auto-Attendance Trigger Error]', autoErr);
      }
    }

    return NextResponse.json({ success: true, ping });
  } catch (error: any) {
    console.error('[StaffLocation Update]', error);
    return NextResponse.json({ message: error.message || 'Server error' }, { status: 500 });
  }
}
