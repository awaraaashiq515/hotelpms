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

// POST: Logout from room portal
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (token) {
      await prisma.roomPortalSession.updateMany({
        where: { token, isActive: true },
        data: { isActive: false, logoutAt: new Date() },
      });

      // Try to get payload for audit log
      try {
        const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
        const p = payload as any;
        await prisma.roomPortalActivityLog.create({
          data: {
            propertyId: p.propertyId || 'unknown',
            roomId: p.roomId,
            guestId: p.guestId,
            reservationId: p.reservationId,
            action: 'LOGOUT',
          },
        });
      } catch {
        // Ignore if token already expired
      }
    }

    const response = NextResponse.json({ success: true, message: 'Logged out successfully.' });
    response.cookies.delete('room_portal_session');
    return response;
  } catch (error: any) {
    console.error('[Room Portal Logout Error]:', error);
    return NextResponse.json({ success: false, message: 'Logout failed.' }, { status: 500 });
  }
}
