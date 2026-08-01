import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

const secretKey = process.env.JWT_SECRET || 'super-secret-default-key-change-it-in-prod';
const key = new TextEncoder().encode(secretKey);

async function getSingerFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
    if (payload && payload.type === 'SINGER_PORTAL' && payload.singerId) {
      return await prisma.singer.findUnique({
        where: { id: payload.singerId as string }
      });
    }
  } catch (err) {
    return null;
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const singer = await getSingerFromRequest(request);
    if (!singer) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();

    // Get current live/active performance
    const activePerformance = await prisma.performance.findFirst({
      where: {
        singerId: singer.id,
        status: 'LIVE'
      },
      include: {
        property: {
          select: { name: true }
        }
      }
    });

    // Get all performances
    const performances = await prisma.performance.findMany({
      where: { singerId: singer.id },
      orderBy: { date: 'desc' },
      include: {
        feedback: true,
        property: { select: { name: true } }
      }
    });

    // Calculate ratings stats directly from DB
    const totalReviews = await prisma.singerFeedback.count({
      where: {
        performance: {
          singerId: singer.id
        }
      }
    });
    const avgRating = singer.rating;
    const feedbackList = performances
      .flatMap((p: any) => p.feedback)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      success: true,
      data: {
        singer: {
          id: singer.id,
          name: singer.name,
          email: singer.email,
          genre: singer.genre,
          bio: singer.bio,
          photoUrl: singer.photoUrl,
          coverPhotoUrl: singer.coverPhotoUrl,
          rating: avgRating,
          totalReviews
        },
        activePerformance,
        performances: performances.slice(0, 10), // Send last 10 performances
        feedbacks: feedbackList.slice(0, 15) // Send last 15 feedbacks
      }
    });
  } catch (error: any) {
    console.error('[Singer Dashboard GET Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}

// POST: Toggle active performance session status (start live/end live)
export async function POST(request: NextRequest) {
  try {
    const singer = await getSingerFromRequest(request);
    if (!singer) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { performanceId, action } = await request.json(); // action: "START" | "END"

    if (!performanceId || !action) {
      return NextResponse.json({ success: false, message: 'Performance ID and action are required.' }, { status: 400 });
    }

    const performance = await prisma.performance.findFirst({
      where: { id: performanceId, singerId: singer.id }
    });

    if (!performance) {
      return NextResponse.json({ success: false, message: 'Performance slot not found.' }, { status: 404 });
    }

    let nextStatus = 'SCHEDULED';
    if (action === 'START') {
      nextStatus = 'LIVE';
      // Terminate any other live performance for this singer first
      await prisma.performance.updateMany({
        where: { singerId: singer.id, status: 'LIVE' },
        data: { status: 'COMPLETED' }
      });
    } else if (action === 'END') {
      nextStatus = 'COMPLETED';
    }

    const updated = await prisma.performance.update({
      where: { id: performanceId },
      data: { status: nextStatus }
    });

    return NextResponse.json({ success: true, message: `Session status updated to ${nextStatus}`, data: updated });
  } catch (error: any) {
    console.error('[Singer Dashboard POST Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
