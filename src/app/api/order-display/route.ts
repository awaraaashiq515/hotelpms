import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    // For now, require session. In production, could use a public token or propertyId query param.
    if (!session || !session.propertyId) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const kots = await prisma.kotTicket.findMany({
      where: {
        propertyId: session.propertyId,
        createdAt: { gte: today },
        status: { in: ['NEW', 'PREPARING', 'READY'] }
      },
      include: {
        order: {
          include: {
            guest: true,
            items: {
              include: {
                product: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return apiResponse(kots);
  } catch (error) {
    return apiError(error);
  }
}
