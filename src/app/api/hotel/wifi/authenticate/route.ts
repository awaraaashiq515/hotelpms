import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

async function authenticateWiFi(roomNumber: string, password: string, propertyCode?: string | null) {
  // Prepare query filter for active, checked-in stays
  const whereClause: any = {
    status: 'CHECKED_IN',
    wifiStatus: 'ACTIVE',
    wifiPassword: password,
    rooms: {
      some: {
        room: {
          roomNumber: roomNumber
        }
      }
    }
  };

  if (propertyCode) {
    whereClause.property = {
      code: propertyCode
    };
  }

  const reservation = await prisma.reservation.findFirst({
    where: whereClause,
    include: {
      guest: true,
      rooms: {
        include: {
          room: true
        }
      },
      property: true
    }
  });

  if (!reservation) {
    return {
      authenticated: false,
      message: 'Invalid room number or password, or access is suspended/expired.'
    };
  }

  return {
    authenticated: true,
    message: 'Access granted.',
    guestName: `${reservation.guest.firstName} ${reservation.guest.lastName || ''}`.trim(),
    bookingNo: reservation.bookingNo,
    roomNumber: roomNumber,
    expiryDate: reservation.departureDate,
    hotelName: reservation.property?.name
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
