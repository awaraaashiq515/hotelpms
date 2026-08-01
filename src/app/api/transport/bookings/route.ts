import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

const secretKey = process.env.JWT_SECRET || 'super-secret-default-key-change-it-in-prod';
const key = new TextEncoder().encode(secretKey);

async function getDriverId(request: NextRequest): Promise<string | null> {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    const { payload } = await jwtVerify(auth.slice(7), key);
    return payload.driverId as string;
  } catch {
    return null;
  }
}

// GET /api/transport/bookings — Get all bookings for this driver
export async function GET(request: NextRequest) {
  const driverId = await getDriverId(request);
  if (!driverId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const status = request.nextUrl.searchParams.get('status');

  try {
    const bookings = await prisma.transportBooking.findMany({
      where: {
        driverId,
        ...(status ? { status } : {})
      },
      include: { schedule: { select: { routeName: true, departureTime: true } } },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, bookings });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// PUT /api/transport/bookings — Update booking status (Accept/Decline/Complete)
export async function PUT(request: NextRequest) {
  const driverId = await getDriverId(request);
  if (!driverId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  try {
    const { bookingId, status } = await request.json();
    const validStatuses = ['CONFIRMED', 'CANCELLED', 'IN_PROGRESS', 'COMPLETED'];

    if (!bookingId || !validStatuses.includes(status)) {
      return NextResponse.json({ success: false, message: 'Invalid booking ID or status.' }, { status: 400 });
    }

    const booking = await prisma.transportBooking.findFirst({ where: { id: bookingId, driverId } });
    if (!booking) return NextResponse.json({ success: false, message: 'Booking not found.' }, { status: 404 });

    const updated = await prisma.transportBooking.update({
      where: { id: bookingId },
      data: { status },
      include: { schedule: { select: { routeName: true } } }
    });

    return NextResponse.json({ success: true, booking: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST /api/transport/bookings — Create a new booking (from guest/admin side)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { driverId, scheduleId, guestName, guestPhone, guestRoom, fromLocation, toLocation, travelDate, travelTime, seats, totalAmount, notes } = body;

    if (!driverId || !guestName || !guestPhone || !fromLocation || !toLocation || !travelDate || !travelTime) {
      return NextResponse.json({ success: false, message: 'Missing required booking fields.' }, { status: 400 });
    }

    const booking = await prisma.transportBooking.create({
      data: {
        driverId,
        scheduleId: scheduleId || null,
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim(),
        guestRoom: guestRoom?.trim() || null,
        fromLocation: fromLocation.trim(),
        toLocation: toLocation.trim(),
        travelDate,
        travelTime,
        seats: Number(seats) || 1,
        totalAmount: Number(totalAmount) || 0,
        notes: notes?.trim() || null,
      }
    });

    return NextResponse.json({ success: true, booking });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
