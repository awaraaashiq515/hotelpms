import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawVendorId = searchParams.get('vendorId');
    const vendorId = (rawVendorId && rawVendorId !== 'undefined' && rawVendorId !== 'null') ? rawVendorId : null;
    const status = searchParams.get('status');

    const where: any = {};
    if (vendorId) where.vendorId = vendorId;
    if (status) where.status = status;

    const bookings = await prisma.rentalBikeBooking.findMany({
      where,
      include: {
        bike: true,
        vendor: { select: { id: true, name: true, shopName: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: bookings });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      vendorId, bikeId, guestName, guestPhone, guestEmail,
      aadhaarNumber, panNumber, licenseNumber,
      startDate, endDate, totalAmount, securityDeposit, notes,
    } = body;

    if (!bikeId || !guestName || !guestPhone || !startDate || !endDate) {
      return NextResponse.json(
        { success: false, message: 'bikeId, guestName, guestPhone, startDate, and endDate are required' },
        { status: 400 }
      );
    }

    // Resolve vendorId from bike if not passed
    let resolvedVendorId = vendorId;
    if (!resolvedVendorId) {
      const bike = await prisma.rentalBike.findUnique({ where: { id: bikeId } });
      if (!bike) return NextResponse.json({ success: false, message: 'Bike not found' }, { status: 404 });
      resolvedVendorId = bike.vendorId;
    }

    // Create booking and mark bike as ON_RENT
    const [booking] = await prisma.$transaction([
      prisma.rentalBikeBooking.create({
        data: {
          vendorId: resolvedVendorId,
          bikeId,
          guestName,
          guestPhone,
          guestEmail: guestEmail || null,
          aadhaarNumber: aadhaarNumber || null,
          panNumber: panNumber || null,
          licenseNumber: licenseNumber || null,
          startDate,
          endDate,
          totalAmount: Number(totalAmount) || 0,
          securityDeposit: Number(securityDeposit) || 1000,
          status: 'CONFIRMED',
          notes: notes || null,
        },
      }),
      prisma.rentalBike.update({
        where: { id: bikeId },
        data: { status: 'ON_RENT' },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Bike rental booking confirmed!',
      data: booking,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, depositRefunded } = body;

    if (!id) return NextResponse.json({ success: false, message: 'Booking ID required' }, { status: 400 });

    const booking = await prisma.rentalBikeBooking.findUnique({ where: { id } });
    if (!booking) return NextResponse.json({ success: false, message: 'Booking not found' }, { status: 404 });

    const data: any = {};
    if (status) data.status = status;
    if (depositRefunded !== undefined) data.depositRefunded = Boolean(depositRefunded);

    const updated = await prisma.rentalBikeBooking.update({
      where: { id },
      data,
    });

    // If returned or cancelled, make bike AVAILABLE again
    if (status === 'RETURNED' || status === 'CANCELLED') {
      await prisma.rentalBike.update({
        where: { id: booking.bikeId },
        data: { status: 'AVAILABLE' },
      });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
