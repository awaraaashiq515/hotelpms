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
    let propertyId = searchParams.get('propertyId') || session.propertyId;

    if (!propertyId && session.organizationId) {
      const first = await prisma.property.findFirst({
        where: { organizationId: session.organizationId },
        select: { id: true },
        orderBy: { createdAt: 'asc' }
      });
      propertyId = first?.id ?? null;
    }

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
        assignedRoomId,
        // Add-Ons
        mealPlan,
        poolAccess,
        poolPackage,
        poolPassCost,
        spaPackage,
        spaPackageCost,
        addOnNotes,
        // GST / Corporate Billing
        gstNumber,
        companyName,
        billingAddress,
        // Discount
        discountType,
        discountValue,
        advanceAmount,
      } = body;

      const finalGuestEmail = guestEmail !== undefined ? guestEmail : emailBooking.guestEmail;
      const finalGuestPhone = guestPhone !== undefined ? guestPhone : emailBooking.guestPhone;
      const finalGuestName = guestName || emailBooking.guestName || 'Guest';
      const baseAmount = amount !== undefined ? Number(amount) : (emailBooking.amount || 0);

      // Compute add-on costs
      const finalPoolPassCost = poolAccess ? (Number(poolPassCost) || 0) : 0;
      const finalSpaPackageCost = spaPackage && spaPackage !== 'NONE' ? (Number(spaPackageCost) || 0) : 0;
      const subTotal = baseAmount + finalPoolPassCost + finalSpaPackageCost;

      // Apply discount
      let discountAmount = 0;
      if (discountValue && Number(discountValue) > 0) {
        if (discountType === 'PERCENTAGE') {
          discountAmount = Math.round((subTotal * Number(discountValue)) / 100);
        } else {
          discountAmount = Number(discountValue);
        }
      }
      const finalTotal = Math.max(0, subTotal - discountAmount);
      const finalAdvance = advanceAmount ? Number(advanceAmount) : 0;
      const finalDue = Math.max(0, finalTotal - finalAdvance);

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
      const nights = Math.max(1, Math.round((parsedCheckOut.getTime() - parsedCheckIn.getTime()) / (1000 * 60 * 60 * 24)));

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
          totalAmount: finalTotal,
          advanceAmount: finalAdvance,
          dueAmount: finalDue,
          // Add-Ons
          mealPlan: mealPlan || 'RO',
          poolAccess: !!poolAccess,
          poolPackage: poolAccess ? (poolPackage || 'DAY_PASS') : 'NONE',
          poolPassCost: finalPoolPassCost,
          spaPackage: spaPackage || 'NONE',
          spaPackageCost: finalSpaPackageCost,
          addOnNotes: addOnNotes ? String(addOnNotes).trim() : null,
          // GST / Corporate Billing
          gstNumber: gstNumber ? String(gstNumber).trim().toUpperCase() : null,
          companyName: companyName ? String(companyName).trim() : null,
          billingAddress: billingAddress ? String(billingAddress).trim() : null,
          rooms: {
            create: {
              roomId: assignedRoomId || null,
              ratePerNight: baseAmount / nights,
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
