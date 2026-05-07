import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { apiError, apiResponse } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const attendance = await prisma.attendance.findMany({
      where: { 
        propertyId: session.propertyId as string
      },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            role: { select: { name: true } }
          }
        },
        staffMember: {
          select: {
            name: true,
            designation: true
          }
        }
      },
      orderBy: { clockIn: 'desc' },
      take: 200
    });

    // Unify names for the UI
    const processed = attendance.map((record: any) => ({
      ...record,
      employeeName: record.user?.fullName || record.staffMember?.name || 'Unknown',
      employeeRole: record.user?.role?.name || record.staffMember?.designation || 'Staff'
    }));

    return apiResponse(processed);
  } catch (error) {
    return apiError(error);
  }
}
