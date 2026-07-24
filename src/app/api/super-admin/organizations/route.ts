import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'SUPER_ADMIN') {
      return apiError(new Error('Unauthorized'), 401);
    }

    const organizations = await prisma.organization.findMany({
      include: {
        _count: { select: { properties: true } },
        properties: { select: { id: true, type: true } },
        package: {
          include: {
            features: true
          }
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return apiResponse(organizations, 'Organizations fetched successfully');
  } catch (error) {
    return apiError(error);
  }
}
