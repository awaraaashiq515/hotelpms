import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId') || session.propertyId;

    if (!propertyId) {
      return apiError(new Error('Property ID is required'), 400);
    }

    const emailBookings = await prisma.emailBooking.findMany({
      where: { propertyId },
      orderBy: { createdAt: 'desc' }
    });

    return apiResponse(emailBookings, 'Email bookings fetched successfully');
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const body = await request.json();
    const { emailBookingId, action } = body;

    if (!emailBookingId) {
      return apiError(new Error('Missing emailBookingId parameter'), 400);
    }

    const emailBooking = await prisma.emailBooking.findUnique({
      where: { id: emailBookingId },
      include: { property: true }
    });

    if (!emailBooking) {
      return apiError(new Error('Email booking record not found'), 404);
    }

    if (action === 'REJECT') {
      const updated = await prisma.emailBooking.update({
        where: { id: emailBookingId },
        data: { status: 'REJECTED' }
      });
      return apiResponse(updated, 'Email booking marked as rejected');
    }

    if (action === 'IMPORT') {
      const property = emailBooking.property;

      const {
        guestName,
        guestEmail,
        guestPhone,
        checkIn,
        checkOut,
        amount,
        roomTypeId,
        adults,
        children,
        assignedRoomId
      } = body;

      const finalGuestEmail = guestEmail !== undefined ? guestEmail : emailBooking.guestEmail;
      const finalGuestPhone = guestPhone !== undefined ? guestPhone : emailBooking.guestPhone;
      const finalGuestName = guestName || emailBooking.guestName || 'Guest';
      const finalAmount = amount !== undefined ? Number(amount) : (emailBooking.amount || 0);

      // 1. Find or create Guest
      let guest = null;
      if (finalGuestEmail || finalGuestPhone) {
        guest = await prisma.guest.findFirst({
          where: {
            organizationId: property.organizationId,
            OR: [
              finalGuestEmail ? { email: finalGuestEmail } : {},
              finalGuestPhone ? { mobile: finalGuestPhone } : {}
            ].filter(cond => Object.keys(cond).length > 0)
          }
        });
      }

      if (!guest) {
        guest = await prisma.guest.create({
          data: {
            organizationId: property.organizationId,
            firstName: finalGuestName,
            lastName: '',
            email: finalGuestEmail,
            mobile: finalGuestPhone
          }
        });
      }

      // 2. Resolve Room Type
      let finalRoomTypeId = roomTypeId;
      if (!finalRoomTypeId) {
        const roomType = await prisma.roomType.findFirst({
          where: { propertyId: property.id }
        });
        if (!roomType) {
          return apiError(new Error('No Room Types are configured for this property. Please add room types first.'), 400);
        }
        finalRoomTypeId = roomType.id;
      }

      // 3. Create Reservation record
      const bookingNo = `EB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const parsedCheckIn = checkIn ? new Date(checkIn) : (emailBooking.checkIn || new Date());
      const parsedCheckOut = checkOut ? new Date(checkOut) : (emailBooking.checkOut || new Date(Date.now() + 24 * 60 * 60 * 1000));

      const reservation = await prisma.reservation.create({
        data: {
          propertyId: property.id,
          guestId: guest.id,
          bookingNo,
          arrivalDate: parsedCheckIn,
          departureDate: parsedCheckOut,
          adults: adults ? Number(adults) : 2,
          children: children ? Number(children) : 0,
          roomTypeId: finalRoomTypeId,
          assignedRoomId: assignedRoomId || null,
          status: 'CONFIRMED',
          totalAmount: finalAmount,
          dueAmount: finalAmount,
          rooms: {
            create: {
              roomId: assignedRoomId || null,
              ratePerNight: finalAmount / Math.max(1, Math.round((parsedCheckOut.getTime() - parsedCheckIn.getTime()) / (1000 * 60 * 60 * 24))),
              adults: adults ? Number(adults) : 2,
              children: children ? Number(children) : 0,
            }
          }
        }
      });

      // 4. Update status to IMPORTED
      await prisma.emailBooking.update({
        where: { id: emailBookingId },
        data: { status: 'IMPORTED' }
      });

      return apiResponse(reservation, 'Email booking successfully imported to reservations');
    }

    return apiError(new Error('Invalid action parameter'), 400);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return apiError(new Error('Missing id parameter'), 400);
    }

    const deleted = await prisma.emailBooking.delete({
      where: { id }
    });

    return apiResponse(deleted, 'Email booking deleted successfully');
  } catch (error) {
    return apiError(error);
  }
}
