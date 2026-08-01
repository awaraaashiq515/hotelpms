import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const whereCondition: any = {
      status: { in: ['LIVE', 'SCHEDULED'] },
      date: { gte: todayStart }
    };

    if (propertyId) {
      whereCondition.propertyId = propertyId;
    }

    const performances = await prisma.performance.findMany({
      where: whereCondition,
      include: {
        singer: {
          include: {
            videos: {
              orderBy: { createdAt: 'desc' },
              take: 5
            },
            posts: {
              orderBy: { createdAt: 'desc' },
              take: 5
            }
          }
        },
        property: {
          select: {
            id: true,
            name: true,
            city: true
          }
        }
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' }
      ]
    });

    return NextResponse.json({ success: true, data: performances });
  } catch (error: any) {
    console.error('[Guest Performances API GET Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
