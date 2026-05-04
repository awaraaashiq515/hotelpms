import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    // Only super admins or owners should see all ratings
    if (!session || session.role !== 'SUPERADMIN') {
      return apiError(new Error('Unauthorized'), 401);
    }

    const feedbacks = await prisma.tableFeedback.findMany({
      include: {
        table: {
          select: { name: true }
        },
        property: {
          select: { name: true, brandName: true }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return apiResponse(feedbacks);
  } catch (error: any) {
    console.error('Admin Reports Feedback Error:', error);
    return apiError(error, 500);
  }
}
