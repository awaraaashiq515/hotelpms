import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SignJWT } from 'jose';

const secretKey = process.env.JWT_SECRET || 'super-secret-default-key-change-it-in-prod';
const key = new TextEncoder().encode(secretKey);

// In-memory rate limiting (relaxed for local development & tablets)
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  // Allow unlimited attempts in development or localhost
  if (
    process.env.NODE_ENV !== 'production' ||
    ip === 'unknown' ||
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip.includes('localhost')
  ) {
    return true;
  }
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record || now > record.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + 5 * 60 * 1000 });
    return true;
  }
  if (record.count >= 30) return false;
  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    // Rate limit check
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { success: false, message: 'Too many login attempts. Please wait 15 minutes and try again.' },
        { status: 429 }
      );
    }

    const { roomNumber, mobile, propertyCode, propertyId } = await request.json();

    if (!roomNumber || !mobile) {
      return NextResponse.json(
        { success: false, message: 'Room number and mobile number are required.' },
        { status: 400 }
      );
    }

    const trimmedRoom = String(roomNumber).trim();
    const cleanMobile = String(mobile).replace(/\D/g, '').slice(-10);

    if (cleanMobile.length < 10) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid 10-digit mobile number.' },
        { status: 400 }
      );
    }

    // Resolve target propertyId if specified
    let targetPropertyId: string | undefined = propertyId;
    if (!targetPropertyId && propertyCode) {
      const codeStr = String(propertyCode).trim();
      const prop = await prisma.property.findFirst({
        where: {
          OR: [
            { code: codeStr },
            { code: codeStr.toUpperCase() },
            { code: codeStr.toLowerCase() },
            { id: codeStr },
          ],
        },
        select: { id: true },
      });
      if (prop) targetPropertyId = prop.id;
    }

    // Find all rooms matching this roomNumber (filtered by property if specified)
    const matchingRooms = await prisma.room.findMany({
      where: {
        roomNumber: trimmedRoom,
        ...(targetPropertyId ? { propertyId: targetPropertyId } : {}),
      },
      select: { id: true, propertyId: true, roomNumber: true, floor: true },
    });

    if (matchingRooms.length === 0) {
      await prisma.roomPortalActivityLog.create({
        data: {
          propertyId: 'unknown',
          action: 'LOGIN_FAILED',
          details: JSON.stringify({ reason: 'room_not_found', roomNumber: trimmedRoom }),
          ipAddress: ip,
        },
      });
      return NextResponse.json(
        { success: false, message: `Room ${trimmedRoom} not found. Please check the room number.` },
        { status: 404 }
      );
    }

    const roomIds = matchingRooms.map((r) => r.id);

    // Find active check-in or confirmed reservation for any matching room
    const candidateReservations = await prisma.reservation.findMany({
      where: {
        status: { in: ['CHECKED_IN', 'CONFIRMED'] },
        ...(targetPropertyId ? { propertyId: targetPropertyId } : {}),
        OR: [
          { rooms: { some: { roomId: { in: roomIds } } } },
          { assignedRoomId: { in: roomIds } },
          { checkIns: { some: { roomId: { in: roomIds }, status: 'ACTIVE' } } },
        ],
      },
      include: {
        guest: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            mobile: true,
            email: true,
            avatarUrl: true,
          },
        },
        property: {
          select: {
            id: true,
            name: true,
            brandName: true,
            logoUrl: true,
            phone: true,
          },
        },
        rooms: {
          include: {
            room: { select: { id: true, roomNumber: true, floor: true, propertyId: true } },
          },
        },
        checkIns: {
          include: {
            room: { select: { id: true, roomNumber: true, floor: true, propertyId: true } },
          },
        },
      },
    });

    // Match guest by 10-digit mobile number
    const reservation = candidateReservations.find((r) => {
      const guestMobile = (r.guest?.mobile || '').replace(/\D/g, '').slice(-10);
      return guestMobile === cleanMobile;
    });

    if (!reservation) {
      await prisma.roomPortalActivityLog.create({
        data: {
          propertyId: matchingRooms[0]?.propertyId || 'unknown',
          action: 'LOGIN_FAILED',
          details: JSON.stringify({ reason: 'no_active_checkin_or_mobile_mismatch', roomNumber: trimmedRoom }),
          ipAddress: ip,
        },
      });
      return NextResponse.json(
        {
          success: false,
          message: `No active check-in found for Room ${trimmedRoom} with the provided mobile number.`,
        },
        { status: 401 }
      );
    }

    // Resolve the exact room associated with this reservation
    type RoomInfo = {
      id: string;
      roomNumber: string;
      floor?: string | null;
      propertyId: string;
    };

    let resolvedRoom: RoomInfo | null =
      reservation.rooms?.find((rr) => rr.room?.roomNumber === trimmedRoom)?.room || null;

    if (!resolvedRoom) {
      resolvedRoom =
        reservation.checkIns?.find((ci) => ci.room?.roomNumber === trimmedRoom)?.room || null;
    }
    if (!resolvedRoom && reservation.assignedRoomId) {
      const assigned = await prisma.room.findUnique({
        where: { id: reservation.assignedRoomId },
        select: { id: true, roomNumber: true, floor: true, propertyId: true },
      });
      if (assigned) resolvedRoom = assigned;
    }
    if (!resolvedRoom) {
      resolvedRoom =
        matchingRooms.find((mr) => mr.propertyId === reservation.propertyId) || matchingRooms[0];
    }

    if (!resolvedRoom) {
      return NextResponse.json(
        { success: false, message: `Room ${trimmedRoom} details could not be resolved.` },
        { status: 500 }
      );
    }

    const room: RoomInfo = resolvedRoom;
    const guest = reservation.guest;

    // Expire old sessions for this room
    await prisma.roomPortalSession.updateMany({
      where: { roomId: room.id, isActive: true },
      data: { isActive: false, logoutAt: new Date() },
    });

    // Issue JWT token (8h)
    const token = await new SignJWT({
      type: 'ROOM_PORTAL',
      guestId: guest.id,
      roomId: room.id,
      roomNumber: room.roomNumber,
      reservationId: reservation.id,
      propertyId: room.propertyId,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('8h')
      .sign(key);

    // Create session record
    await prisma.roomPortalSession.create({
      data: {
        propertyId: room.propertyId,
        roomId: room.id,
        guestId: guest.id,
        reservationId: reservation.id,
        token,
        isActive: true,
      },
    });

    // Audit log
    await prisma.roomPortalActivityLog.create({
      data: {
        propertyId: room.propertyId,
        roomId: room.id,
        guestId: guest.id,
        reservationId: reservation.id,
        action: 'LOGIN',
        details: JSON.stringify({ roomNumber: trimmedRoom }),
        ipAddress: ip,
      },
    });

    const response = NextResponse.json({
      success: true,
      token,
      guest: {
        id: guest.id,
        firstName: guest.firstName,
        lastName: guest.lastName,
        mobile: guest.mobile,
        email: guest.email,
        avatarUrl: guest.avatarUrl,
      },
      room: {
        id: room.id,
        roomNumber: room.roomNumber,
        floor: room.floor,
      },
      property: reservation.property,
      reservationId: reservation.id,
    });

    response.cookies.set('room_portal_session', token, {
      httpOnly: true,
      maxAge: 60 * 60 * 8,
      path: '/',
      sameSite: 'lax',
    });

    return response;
  } catch (error: any) {
    console.error('[Room Portal Login Error]:', error);
    return NextResponse.json(
      { success: false, message: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}
