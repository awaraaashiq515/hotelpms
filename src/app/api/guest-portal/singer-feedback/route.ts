import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

const secretKey = process.env.JWT_SECRET || 'super-secret-default-key-change-it-in-prod';
const key = new TextEncoder().encode(secretKey);

export async function POST(request: NextRequest) {
  try {
    const { performanceId, rating, comment, guestName } = await request.json();

    if (!performanceId || !rating) {
      return NextResponse.json({ success: false, message: 'Performance ID and Rating are required.' }, { status: 400 });
    }

    const ratingVal = parseInt(rating);
    if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
      return NextResponse.json({ success: false, message: 'Rating must be an integer between 1 and 5.' }, { status: 400 });
    }

    const performance = await prisma.performance.findUnique({
      where: { id: performanceId }
    });

    if (!performance) {
      return NextResponse.json({ success: false, message: 'Performance session not found.' }, { status: 404 });
    }

    let finalGuestName = guestName || 'Anonymous Guest';

    const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
        if (payload && payload.type === 'GUEST_PORTAL' && payload.guestId) {
          const guest = await prisma.guest.findUnique({
            where: { id: payload.guestId as string }
          });
          if (guest) {
            finalGuestName = `${guest.firstName} ${guest.lastName || ''}`.trim();
          }
        }
      } catch (jwtErr) {
        // Fallback to custom guestName
      }
    }

    const feedback = await prisma.singerFeedback.create({
      data: {
        performanceId,
        rating: ratingVal,
        comment: comment || null,
        guestName: finalGuestName
      }
    });

    // Re-calculate singer's average rating
    const allPerformances = await prisma.performance.findMany({
      where: { singerId: performance.singerId },
      include: { feedback: true }
    });

    const allFeedbacks = allPerformances.flatMap((p: any) => p.feedback);
    const avgRating = allFeedbacks.length > 0
      ? allFeedbacks.reduce((acc: number, curr: any) => acc + curr.rating, 0) / allFeedbacks.length
      : 5.0;

    await prisma.singer.update({
      where: { id: performance.singerId },
      data: { rating: avgRating }
    });

    return NextResponse.json({ success: true, message: 'Thank you for your feedback!', data: feedback });
  } catch (error: any) {
    console.error('[Guest Singer Feedback POST Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
