import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { apiError, apiResponse } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const { action, note, location, userId: targetId } = body; 

    if (!targetId) return apiError(new Error('Staff ID is required'), 400);

    // 1. Determine if targetId is a User or a StaffMember
    const isStaffMember = await prisma.staffMember.findUnique({ where: { id: targetId } });
    const isUser = !isStaffMember ? await prisma.user.findUnique({ where: { id: targetId } }) : null;

    if (!isStaffMember && !isUser) {
      return apiError(new Error('Employee not found'), 404);
    }

    const whereClause = isStaffMember 
      ? { staffMemberId: targetId, clockOut: null }
      : { userId: targetId, clockOut: null };

    if (action === 'clock-in') {
      const existing = await prisma.attendance.findFirst({ where: whereClause });
      if (existing) return apiError(new Error('Already clocked in'), 400);

      const attendance = await prisma.attendance.create({
        data: {
          propertyId: session.propertyId as string,
          userId: isUser ? targetId : null,
          staffMemberId: isStaffMember ? targetId : null,
          clockIn: new Date(),
          status: 'PRESENT',
          note,
          locationIn: location
        }
      });
      return apiResponse(attendance, 'Clocked in successfully');
    } else if (action === 'clock-out') {
      const active = await prisma.attendance.findFirst({
        where: whereClause,
        orderBy: { clockIn: 'desc' }
      });

      if (!active) return apiError(new Error('No active session found'), 400);

      const attendance = await prisma.attendance.update({
        where: { id: active.id },
        data: {
          clockOut: new Date(),
          locationOut: location
        }
      });
      return apiResponse(attendance, 'Clocked out successfully');
    }

    return apiError(new Error('Invalid action'), 400);
  } catch (error) {
    return apiError(error);
  }
}
