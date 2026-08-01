import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');

    if (!propertyId) {
      return NextResponse.json({ success: false, message: 'Property ID is required.' }, { status: 400 });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Look for a live session first
    let performance = await prisma.performance.findFirst({
      where: {
        propertyId,
        status: 'LIVE'
      },
      include: {
        singer: {
          select: {
            id: true,
            name: true,
            genre: true,
            bio: true,
            photoUrl: true,
            rating: true
          }
        }
      }
    });

    // If no live, look for any scheduled performance for today
    if (!performance) {
      performance = await prisma.performance.findFirst({
        where: {
          propertyId,
          status: 'SCHEDULED',
          date: {
            gte: todayStart,
            lte: todayEnd
          }
        },
        include: {
          singer: {
            select: {
              id: true,
              name: true,
              genre: true,
              bio: true,
              photoUrl: true,
              rating: true
            }
          }
        },
        orderBy: { startTime: 'asc' }
      });
    }

    return NextResponse.json({ success: true, data: performance });
  } catch (error: any) {
    console.error('[Guest Live Singer GET Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
