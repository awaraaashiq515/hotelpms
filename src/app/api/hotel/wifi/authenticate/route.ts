import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

async function authenticateWiFi(roomNumber: string, password: string, propertyCode?: string | null) {
  const cleanRoom = roomNumber.trim();
  const cleanPass = password.trim();

  // Prepare room query condition matching either assignedRoom or reservation rooms
  const roomCondition = {
    OR: [
      {
        rooms: {
          some: {
            room: {
              roomNumber: cleanRoom,
            },
          },
        },
      },
      {
        assignedRoom: {
          roomNumber: cleanRoom,
        },
      },
    ],
  };

  const propertyCondition: any = {};
  if (propertyCode) {
    propertyCondition.property = {
      code: propertyCode.trim(),
    };
  }

  // 1. Check active stay with matching wifiPassword and ACTIVE wifiStatus
  const activeReservation = await prisma.reservation.findFirst({
    where: {
      status: 'CHECKED_IN',
      wifiStatus: 'ACTIVE',
      wifiPassword: cleanPass,
      ...roomCondition,
      ...propertyCondition,
    },
    include: {
      guest: true,
      rooms: {
        include: {
          room: true,
        },
      },
      property: true,
    },
  });

  if (activeReservation) {
    return {
      authenticated: true,
      message: 'Access granted.',
      guestName: `${activeReservation.guest.firstName} ${activeReservation.guest.lastName || ''}`.trim(),
      bookingNo: activeReservation.bookingNo,
      roomNumber: cleanRoom,
      expiryDate: activeReservation.departureDate,
      hotelName: activeReservation.property?.name,
    };
  }

  // 2. If not found, check if this was an expired or checked-out stay for diagnostics
  const expiredReservation = await prisma.reservation.findFirst({
    where: {
      wifiPassword: cleanPass,
      ...roomCondition,
      ...propertyCondition,
      OR: [
        { status: 'CHECKED_OUT' },
        { wifiStatus: 'EXPIRED' },
      ],
    },
  });

  if (expiredReservation) {
    return {
      authenticated: false,
      status: 'EXPIRED',
      message: 'Wi-Fi access has expired because guest has checked out.',
    };
  }

  return {
    authenticated: false,
    status: 'INVALID',
    message: 'Invalid room number or Wi-Fi password.',
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { roomNumber, password, propertyCode } = body;

    if (!roomNumber || !password) {
      return NextResponse.json({
        success: false,
        authenticated: false,
        message: 'Missing roomNumber or password parameters.'
      }, { status: 400 });
    }

    const result = await authenticateWiFi(roomNumber, password, propertyCode);
    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error: any) {
    console.error('[WiFi AUTH POST ERROR]:', error);
    return NextResponse.json({
      success: false,
      authenticated: false,
      message: 'Internal server error during authentication.'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomNumber = searchParams.get('roomNumber');
    const password = searchParams.get('password');
    const propertyCode = searchParams.get('propertyCode');

    if (!roomNumber || !password) {
      return NextResponse.json({
        success: false,
        authenticated: false,
        message: 'Missing roomNumber or password query parameters.'
      }, { status: 400 });
    }

    const result = await authenticateWiFi(roomNumber, password, propertyCode);
    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error: any) {
    console.error('[WiFi AUTH GET ERROR]:', error);
    return NextResponse.json({
      success: false,
      authenticated: false,
      message: 'Internal server error during authentication.'
    }, { status: 500 });
  }
}
