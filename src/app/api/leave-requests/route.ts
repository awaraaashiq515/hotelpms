import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { apiError, apiResponse, getMultiTenantWhere } from '@/lib/api-utils';
import { getSession } from '@/lib/session';
import { getWTUserFromRequest } from '@/lib/walkie-talkie-auth';

const createSchema = z.object({
  staffId:   z.string().optional(),
  leaveType: z.enum(['CASUAL', 'SICK', 'EARNED', 'EMERGENCY']),
  fromDate:  z.string(),
  toDate:    z.string(),
  days:      z.number().int().min(1),
  reason:    z.string().optional(),
  propertyId: z.string().optional(),
});

// GET — fetch leave requests
export async function GET(request: NextRequest) {
  try {
    let session = await getSession();
    let staffUser: any = null;
    if (!session) {
      staffUser = await getWTUserFromRequest(request as any);
    }

    if (!session && !staffUser) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const propertyIdParam = searchParams.get('propertyId');
    const statusParam = searchParams.get('status');

    let where: any = {};
    if (session?.organizationId) {
      where = getMultiTenantWhere(session, propertyIdParam);
    } else if (staffUser) {
      // Find staff member linked to this WT user
      const staffMember = await prisma.staffMember.findFirst({
        where: { OR: [{ userId: staffUser.id }, { id: staffUser.id }] },
      });
      if (staffMember) {
        where.staffId = staffMember.id;
      } else {
        where.propertyId = staffUser.propertyId;
      }
    }

    if (statusParam) {
      where.status = statusParam;
    }

    const leaves = await (prisma as any).leaveRequest.findMany({
      where,
      orderBy: { appliedOn: 'desc' },
      include: {
        staff: { select: { id: true, name: true, designation: true } },
      },
    });

    return apiResponse(leaves, 'Leave requests fetched');
  } catch (err) {
    return apiError(err);
  }
}

// POST — create a new leave request
export async function POST(request: NextRequest) {
  try {
    let session = await getSession();
    let staffUser: any = null;
    if (!session) {
      staffUser = await getWTUserFromRequest(request as any);
    }

    if (!session && !staffUser) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const data = createSchema.parse(body);

    let propertyId = body.propertyId || session?.propertyId || staffUser?.propertyId;
    if (!propertyId) return apiError(new Error('Property ID required'), 400);

    let resolvedStaffId = data.staffId;
    if (!resolvedStaffId) {
      const userId = session?.id || staffUser?.id;
      let staffMember = await prisma.staffMember.findFirst({
        where: { OR: [{ userId }, { id: userId }] },
      });

      if (!staffMember && staffUser?.id) {
        // Auto create staffMember record for this user if it doesn't exist
        const existingStaff = await prisma.staffMember.findFirst({
          where: { userId: staffUser.id },
        });
        if (existingStaff) {
          staffMember = existingStaff;
        } else {
          try {
            staffMember = await prisma.staffMember.create({
              data: {
                name: staffUser.fullName || staffUser.email.split('@')[0],
                propertyId,
                userId: staffUser.id,
                designation: staffUser.role?.name || 'Housekeeping',
                shiftHours: 8.0,
                salary: 0,
              },
            });
          } catch (_) {}
        }
      }

      if (!staffMember) {
        return apiError(new Error('Staff member profile not found for this user'), 400);
      }
      resolvedStaffId = staffMember.id;
    }

    const leave = await (prisma as any).leaveRequest.create({
      data: {
        propertyId,
        staffId:   resolvedStaffId,
        leaveType: data.leaveType,
        fromDate:  new Date(data.fromDate),
        toDate:    new Date(data.toDate),
        days:      data.days,
        reason:    data.reason || null,
        status:    'PENDING',
        appliedOn: new Date(),
      },
      include: {
        staff: { select: { id: true, name: true, designation: true } },
      },
    });

    // Automatically notify Hotel Admin & Managers about the leave request
    try {
      const staffName = leave.staff?.name || 'Staff Member';
      const staffRole = leave.staff?.designation || 'Staff';
      await prisma.notification.create({
        data: {
          propertyId,
          title: `Leave Request: ${staffName}`,
          message: `${staffName} (${staffRole}) has applied for ${data.days} day(s) ${data.leaveType.toLowerCase()} leave from ${data.fromDate} to ${data.toDate}.${data.reason ? ` Reason: ${data.reason}` : ''}`,
          type: 'STAFF_LEAVE',
          priority: 'HIGH',
          status: 'UNREAD',
          metadata: JSON.stringify({
            leaveRequestId: leave.id,
            staffId: resolvedStaffId,
            staffName,
            staffRole,
            leaveType: data.leaveType,
            fromDate: data.fromDate,
            toDate: data.toDate,
            days: data.days,
            reason: data.reason || '',
            link: '/hotel/hr',
          }),
        },
      });
    } catch (notifErr) {
      console.error('[Notification] Failed to create leave notification:', notifErr);
    }

    return apiResponse(leave, 'Leave request created', 201);
  } catch (err) {
    return apiError(err);
  }
}

