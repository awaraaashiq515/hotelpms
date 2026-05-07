import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { apiError, apiResponse } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const staff = await prisma.user.findMany({
      where: { 
        propertyId: session.propertyId as string,
        isActive: true
      },
      select: {
        id: true,
        fullName: true,
        role: {
          select: { name: true }
        }
      },
      orderBy: { fullName: 'asc' }
    });

    return apiResponse(staff);
  } catch (error) {
    return apiError(error);
  }
}
