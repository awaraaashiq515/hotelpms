import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';
import { getWTUserFromRequest } from '@/lib/walkie-talkie-auth';

/**
 * GET /api/staff-attendance
 * Returns attendance history, shift hours, overtime calculations, monthly statistics, and leave records.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    let staffUser: any = null;
    if (!session) {
      staffUser = await getWTUserFromRequest(request as any);
    }

    if (!session && !staffUser) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const userId = session?.id || staffUser?.id;
    let propertyId = session?.propertyId || staffUser?.propertyId;

    if (!userId || !propertyId) {
      return apiError(new Error('User or Property ID missing'), 400);
    }

    const { searchParams } = new URL(request.url);
    const fetchAll = searchParams.get('all') === 'true';

    // If propertyCode passed, resolve it
    const propertyCode = searchParams.get('propertyCode');
    if (propertyCode) {
      const prop = await prisma.property.findFirst({
        where: { code: propertyCode.toUpperCase() },
        select: { id: true },
      });
      if (prop?.id) propertyId = prop.id;
    }

    if (fetchAll) {
      let whereClause: any = { propertyId };
      if (session?.organizationId) {
        whereClause = { property: { organizationId: session.organizationId } };
      }

      const records = await prisma.attendance.findMany({
        where: whereClause,
        orderBy: { clockIn: 'desc' },
        take: 1000,
        include: {
          staffMember: { select: { id: true, name: true, designation: true, shiftHours: true } },
          property: { select: { id: true, name: true, code: true } }
        },
      });
      return apiResponse(records, 'All attendance records fetched');
    }

    // Find staff member linked to user if any
    let staffMember = await prisma.staffMember.findFirst({
      where: { OR: [{ userId }, { id: userId }] },
    });

    // Auto-create staffMember if not exists yet for this staffUser
    if (!staffMember && staffUser?.id) {
      try {
        const existingStaff = await prisma.staffMember.findFirst({
          where: { userId: staffUser.id },
        });
        if (existingStaff) {
          staffMember = existingStaff;
        } else {
          staffMember = await prisma.staffMember.create({
            data: {
              name: staffUser.fullName || staffUser.email.split('@')[0],
              propertyId,
              userId: staffUser.id,
              designation: staffUser.role?.name || 'Housekeeping Staff',
              shiftHours: 8.0,
              salary: 0,
            },
          });
        }
      } catch (_) {}
    }

    const whereOr: any[] = [{ userId }];
    if (staffMember) {
      whereOr.push({ staffMemberId: staffMember.id });
    }

    let recordsWhere: any = { OR: whereOr };
    if (session?.organizationId) {
      recordsWhere = {
        property: { organizationId: session.organizationId },
        OR: whereOr,
      };
    } else if (propertyId) {
      recordsWhere = { propertyId, OR: whereOr };
    }

    const records = await prisma.attendance.findMany({
      where: recordsWhere,
      orderBy: { clockIn: 'desc' },
      take: 120,
    });

    const shiftHours = staffMember?.shiftHours || 8.0;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const formatted = records.map((r: any) => {
      const cin = r.clockIn ? new Date(r.clockIn) : null;
      const cout = r.clockOut ? new Date(r.clockOut) : null;
      let durationHours = 0;
      if (cin && cout) {
        durationHours = Math.max(0, (cout.getTime() - cin.getTime()) / (1000 * 60 * 60));
      } else if (cin && !cout) {
        // currently clocked in
        durationHours = Math.max(0, (Date.now() - cin.getTime()) / (1000 * 60 * 60));
      }

      const overtimeHours = durationHours > shiftHours ? Number((durationHours - shiftHours).toFixed(1)) : 0;

      return {
        id: r.id,
        date: r.clockIn ? r.clockIn.toISOString() : new Date().toISOString(),
        clockIn: r.clockIn ? r.clockIn.toISOString() : null,
        clockOut: r.clockOut ? r.clockOut.toISOString() : null,
        status: r.status,
        locationIn: r.locationIn,
        locationOut: r.locationOut,
        note: r.note,
        durationHours: Number(durationHours.toFixed(1)),
        shiftHours: shiftHours,
        overtimeHours: overtimeHours,
      };
    });

    // Calculate monthly statistics for current month
    const monthRecords = formatted.filter(r => {
      const d = new Date(r.date);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });

    const uniqueDaysSet = new Set(monthRecords.filter(r => r.status === 'PRESENT' || r.clockIn).map(r => r.date.split('T')[0]));
    const daysPresent = uniqueDaysSet.size;
    const totalMonthWorkedHours = Number(monthRecords.reduce((sum, r) => sum + (r.durationHours || 0), 0).toFixed(1));
    const totalMonthOvertimeHours = Number(monthRecords.reduce((sum, r) => sum + (r.overtimeHours || 0), 0).toFixed(1));

    // Fetch leaves for this staff
    let leaves: any[] = [];
    if (staffMember?.id) {
      try {
        leaves = await (prisma as any).leaveRequest.findMany({
          where: { staffId: staffMember.id },
          orderBy: { appliedOn: 'desc' },
          take: 20,
        });
      } catch (_) {}
    }

    const approvedLeavesCount = leaves.filter((l: any) => {
      const d = new Date(l.fromDate);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth && l.status === 'APPROVED';
    }).reduce((acc: number, l: any) => acc + (l.days || 1), 0);

    const pendingLeavesCount = leaves.filter((l: any) => l.status === 'PENDING').length;

    const monthlySummary = {
      monthName: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      daysPresent,
      totalWorkedHours: totalMonthWorkedHours,
      totalOvertimeHours: totalMonthOvertimeHours,
      shiftHours,
      approvedLeaves: approvedLeavesCount,
      pendingLeaves: pendingLeavesCount,
    };

    return apiResponse({
      records: formatted,
      present: formatted, // For compatibility with StaffAttendancePanel
      monthlySummary,
      shiftHours,
      leaves,
      staffMember: staffMember ? {
        id: staffMember.id,
        name: staffMember.name,
        designation: staffMember.designation || 'Housekeeping Staff',
        shiftHours: staffMember.shiftHours || 8.0,
      } : null,
    }, 'Attendance records fetched');
  } catch (error) {
    return apiError(error);
  }
}

