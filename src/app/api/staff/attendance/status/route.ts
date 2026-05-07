import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, apiResponse } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) return apiError(new Error('User ID is required'), 400);

    const active = await prisma.attendance.findFirst({
      where: {
        userId,
        clockOut: null
      },
      orderBy: { clockIn: 'desc' }
    });

    return apiResponse(active);
  } catch (error) {
    return apiError(error);
  }
}
