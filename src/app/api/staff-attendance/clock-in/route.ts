import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';
import { getWTUserFromRequest } from '@/lib/walkie-talkie-auth';

/**
 * POST /api/staff-attendance/clock-in
 * Clocks in the authenticated staff user / housekeeper.
 */
export async function POST(request: NextRequest) {
  try {
    let session = await getSession();
    let staffUser: any = null;
    if (!session) {
      staffUser = await getWTUserFromRequest(request as any);
    }

    if (!session && !staffUser) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const body = await request.json().catch(() => ({}));
    const userId = session?.id || staffUser?.id;
    const propertyId = session?.propertyId || staffUser?.propertyId;

    if (!userId || !propertyId) {
      return apiError(new Error('User or Property ID missing'), 400);
    }

    // Check if staff member record exists
    const staffMember = await prisma.staffMember.findFirst({
      where: { OR: [{ userId }, { id: userId }] },
    });

    const whereOr: any[] = [{ userId, clockOut: null }];
    if (staffMember) {
      whereOr.push({ staffMemberId: staffMember.id, clockOut: null });
    }

    // Check if already clocked in
    const active = await prisma.attendance.findFirst({
      where: {
        propertyId,
        OR: whereOr,
      },
    });

    if (active) {
      return apiResponse(
        {
          id: active.id,
          clockIn: active.clockIn.toISOString(),
          status: active.status,
          alreadyClockedIn: true,
        },
        'Already clocked in for today'
      );
    }

    const locationStr = body.location || 'Hotel Premises (Auto Geofence)';

    const attendance = await prisma.attendance.create({
      data: {
        propertyId,
        userId: staffMember ? null : userId,
        staffMemberId: staffMember ? staffMember.id : null,
        clockIn: new Date(),
        status: 'PRESENT',
        locationIn: locationStr,
        note: body.note || (body.auto ? 'Auto clocked in on portal access' : 'Clocked in via Housekeeper Portal'),
      },
    });

    return apiResponse(
      {
        id: attendance.id,
        clockIn: attendance.clockIn.toISOString(),
        status: attendance.status,
        alreadyClockedIn: false,
      },
      'Clocked in successfully',
      201
    );
  } catch (error) {
    return apiError(error);
  }
}
