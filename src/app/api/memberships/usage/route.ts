import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, getMultiTenantWhere } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const propertyIdParam = searchParams.get('propertyId');

    const baseWhere = getMultiTenantWhere(session, propertyIdParam);
    const where: any = {
        membershipCard: {
            membershipPlan: baseWhere.propertyId ? { propertyId: baseWhere.propertyId } : baseWhere.property ? { property: baseWhere.property } : {}
        }
    };

    const usage = await prisma.membershipUsage.findMany({
      where,
      include: {
        membershipCard: {
            include: {
                membershipPlan: { select: { name: true } },
                guest: { select: { firstName: true, lastName: true } }
            }
        }
      },
      orderBy: { usedAt: 'desc' },
      take: 100,
    });

    return apiResponse(usage);
  } catch (error) {
    return apiError(error);
  }
}
