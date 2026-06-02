import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { apiError } from '@/lib/api-utils';
import { startOfMonth, endOfMonth } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    let referenceDate = new Date();
    if (dateParam) {
      const parsed = new Date(dateParam);
      if (!isNaN(parsed.getTime())) {
        referenceDate = parsed;
      }
    }

    const monthStart = startOfMonth(referenceDate);
    const monthEnd = endOfMonth(referenceDate);

    if (!session.propertyId) {
      return NextResponse.json({ success: true, data: [] });
    }

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

    // Fetch Property-level targetShiftHours
    const property = await prisma.property.findUnique({
      where: { id: session.propertyId as string },
      select: { targetShiftHours: true }
    });
    const defaultShiftHours = property?.targetShiftHours ?? 8.0;

    // 3. Unify both into a single list for the Hub
    const unified = [
      ...users.map((u: any) => ({
        id: u.id,
        fullName: u.fullName,
        type: 'USER',
        role: u.role,
        activeSession: u.attendance.find((a: any) => a.clockOut === null) || null,
        attendanceRecords: u.attendance,
        shiftHours: defaultShiftHours
      })),
      ...staffMembers.map((s: any) => ({
        id: s.id,
        fullName: s.name,
        type: 'STAFF',
        role: { name: s.designation || 'Staff' },
        activeSession: s.attendance.find((a: any) => a.clockOut === null) || null,
        attendanceRecords: s.attendance,
        shiftHours: s.shiftHours ?? defaultShiftHours
      }))
    ];

    return NextResponse.json({
      success: true,
      data: unified,
      targetShiftHours: defaultShiftHours
    });
  } catch (error) {
    return apiError(error);
  }
}
