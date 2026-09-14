import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { apiError, apiResponse, getMultiTenantWhere } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

const createSchema = z.object({
  staffId:   z.string().min(1),
  leaveType: z.enum(['CASUAL', 'SICK', 'EARNED', 'EMERGENCY']),
  fromDate:  z.string(),
  toDate:    z.string(),
  days:      z.number().int().min(1),
  reason:    z.string().optional(),
});

// GET — fetch all leave requests for the property
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.organizationId) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const propertyIdParam = searchParams.get('propertyId');

    const where = getMultiTenantWhere(session, propertyIdParam);

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
    const session = await getSession();
    if (!session?.organizationId) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const data = createSchema.parse(body);

    const propertyId = body.propertyId || session.propertyId;
    if (!propertyId) return apiError(new Error('Property ID required'), 400);

    const leave = await (prisma as any).leaveRequest.create({
      data: {
        propertyId,
        staffId:   data.staffId,
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

    return apiResponse(leave, 'Leave request created', 201);
  } catch (err) {
    return apiError(err);
  }
}
