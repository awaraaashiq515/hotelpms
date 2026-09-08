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

// POST: Submit checkout request
export async function POST(request: NextRequest) {
  try {
    const payload = await verifyRoomPortalToken(request);
    if (!payload) {
      return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    }

    const { guestId, reservationId, propertyId, roomId } = payload;
    const body = await request.json();
    const { expectedTime, instructions } = body;

    // Mark checkout as requested
    await prisma.reservation.update({
      where: { id: reservationId },
      data: { checkoutRequested: true },
    });

    // Audit log
    await prisma.roomPortalActivityLog.create({
      data: {
        propertyId,
        roomId,
        guestId,
        reservationId,
        action: 'CHECKOUT_REQUEST',
        details: JSON.stringify({ expectedTime, instructions }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Checkout request submitted. Our team will contact you shortly to assist with the process.',
    });
  } catch (error: any) {
    console.error('[Room Portal Checkout Error]:', error);
    return NextResponse.json({ success: false, message: 'Failed to submit checkout request.' }, { status: 500 });
  }
}
