import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Singer ka full public profile — hotel side ke liye
// No strict session check - hotel layout already protects the route
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ singerId: string }> }
) {
  try {
    const { singerId } = await params;

    const singer = await prisma.singer.findUnique({
      where: { id: singerId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        bio: true,
        genre: true,
        photoUrl: true,
        coverPhotoUrl: true,
        rating: true,
        isActive: true,
        createdAt: true,
        videos: {
          select: { id: true, title: true, videoUrl: true, description: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 12,
        },
        posts: {
          select: {
            id: true,
            title: true,
            content: true,
            imageUrl: true,
            tags: true,
            createdAt: true,
            likes: { select: { id: true } },
            comments: {
              select: { id: true, authorName: true, content: true, createdAt: true },
              orderBy: { createdAt: 'desc' },
              take: 5,
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        performances: {
          select: {
            id: true,
            venueName: true,
            date: true,
            startTime: true,
            endTime: true,
            status: true,
            property: { select: { name: true, city: true } },
          },
          orderBy: { date: 'desc' },
          take: 20,
        },
        bookingRequests: {
          where: { status: 'ACCEPTED' },
          select: {
            id: true,
            venueName: true,
            date: true,
            status: true,
            proposedFee: true,
            property: { select: { name: true } },
          },
          orderBy: { date: 'desc' },
          take: 10,
        },
      },
    });

    if (!singer) {
      return NextResponse.json({ success: false, message: 'Singer not found' }, { status: 404 });
    }

    // Fetch feedbacks via performances (SingerFeedback is linked to Performance, not Singer)
    const performanceIds = singer.performances.map(p => p.id);
    const allFeedbacks = performanceIds.length > 0
      ? await prisma.singerFeedback.findMany({
          where: { performanceId: { in: performanceIds } },
          select: { id: true, rating: true, comment: true, guestName: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 30,
        })
      : [];

    const totalReviews = allFeedbacks.length;
    const avgRating =
      totalReviews > 0
        ? allFeedbacks.reduce((s, f) => s + f.rating, 0) / totalReviews
        : singer.rating;
    const completedShows = singer.performances.filter(p => p.status === 'COMPLETED').length;

    return NextResponse.json({
      success: true,
      data: {
        ...singer,
        performances: singer.performances.slice(0, 10),
        feedbacks: allFeedbacks,
        avgRating: parseFloat(avgRating.toFixed(1)),
        totalReviews,
        completedShows,
      },
    });
  } catch (error: any) {
    console.error('[Hotel Singer Profile GET Error]:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server error' },
      { status: 500 }
    );
  }
}
