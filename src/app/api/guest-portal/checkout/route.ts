import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

const secretKey = process.env.JWT_SECRET || 'super-secret-default-key-change-it-in-prod';
const key = new TextEncoder().encode(secretKey);

export async function POST(request: NextRequest) {
  try {
    // Verify guest session
    const authHeader = request.headers.get('Authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.substring(7);
    let payload: any;
    try {
      const result = await jwtVerify(token, key, { algorithms: ['HS256'] });
      payload = result.payload;
    } catch {
      return NextResponse.json({ success: false, message: 'Invalid session' }, { status: 401 });
    }

    const body = await request.json();
    const { cleanliness, food, service, comments } = body;

    // Get active reservation
    const guest = await prisma.guest.findUnique({
      where: { id: payload.guestId as string },
      include: {
        reservations: {
          where: { status: { in: ['CONFIRMED', 'CHECKED_IN'] } },
          orderBy: { createdAt: 'desc' },
          take: 1,
        }
      }
    });

    if (!guest || !guest.reservations[0]) {
      return NextResponse.json({ success: false, message: 'No active reservation found to request check-out.' }, { status: 400 });
    }

    const reservation = guest.reservations[0];

    // Update reservation with check-out request and feedback
    await prisma.reservation.update({
      where: { id: reservation.id },
      data: {
        checkoutRequested: true,
        feedbackCleanliness: cleanliness ? Number(cleanliness) : null,
        feedbackFood: food ? Number(food) : null,
        feedbackService: service ? Number(service) : null,
        checkoutFeedback: comments || null,
      }
    });

    // Create staff notification
    const room = await prisma.reservationRoom.findFirst({
      where: { reservationId: reservation.id },
      include: { room: true }
    });
    
    const roomNo = room?.room?.roomNumber ? `Room ${room.room.roomNumber}` : 'assigned room';

    await prisma.notification.create({
      data: {
        propertyId: reservation.propertyId,
        title: '🔑 Express Check-out Request',
        message: `Guest ${guest.firstName}${guest.lastName ? ' ' + guest.lastName : ''} in ${roomNo} has requested express check-out.`,
        type: 'SYSTEM',
        status: 'UNREAD'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Express check-out requested successfully! Front desk has been notified. Thank you for your feedback!'
    });
  } catch (error: any) {
    console.error('[Guest Checkout Request Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to request check-out.' }, { status: 500 });
  }
}
