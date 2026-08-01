import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';
import { getWTUserFromRequest } from '@/lib/walkie-talkie-auth';

/**
 * GET /api/staff-attendance
 * Returns attendance history for the authenticated housekeeper/staff user.
 */
export async function GET(request: NextRequest) {
  try {
    let session = await getSession();
    let staffUser: any = null;
    if (!session) {
      staffUser = await getWTUserFromRequest(request as any);
    }

    if (!session && !staffUser) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const userId = session?.id || staffUser?.id;
    const propertyId = session?.propertyId || staffUser?.propertyId;

    if (!userId || !propertyId) {
      return apiError(new Error('User or Property ID missing'), 400);
    }

    // Find staff member linked to user if any
    const staffMember = await prisma.staffMember.findFirst({
      where: { OR: [{ userId }, { id: userId }] },
    });

    const whereOr: any[] = [{ userId }];
    if (staffMember) {
      whereOr.push({ staffMemberId: staffMember.id });
    }

    const records = await prisma.attendance.findMany({
      where: {
        propertyId,
        OR: whereOr,
      },
      orderBy: { clockIn: 'desc' },
      take: 50,
    });

    const formatted = records.map((r: any) => ({
      id: r.id,
      date: r.clockIn ? r.clockIn.toISOString() : new Date().toISOString(),
      clockIn: r.clockIn ? r.clockIn.toISOString() : null,
      clockOut: r.clockOut ? r.clockOut.toISOString() : null,
      status: r.status,
      locationIn: r.locationIn,
      locationOut: r.locationOut,
      note: r.note,
    }));

    return apiResponse(formatted, 'Attendance records fetched');
  } catch (error) {
    return apiError(error);
  }
}
