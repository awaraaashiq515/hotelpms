import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const moduleName = searchParams.get('module');

    const logs = await prisma.auditLog.findMany({
      where: {
        propertyId: session.propertyId!,
        ...(moduleName ? { moduleName } : {})
      },
      include: {
        user: { select: { fullName: true, email: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    return apiResponse(logs);
  } catch (error) {
    return apiError(error);
  }
}
