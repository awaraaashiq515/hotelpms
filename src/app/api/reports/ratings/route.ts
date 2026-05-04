import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const feedbacks = await prisma.tableFeedback.findMany({
      where: {
        propertyId: session.propertyId!,
      },
      include: {
        table: {
          select: { name: true }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return apiResponse(feedbacks);
  } catch (error: any) {
    console.error('Reports Feedback Error:', error);
    return apiError(error, 500);
  }
}
