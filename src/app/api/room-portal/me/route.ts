import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

const secretKey = process.env.JWT_SECRET || 'super-secret-default-key-change-it-in-prod';
const key = new TextEncoder().encode(secretKey);

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return NextResponse.json({ success: false, message: 'No token provided.' }, { status: 401 });
    }

    // Verify JWT
    let payload: any;
    try {
      const { payload: p } = await jwtVerify(token, key, { algorithms: ['HS256'] });
      payload = p;
    } catch {
      return NextResponse.json({ success: false, message: 'Invalid or expired session.' }, { status: 401 });
    }

    if (payload.type !== 'ROOM_PORTAL') {
      return NextResponse.json({ success: false, message: 'Invalid token type.' }, { status: 401 });
    }

    const { guestId, roomId, reservationId, propertyId } = payload;

    // Check if session is still active in DB
    const session = await prisma.roomPortalSession.findFirst({
      where: { token, isActive: true },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Session expired or logged out.' },
        { status: 401 }
      );
    }

    // Check session timeout (30 min inactivity)
    const config = await prisma.roomPortalConfig.findFirst({ where: { propertyId } });
    const timeoutMin = config?.sessionTimeoutMin ?? 30;
    const lastActivity = new Date(session.lastActivity).getTime();
    const now = Date.now();
    if (now - lastActivity > timeoutMin * 60 * 1000) {
      await prisma.roomPortalSession.update({
        where: { id: session.id },
        data: { isActive: false, logoutAt: new Date() },
      });
      return NextResponse.json(
        { success: false, message: 'Session timed out due to inactivity.' },
        { status: 401 }
      );
    }

    // Update last activity
    await prisma.roomPortalSession.update({
      where: { id: session.id },
      data: { lastActivity: new Date() },
    });

    // Fetch guest, room, reservation data
    const [guest, room, reservation] = await Promise.all([
      prisma.guest.findUnique({
        where: { id: guestId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          mobile: true,
          email: true,
          avatarUrl: true,
        },
      }),
      prisma.room.findUnique({
        where: { id: roomId },
        select: {
          id: true,
          roomNumber: true,
          floor: true,
          status: true,
          housekeepingStatus: true,
        },
      }),
      prisma.reservation.findUnique({
        where: { id: reservationId },
        select: {
          id: true,
          bookingNo: true,
          arrivalDate: true,
          departureDate: true,
          status: true,
          mealPlan: true,
          totalAmount: true,
          advanceAmount: true,
          dueAmount: true,
          checkoutRequested: true,
          property: {
            select: {
              id: true,
              name: true,
              brandName: true,
              logoUrl: true,
              phone: true,
              city: true,
            },
          },
        },
      }),
    ]);

    if (!guest || !room || !reservation) {
      return NextResponse.json({ success: false, message: 'Data not found.' }, { status: 404 });
    }

    // Check if reservation is still active
    if (!['CHECKED_IN', 'CONFIRMED'].includes(reservation.status)) {
      await prisma.roomPortalSession.update({
        where: { id: session.id },
        data: { isActive: false, logoutAt: new Date() },
      });
      return NextResponse.json(
        { success: false, message: 'Your check-in is no longer active.' },
        { status: 401 }
      );
    }

    // Fetch tablet kiosk status
    const tablet = await prisma.tablet.findFirst({
      where: { roomId: room.id, mode: 'ROOM' },
      select: { id: true, kioskLocked: true, name: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        guest,
        room,
        reservation,
        sessionId: session.id,
        kioskLocked: tablet?.kioskLocked ?? false,
        config: config
          ? {
              sessionTimeoutMin: config.sessionTimeoutMin,
              showRoomService: config.showRoomService,
              showHousekeeping: config.showHousekeeping,
              showWifi: config.showWifi,
              showAmenities: config.showAmenities,
              showBill: config.showBill,
              showContact: config.showContact,
              showFeedback: config.showFeedback,
              showCheckout: config.showCheckout,
              welcomeTitle: config.welcomeTitle,
              welcomeSubtitle: config.welcomeSubtitle,
              frontDeskPhone: config.frontDeskPhone,
              emergencyPhone: config.emergencyPhone,
              wifiName: config.wifiName,
              wifiPassword: config.wifiPassword,
            }
          : null,
      },
    });
  } catch (error: any) {
    console.error('[Room Portal Me Error]:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch data.' }, { status: 500 });
  }
}
