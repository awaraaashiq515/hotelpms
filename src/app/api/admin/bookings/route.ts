import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

// GET: Retrieve all booking requests for the admin property
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = session.propertyId || searchParams.get('propertyId');

    if (!propertyId) {
      return NextResponse.json({ success: false, message: 'Property ID is required.' }, { status: 400 });
    }

    const bookings = await prisma.bookingRequest.findMany({
      where: { propertyId },
      include: {
        singer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            genre: true,
            photoUrl: true,
            rating: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, data: bookings });
  } catch (error: any) {
    console.error('[Admin Bookings GET Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}

// POST: Hotel invites a singer
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { singerId, venueName, date, startTime, endTime, proposedFee, notes } = await request.json();

    const propertyId = session.propertyId;
    if (!propertyId) {
      return NextResponse.json({ success: false, message: 'Property ID is required.' }, { status: 400 });
    }

    if (!singerId || !venueName || !date || !startTime || !endTime) {
      return NextResponse.json({ success: false, message: 'Missing required booking details.' }, { status: 400 });
    }

    const booking = await prisma.bookingRequest.create({
      data: {
        singerId,
        propertyId,
        sender: 'HOTEL',
        venueName,
        date: new Date(date),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        proposedFee: proposedFee ? parseFloat(proposedFee) : null,
        notes: notes || null,
        status: 'PENDING'
      }
    });

    return NextResponse.json({ success: true, message: 'Singer invited successfully!', data: booking });
  } catch (error: any) {
    console.error('[Admin Bookings POST Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}

// PATCH: Admin responds to a proposal submitted by a Singer (ACCEPT | DECLINE)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { bookingRequestId, status } = await request.json(); // status: "ACCEPTED" | "DECLINED"

    if (!bookingRequestId || !status) {
      return NextResponse.json({ success: false, message: 'Booking ID and status are required.' }, { status: 400 });
    }

    const booking = await prisma.bookingRequest.findUnique({
      where: { id: bookingRequestId }
    });

    if (!booking || booking.propertyId !== session.propertyId) {
      return NextResponse.json({ success: false, message: 'Booking request not found or unauthorized.' }, { status: 404 });
    }

    if (booking.sender !== 'SINGER') {
      return NextResponse.json({ success: false, message: 'Cannot verify: Only proposals sent by singers can be responded to by admin.' }, { status: 400 });
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

    return NextResponse.json({ success: true, message: `Proposal ${status.toLowerCase()} successfully.`, data: updated });
  } catch (error: any) {
    console.error('[Admin Bookings PATCH Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
