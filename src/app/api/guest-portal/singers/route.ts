import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const singers = await prisma.singer.findMany({
      where: { isActive: true },
      include: {
        videos: {
          orderBy: { createdAt: 'desc' }
        },
        posts: {
          orderBy: { createdAt: 'desc' }
        },
        performances: {
          select: {
            id: true,
            venueName: true,
            date: true,
            status: true
          }
        }
      },
      orderBy: { rating: 'desc' } // Rank by best singer ("kaun sabse acha hai")
    });

    return NextResponse.json({ success: true, data: singers });
  } catch (error: any) {
    console.error('[Guest Singers Directory GET Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
