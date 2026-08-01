import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

const secretKey = process.env.JWT_SECRET || 'super-secret-default-key-change-it-in-prod';
const key = new TextEncoder().encode(secretKey);

async function getSingerFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
    if (payload && payload.type === 'SINGER_PORTAL' && payload.singerId) {
      return await prisma.singer.findUnique({
        where: { id: payload.singerId as string }
      });
    }
  } catch (err) {
    return null;
  }
  return null;
}

// GET: List all booking requests for this singer
export async function GET(request: NextRequest) {
  try {
    const singer = await getSingerFromRequest(request);
    if (!singer) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const bookings = await prisma.bookingRequest.findMany({
      where: { singerId: singer.id },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            city: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, data: bookings });
  } catch (error: any) {
    console.error('[Singer Bookings GET Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}

// POST: Singer proposes performance to a hotel property
export async function POST(request: NextRequest) {
  try {
    const singer = await getSingerFromRequest(request);
    if (!singer) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { propertyId, venueName, date, startTime, endTime, proposedFee, notes } = await request.json();

    if (!propertyId || !venueName || !date || !startTime || !endTime) {
      return NextResponse.json({ success: false, message: 'Missing required booking details.' }, { status: 400 });
    }

    const booking = await prisma.bookingRequest.create({
      data: {
        singerId: singer.id,
        propertyId,
        sender: 'SINGER',
        venueName,
        date: new Date(date),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        proposedFee: proposedFee ? parseFloat(proposedFee) : null,
        notes: notes || null,
        status: 'PENDING'
      }
    });

    return NextResponse.json({ success: true, message: 'Performance proposal submitted to hotel!', data: booking });
  } catch (error: any) {
    console.error('[Singer Bookings POST Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}

// PATCH: Singer responds to hotel invitation (ACCEPT | DECLINE)
export async function PATCH(request: NextRequest) {
  try {
    const singer = await getSingerFromRequest(request);
    if (!singer) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { bookingRequestId, status } = await request.json(); // status: "ACCEPTED" | "DECLINED"

    if (!bookingRequestId || !status) {
      return NextResponse.json({ success: false, message: 'Booking ID and status are required.' }, { status: 400 });
    }

    const booking = await prisma.bookingRequest.findUnique({
      where: { id: bookingRequestId }
    });

    if (!booking || booking.singerId !== singer.id) {
      return NextResponse.json({ success: false, message: 'Booking request not found or unauthorized.' }, { status: 404 });
    }

    if (booking.sender !== 'HOTEL') {
      return NextResponse.json({ success: false, message: 'Cannot verify: Only invitations sent by hotel admins can be responded to by singers.' }, { status: 400 });
    }

    const updated = await prisma.bookingRequest.update({
      where: { id: bookingRequestId },
      data: { status }
    });

    // If accepted, auto-create a Performance schedule
    if (status === 'ACCEPTED') {
      await prisma.performance.create({
        data: {
          singerId: booking.singerId,
          propertyId: booking.propertyId,
          venueName: booking.venueName,
          date: booking.date,
          startTime: booking.startTime,
          endTime: booking.endTime,
          status: 'SCHEDULED'
        }
      });
    }

    return NextResponse.json({ success: true, message: `Invitation ${status.toLowerCase()} successfully.`, data: updated });
  } catch (error: any) {
    console.error('[Singer Bookings PATCH Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
