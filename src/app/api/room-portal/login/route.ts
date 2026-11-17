import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SignJWT } from 'jose';

const secretKey = process.env.JWT_SECRET || 'super-secret-default-key-change-it-in-prod';
const key = new TextEncoder().encode(secretKey);

// In-memory rate limiting (relaxed for local development & tablets)
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
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
  if (record.count >= 60) return false;
  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { success: false, message: 'Too many login attempts. Please wait a moment and try again.' },
        { status: 429 }
      );
    }

    const { roomNumber, mobile, vipCode, propertyCode, propertyId } = await request.json();

    if (!roomNumber) {
      return NextResponse.json(
        { success: false, message: 'Room number is required.' },
        { status: 400 }
      );
    }

    const trimmedRoom = String(roomNumber).trim();
    const rawAuth = String(vipCode || mobile || '').trim();
    const cleanDigits = rawAuth.replace(/\D/g, '');
    const cleanMobile = cleanDigits.slice(-10);

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

    // Find all rooms matching this roomNumber
    let matchingRooms = await prisma.room.findMany({
      where: {
        roomNumber: trimmedRoom,
        ...(targetPropertyId ? { propertyId: targetPropertyId } : {}),
      },
      select: { id: true, propertyId: true, roomNumber: true, floor: true },
    });

    // If no room matched with targetPropertyId, fallback across all properties
    if (matchingRooms.length === 0) {
      const anyMatchingRooms = await prisma.room.findMany({
        where: { roomNumber: trimmedRoom },
        select: { id: true, propertyId: true, roomNumber: true, floor: true },
      });
      if (anyMatchingRooms.length > 0) {
        matchingRooms = anyMatchingRooms;
        targetPropertyId = undefined;
      }
    }

    // If room is still not in DB, create or resolve it so guest is never blocked
    if (matchingRooms.length === 0) {
      const anyRoomType = await prisma.roomType.findFirst({
        select: { id: true, propertyId: true },
      });
      const propIdToUse = targetPropertyId || anyRoomType?.propertyId;

      if (propIdToUse && anyRoomType) {
        const newRoom = await prisma.room.create({
          data: {
            propertyId: propIdToUse,
            roomTypeId: anyRoomType.id,
            roomNumber: trimmedRoom,
            status: 'OCCUPIED',
            housekeepingStatus: 'CLEAN',
          },
          select: { id: true, propertyId: true, roomNumber: true, floor: true },
        });
        matchingRooms = [newRoom];
      }
    }

    if (matchingRooms.length === 0) {
      return NextResponse.json(
        { success: false, message: `Room ${trimmedRoom} not found. Please enter a valid room number.` },
        { status: 404 }
      );
    }

    const roomIds = matchingRooms.map((r) => r.id);

    // Find active check-in or confirmed reservation for this room
    let candidateReservations = await prisma.reservation.findMany({
      where: {
        status: { in: ['CHECKED_IN', 'CONFIRMED'] },
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
      orderBy: { updatedAt: 'desc' },
    });

    // If mobile was explicitly provided, match reservation by mobile if possible
    let reservation: any = null;
    if (cleanMobile.length >= 10 && candidateReservations.length > 0) {
      reservation = candidateReservations.find((r: any) => {
        const gm = (r.guest?.mobile || '').replace(/\D/g, '').slice(-10);
        return gm === cleanMobile;
      });
    }

    // Default to the active reservation for this room
    if (!reservation && candidateReservations.length > 0) {
      reservation = candidateReservations[0];
    }

    // Resolve room details
    const targetRoom = matchingRooms[0];
    let resolvedProperty = targetRoom.propertyId
      ? await prisma.property.findUnique({
          where: { id: targetRoom.propertyId },
          select: { id: true, name: true, brandName: true, logoUrl: true, phone: true },
        })
      : null;

    let guest: any = null;
    let reservationId: string = '';
    let isOwnerGuest = false;

    if (reservation) {
      guest = reservation.guest;
      reservationId = reservation.id;
      isOwnerGuest = Boolean(reservation.isOwnerGuest);
      if (reservation.property) {
        resolvedProperty = reservation.property;
      }
    } else {
      // Direct Room-Only Access: resolve existing or create a walk-in reservation
      let existingRes: any = await prisma.reservation.findFirst({
        where: {
          OR: [
            { rooms: { some: { roomId: targetRoom.id } } },
            { assignedRoomId: targetRoom.id },
          ],
        },
        include: { guest: true },
        orderBy: { updatedAt: 'desc' },
      });

      if (!existingRes) {
        const prop = await prisma.property.findUnique({
          where: { id: targetRoom.propertyId },
          select: { id: true, organizationId: true },
        });
        const orgId = prop?.organizationId || 'default-org';
        let placeholderGuest = await prisma.guest.findFirst({
          where: { lastName: `Room ${trimmedRoom}` },
        });

        if (!placeholderGuest) {
          placeholderGuest = await prisma.guest.create({
            data: {
              organizationId: orgId,
              firstName: 'Guest',
              lastName: `Room ${trimmedRoom}`,
              mobile: cleanMobile || '0000000000',
            },
          });
        }

        const roomTypeId = (targetRoom as any).roomTypeId || (await prisma.roomType.findFirst({ where: { propertyId: targetRoom.propertyId } }))?.id || '';

        existingRes = await prisma.reservation.create({
          data: {
            propertyId: targetRoom.propertyId,
            guestId: placeholderGuest.id,
            bookingNo: `ROOM-${trimmedRoom}-${Date.now().toString().slice(-4)}`,
            arrivalDate: new Date(),
            departureDate: new Date(Date.now() + 86400000 * 2),
            adults: 1,
            children: 0,
            roomTypeId,
            assignedRoomId: targetRoom.id,
            status: 'CHECKED_IN',
            totalAmount: 0,
            advanceAmount: 0,
            dueAmount: 0,
          },
          include: { guest: true },
        });
      }

      guest = existingRes?.guest || {
        id: 'guest-fallback',
        firstName: 'Guest',
        lastName: `Room ${trimmedRoom}`,
        mobile: cleanMobile || '',
      };
      reservationId = existingRes?.id || '';
    }

    // Expire old sessions for this room
    await prisma.roomPortalSession.updateMany({
      where: { roomId: targetRoom.id, isActive: true },
      data: { isActive: false, logoutAt: new Date() },
    });

    // Issue JWT token (8 hours)
    const token = await new SignJWT({
      type: 'ROOM_PORTAL',
      guestId: guest.id,
      roomId: targetRoom.id,
      roomNumber: targetRoom.roomNumber,
      reservationId,
      propertyId: targetRoom.propertyId,
      isOwnerGuest,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('8h')
      .sign(key);

    // Create session record
    await prisma.roomPortalSession.create({
      data: {
        propertyId: targetRoom.propertyId,
        roomId: targetRoom.id,
        guestId: guest.id,
        reservationId,
        token,
        isActive: true,
      },
    });

    // Audit log
    await prisma.roomPortalActivityLog.create({
      data: {
        propertyId: targetRoom.propertyId,
        roomId: targetRoom.id,
        guestId: guest.id,
        reservationId,
        action: 'LOGIN',
        details: JSON.stringify({ roomNumber: trimmedRoom, directOpen: true }),
        ipAddress: ip,
      },
    });

    const response = NextResponse.json({
      success: true,
      token,
      guest: {
        id: guest.id,
        firstName: guest.firstName || 'Guest',
        lastName: guest.lastName || `Room ${trimmedRoom}`,
        mobile: guest.mobile || '',
        email: guest.email || '',
        avatarUrl: guest.avatarUrl || null,
      },
      room: {
        id: targetRoom.id,
        roomNumber: targetRoom.roomNumber,
        floor: targetRoom.floor,
      },
      property: resolvedProperty,
      reservationId,
      isOwnerGuest,
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
      { success: false, message: 'Failed to access room portal. Please try again.' },
      { status: 500 }
    );
  }
}
