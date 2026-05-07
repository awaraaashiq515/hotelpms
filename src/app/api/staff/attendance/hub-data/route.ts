import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { apiError, apiResponse } from '@/lib/api-utils';
import { startOfMonth, endOfMonth } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const monthStart = startOfMonth(new Date());
    const monthEnd = endOfMonth(new Date());

    // 1. Fetch Users (Admins, POS System etc)
    const users = await prisma.user.findMany({
      where: { 
        propertyId: session.propertyId as string,
        isActive: true,
      },
      include: {
        role: { select: { name: true } },
        attendance: {
          where: {
            clockIn: { gte: monthStart, lte: monthEnd }
          }
        }
      }
    });

    // 2. Fetch POS Staff (Waiters, Stewards added via POS Support Staff page)
    const staffMembers = await prisma.staffMember.findMany({
      where: {
        propertyId: session.propertyId as string,
        isActive: true
      },
      include: {
        attendance: {
          where: {
            clockIn: { gte: monthStart, lte: monthEnd }
          }
        }
      }
    });

    // 3. Unify both into a single list for the Hub
    const unified = [
      ...users.map((u: any) => ({
        id: u.id,
        fullName: u.fullName,
        type: 'USER',
        role: u.role,
        activeSession: u.attendance.find((a: any) => a.clockOut === null) || null,
        attendanceRecords: u.attendance
      })),
      ...staffMembers.map((s: any) => ({
        id: s.id,
        fullName: s.name,
        type: 'STAFF',
        role: { name: s.designation || 'Staff' },
        activeSession: s.attendance.find((a: any) => a.clockOut === null) || null,
        attendanceRecords: s.attendance
      }))
    ];

    return apiResponse(unified);
  } catch (error) {
    return apiError(error);
  }
}
