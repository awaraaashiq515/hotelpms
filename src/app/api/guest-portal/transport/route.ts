import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

const secretKey = process.env.JWT_SECRET || 'super-secret-default-key-change-it-in-prod';
const key = new TextEncoder().encode(secretKey);

async function getGuestPayload(request: NextRequest) {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    const { payload } = await jwtVerify(auth.slice(7), key);
    return payload;
  } catch {
    return null;
  }
}

// GET /api/guest-portal/transport — Get available drivers, vehicles, schedules & guest's bookings
export async function GET(request: NextRequest) {
  try {
    const guestPayload = await getGuestPayload(request);
    const guestPhone = guestPayload?.phone as string | undefined;

    // Fetch active drivers and their vehicles + schedules
    const drivers = await prisma.transportDriver.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        phone: true,
        rating: true,
        isOnline: true,
        city: true,
        state: true,
        address: true,
        licenseNumber: true,
        vehicles: {
          where: { isActive: true },
          include: {
            schedules: {
              where: { isActive: true }
            }
          }
        }
      },
      orderBy: { isOnline: 'desc' }
    });

    // Fetch active schedules across all vehicles
    const schedules = await prisma.transportSchedule.findMany({
      where: { isActive: true },
      include: {
        vehicle: {
          include: {
            driver: {
              select: { id: true, name: true, phone: true, rating: true, isOnline: true }
            }
          }
        }
      },
      orderBy: { departureTime: 'asc' }
    });

    // Fetch guest's bookings if guest is authenticated
    let guestBookings: any[] = [];
    if (guestPhone) {
      guestBookings = await prisma.transportBooking.findMany({
        where: { guestPhone },
        include: {
          driver: { select: { name: true, phone: true, rating: true } },
          schedule: { select: { routeName: true, departureTime: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    return NextResponse.json({
      success: true,
      drivers,
      schedules,
      guestBookings
    });
  } catch (error: any) {
    console.error('[Guest Transport API Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}

// POST /api/guest-portal/transport — Book a ride from guest portal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      driverId,
      scheduleId,
      guestName,
      guestPhone,
      guestRoom,
      fromLocation,
      toLocation,
      travelDate,
      travelTime,
      seats,
      totalAmount,
      notes
    } = body;

    if (!driverId || !guestName || !guestPhone || !fromLocation || !toLocation || !travelDate || !travelTime) {
      return NextResponse.json({ success: false, message: 'Please fill in all required booking fields.' }, { status: 400 });
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
        status: 'PENDING',
        notes: notes?.trim() || null
      },
      include: {
        driver: { select: { name: true, phone: true } },
        schedule: { select: { routeName: true } }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Ride request sent successfully! Driver will confirm shortly.',
      booking
    });
  } catch (error: any) {
    console.error('[Guest Transport Booking Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Booking failed' }, { status: 500 });
  }
}
