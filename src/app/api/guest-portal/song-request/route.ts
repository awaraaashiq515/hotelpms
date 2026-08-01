import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

const secretKey = process.env.JWT_SECRET || 'super-secret-default-key-change-it-in-prod';
const key = new TextEncoder().encode(secretKey);

export async function POST(request: NextRequest) {
  try {
    const { performanceId, songTitle, artist, guestName, roomNo } = await request.json();

    if (!performanceId || !songTitle) {
      return NextResponse.json({ success: false, message: 'Performance ID and Song Title are required.' }, { status: 400 });
    }

    // Verify the performance is currently active (LIVE)
    const performance = await prisma.performance.findUnique({
      where: { id: performanceId }
    });

    if (!performance) {
      return NextResponse.json({ success: false, message: 'Performance session not found.' }, { status: 404 });
    }

    if (performance.status !== 'LIVE') {
      return NextResponse.json({ success: false, message: 'This performance session is not currently live.' }, { status: 400 });
    }

    // Try verifying Guest JWT to pre-fill or validate name
    let finalGuestName = guestName || 'Anonymous Guest';
    let finalRoomNo = roomNo || null;

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

    const songRequest = await prisma.songRequest.create({
      data: {
        performanceId,
        songTitle,
        artist: artist || null,
        guestName: finalGuestName,
        roomNo: finalRoomNo,
      }
    });

    return NextResponse.json({ success: true, message: 'Song requested successfully!', data: songRequest });
  } catch (error: any) {
    console.error('[Guest Song Request POST Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
