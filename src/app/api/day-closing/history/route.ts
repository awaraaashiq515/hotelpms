import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const closings = await prisma.dayClosing.findMany({
      where: { propertyId: session.propertyId! },
      include: { shift: { select: { shiftNo: true, cashierName: true, openedAt: true, closedAt: true } } },
      orderBy: { closingDate: 'desc' },
      take: 30,
    });

    return apiResponse(closings);
  } catch (error) {
    return apiError(error);
  }
}
