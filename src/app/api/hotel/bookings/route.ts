import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, getMultiTenantWhere, resolveAdminProperty } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const propertyIdParam = searchParams.get('propertyId');

    const reservations = await prisma.reservation.findMany({
      where: getMultiTenantWhere(session, propertyIdParam),
      include: {
        guest: true,
        roomType: true,
        rooms: {
          include: {
            room: true,
          }
        }
      },
      orderBy: { arrivalDate: 'asc' },
    });

    return apiResponse(reservations);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const propertyId = body.propertyId || await resolveAdminProperty(session, prisma);

    if (!propertyId) {
      return apiError(new Error('No property context found.'), 400);
    }

    const {
      guestId,
      guestData, // if guestId is null, we create guest
      arrivalDate,
      departureDate,
      adults,
      children,
      roomTypeId,
      assignedRoomId,
      totalAmount,
      advanceAmount = 0,
    } = body;

    let finalGuestId = guestId;

    if (!finalGuestId && guestData) {
      // Find or create guest
      const existingGuest = await prisma.guest.findFirst({
        where: {
          organizationId: session.organizationId,
          mobile: guestData.mobile || undefined,
        }
      });

      if (existingGuest) {
        finalGuestId = existingGuest.id;
      } else {
        const newGuest = await prisma.guest.create({
          data: {
            organizationId: session.organizationId,
            firstName: guestData.firstName,
            lastName: guestData.lastName || '',
            mobile: guestData.mobile || '',
            email: guestData.email || '',
            idType: guestData.idType || '',
            idNumber: guestData.idNumber || '',
          }
        });
        finalGuestId = newGuest.id;
      }
    }

    if (!finalGuestId) {
      return apiError(new Error('Guest information is required.'), 400);
    }

    // Generate unique Booking No
    const bookingNo = `RES-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const total = Number(totalAmount || 0);
    const advance = Number(advanceAmount || 0);
    const due = total - advance;

    const reservation = await prisma.reservation.create({
      data: {
        propertyId,
        guestId: finalGuestId,
        bookingNo,
        arrivalDate: new Date(arrivalDate),
        departureDate: new Date(departureDate),
        adults: Number(adults || 1),
        children: Number(children || 0),
        roomTypeId,
        assignedRoomId: assignedRoomId || null,
        status: 'CONFIRMED',
        totalAmount: total,
        advanceAmount: advance,
        dueAmount: due,
        // Create matching ReservationRoom detail
        rooms: {
          create: {
            roomId: assignedRoomId || null,
            ratePerNight: total / Math.max(1, Math.round((new Date(departureDate).getTime() - new Date(arrivalDate).getTime()) / (1000 * 60 * 60 * 24))),
            adults: Number(adults || 1),
            children: Number(children || 0),
          }
        }
      },
      include: {
        guest: true,
        roomType: true,
        rooms: true,
      }
    });

    // If an assignedRoomId was specified, we can optionally mark it as reserved or let it update on check-in
    return apiResponse(reservation, 'Booking created successfully', 201);
  } catch (error) {
    return apiError(error);
  }
}
