import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';
import { getSession } from '@/lib/session';

const secretKey = process.env.JWT_SECRET || 'super-secret-default-key-change-it-in-prod';
const key = new TextEncoder().encode(secretKey);

// POST: Admin remote lock/unlock device
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    }

    const body = await request.json();
    const { tabletId, roomId, lock } = body;

    if ((!tabletId && !roomId) || typeof lock !== 'boolean') {
      return NextResponse.json({ success: false, message: 'tabletId or roomId, and lock (boolean) are required.' }, { status: 400 });
    }

    if (tabletId) {
      await prisma.tablet.update({
        where: { id: tabletId },
        data: { kioskLocked: lock },
      });
    } else if (roomId) {
      await prisma.tablet.updateMany({
        where: { roomId, mode: 'ROOM' },
        data: { kioskLocked: lock },
      });
    }

    return NextResponse.json({
      success: true,
      message: lock ? 'Tablet display locked successfully.' : 'Tablet display unlocked successfully.',
      data: { tabletId, roomId, kioskLocked: lock },
    });
  } catch (error: any) {
    console.error('[Room Portal Admin Lock Error]:', error);
    return NextResponse.json({ success: false, message: 'Failed to update device lock.' }, { status: 500 });
  }
}

// GET: Get all room portal sessions + tablets for admin
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId') || session.propertyId;

    if (!propertyId) {
      return NextResponse.json({ success: false, message: 'Property ID required.' }, { status: 400 });
    }

    // 1. Fetch all hotel rooms
    const rooms = await prisma.room.findMany({
      where: { propertyId },
      orderBy: { roomNumber: 'asc' },
    });

    // 2. Ensure each room has a Tablet record for Room Portal
    for (const r of rooms) {
      const exists = await prisma.tablet.findFirst({
        where: { propertyId, roomId: r.id, mode: 'ROOM' },
      });
      if (!exists) {
        await prisma.tablet.create({
          data: {
            name: `Room ${r.roomNumber} Tablet`,
            mode: 'ROOM',
            propertyId,
            roomId: r.id,
            kioskLocked: false,
          },
        });
      }
    }

    // 3. Fetch tablets, active sessions, logs
    const [tablets, activeSessions, recentLogs] = await Promise.all([
      prisma.tablet.findMany({
        where: { propertyId, mode: 'ROOM' },
        orderBy: { name: 'asc' },
      }),
      prisma.roomPortalSession.findMany({
        where: { propertyId, isActive: true },
        orderBy: { loginAt: 'desc' },
        take: 50,
      }),
      prisma.roomPortalActivityLog.findMany({
        where: { propertyId },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    ]);

    // 4. Fetch guest details for active sessions
    const guestIds = activeSessions.map((s) => s.guestId).filter(Boolean);
    const guests = await prisma.guest.findMany({
      where: { id: { in: guestIds } },
      select: { id: true, firstName: true, lastName: true, mobile: true },
    });

    const guestMap = new Map(guests.map((g) => [g.id, g]));
    const roomMap = new Map(rooms.map((r) => [r.id, r]));
    const sessionByRoom = new Map(activeSessions.map((s) => [s.roomId, s]));

    // 5. Enrich tablets
    const enrichedTablets = tablets.map((t) => {
      const room = t.roomId ? roomMap.get(t.roomId) : null;
      const s = t.roomId ? sessionByRoom.get(t.roomId) : null;
      const guest = s ? guestMap.get(s.guestId) : null;
      return {
        ...t,
        roomNumber: room?.roomNumber || t.name.replace(' Tablet', '').replace('Room ', ''),
        roomStatus: room?.status || 'AVAILABLE',
        floor: room?.floor || null,
        isSessionActive: !!s,
        guestName: guest ? `${guest.firstName} ${guest.lastName || ''}`.trim() : null,
        guestMobile: guest?.mobile || null,
        loginAt: s?.loginAt || null,
        lastActivity: s?.lastActivity || null,
      };
    });

    // 6. Enrich sessions
    const enrichedSessions = activeSessions.map((s) => {
      const room = roomMap.get(s.roomId);
      const guest = guestMap.get(s.guestId);
      return {
        ...s,
        roomNumber: room?.roomNumber || 'Unknown',
        guestName: guest ? `${guest.firstName} ${guest.lastName || ''}`.trim() : 'Guest',
        guestMobile: guest?.mobile || '',
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        tablets: enrichedTablets,
        activeSessions: enrichedSessions,
        recentLogs,
      },
    });
  } catch (error: any) {
    console.error('[Room Portal Admin GET Error]:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch admin data.' }, { status: 500 });
  }
}
