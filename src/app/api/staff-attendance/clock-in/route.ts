import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';
import { getWTUserFromRequest } from '@/lib/walkie-talkie-auth';
import { createNotification } from '@/lib/notificationService';
import { format } from 'date-fns';

/**
 * POST /api/staff-attendance/clock-in
 * Clocks in the authenticated staff user / housekeeper.
 * After a successful clock-in, sends a STAFF notification to Hotel Admin / Manager.
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

    // Resolve staff member record (may be null for direct users)
    const staffMember = await prisma.staffMember.findFirst({
      where: { OR: [{ userId }, { id: userId }] },
    });

    // Resolve the staff's display name for notification
    let staffName = 'A staff member';
    try {
      if (staffMember?.name) {
        staffName = staffMember.name;
      } else {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { fullName: true, email: true },
        });
        staffName = user?.fullName || user?.email || staffName;
      }
    } catch (_) {}

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

    const locationStr = body.location || 'Hotel Premises';
    const isAuto = Boolean(body.auto);
    const clockInTime = format(new Date(), 'hh:mm a');

    const attendance = await prisma.attendance.create({
      data: {
        propertyId,
        userId: staffMember ? null : userId,
        staffMemberId: staffMember ? staffMember.id : null,
        clockIn: new Date(),
        status: 'PRESENT',
        locationIn: locationStr,
        note: body.note || (isAuto ? 'Auto clocked in on portal access' : 'Clocked in via Staff Portal'),
      },
    });

    // ── Notify Hotel Admin / Manager about the clock-in ──
    try {
      await createNotification({
        propertyId,
        title: isAuto ? '🕐 Auto Clock-In' : '✅ Staff Clocked In',
        message: `${staffName} clocked in at ${clockInTime}${locationStr ? ` — ${locationStr}` : ''}.`,
        type: 'STAFF',
        priority: 'MEDIUM',
        metadata: {
          userId,
          attendanceId: attendance.id,
          staffName,
          clockInTime,
          location: locationStr,
          isAuto,
          link: '/hotel/staff/attendance',
        },
      });
    } catch (notifErr) {
      // Notification failure should never block clock-in success
      console.error('[Clock-In Notification Error]', notifErr);
    }

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
