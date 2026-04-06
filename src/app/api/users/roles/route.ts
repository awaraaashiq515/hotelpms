import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const roles = await prisma.role.findMany({
      orderBy: { name: 'asc' },
    });

    return apiResponse(roles);
  } catch (error) {
    return apiError(error);
  }
}
