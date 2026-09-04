import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Public route — no auth required. Used by QR scan verify page.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ reservationId: string }> }
) {
  try {
    const { reservationId } = await params;

    if (!reservationId) {
      return NextResponse.json({ success: false, message: 'Reservation ID is required' }, { status: 400 });
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        guest: {
          select: {
            firstName: true,
            lastName: true,
            mobile: true,
            email: true,
            idType: true,
            idNumber: true,
            nationality: true,
          },
        },
        roomType: {
          select: { name: true, code: true },
        },
        rooms: {
          include: {
            room: {
              select: { roomNumber: true, floor: true },
            },
          },
        },
        checkIns: {
          where: { status: 'ACTIVE' },
          select: {
            checkedInAt: true,
            expectedCheckoutAt: true,
            status: true,
          },
        },
        property: {
          select: {
            name: true,
            logoUrl: true,
            brandName: true,
            code: true,
            phone: true,
            address: true,
          },
        },
      },
    });

    if (!reservation) {
      return NextResponse.json({ success: false, message: 'Booking not found. Invalid QR code.' }, { status: 404 });
    }

    // Determine verification status
    let verificationStatus: 'VALID' | 'CONFIRMED' | 'EXPIRED' | 'CANCELLED' | 'INVALID';
    if (reservation.status === 'CHECKED_IN') {
      verificationStatus = 'VALID';
    } else if (reservation.status === 'CONFIRMED' || reservation.status === 'PENDING') {
      verificationStatus = 'CONFIRMED';
    } else if (reservation.status === 'CHECKED_OUT') {
      verificationStatus = 'EXPIRED';
    } else if (reservation.status === 'CANCELLED') {
      verificationStatus = 'CANCELLED';
    } else {
      verificationStatus = 'INVALID';
    }

    const roomNumber =
      reservation.rooms?.[0]?.room?.roomNumber ||
      (reservation as any).assignedRoom?.roomNumber ||
      null;
    const floor = reservation.rooms?.[0]?.room?.floor || null;

    return NextResponse.json({
      success: true,
      data: {
        verificationStatus,
        reservation: {
          id: reservation.id,
          bookingNo: reservation.bookingNo,
          status: reservation.status,
          arrivalDate: reservation.arrivalDate,
          departureDate: reservation.departureDate,
          adults: reservation.adults,
          children: reservation.children,
          totalAmount: reservation.totalAmount,
          advanceAmount: reservation.advanceAmount,
          dueAmount: reservation.dueAmount,
          mealPlan: reservation.mealPlan,
          poolAccess: reservation.poolAccess,
          poolPackage: reservation.poolPackage,
          spaPackage: reservation.spaPackage,
          addOnNotes: reservation.addOnNotes,
          roomNumber,
          floor,
          roomType: reservation.roomType?.name,
          checkInTime: reservation.checkIns?.[0]?.checkedInAt || null,
          expectedCheckout: reservation.checkIns?.[0]?.expectedCheckoutAt || reservation.departureDate,
        },
        guest: reservation.guest,
        property: reservation.property,
      },
    });
  } catch (error: any) {
    console.error('[Security Verify API]', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
