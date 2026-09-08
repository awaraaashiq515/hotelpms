import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

const secretKey = process.env.JWT_SECRET || 'super-secret-default-key-change-it-in-prod';
const key = new TextEncoder().encode(secretKey);

async function verifyRoomPortalToken(request: NextRequest) {
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
    if ((payload as any).type !== 'ROOM_PORTAL') return null;
    const session = await prisma.roomPortalSession.findFirst({ where: { token, isActive: true } });
    if (!session) return null;
    return payload as any;
  } catch {
    return null;
  }
}

// POST: Submit guest feedback
export async function POST(request: NextRequest) {
  try {
    const payload = await verifyRoomPortalToken(request);
    if (!payload) {
      return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    }

    const { guestId, reservationId, propertyId, roomId } = payload;
    const body = await request.json();
    const { cleanliness, food, service, overall, comments } = body;

    // Validate ratings (1-5)
    if (overall < 1 || overall > 5) {
      return NextResponse.json({ success: false, message: 'Please provide a valid rating (1-5).' }, { status: 400 });
    }

    // Update reservation feedback fields
    await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        feedbackCleanliness: cleanliness || null,
        feedbackFood: food || null,
        feedbackService: service || null,
        checkoutFeedback: comments || null,
      },
    });

    // Audit log
    await prisma.roomPortalActivityLog.create({
      data: {
        propertyId,
        roomId,
        guestId,
        reservationId,
        action: 'FEEDBACK',
        details: JSON.stringify({ cleanliness, food, service, overall, comments }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Thank you for your feedback! We appreciate your time.',
    });
  } catch (error: any) {
    console.error('[Room Portal Feedback Error]:', error);
    return NextResponse.json({ success: false, message: 'Failed to submit feedback.' }, { status: 500 });
  }
}
