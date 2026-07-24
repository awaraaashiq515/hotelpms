import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, resolveAdminProperty } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

function generateWiFiPassword(roomNumber: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomPart = '';
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${roomNumber}-${randomPart}`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    let propertyId = body.propertyId || await resolveAdminProperty(session, prisma);

    if (propertyId) {
      const prop = await prisma.property.findUnique({
        where: { id: propertyId },
        select: { hmsEnabled: true, type: true, organizationId: true }
      });
      if (prop && !prop.hmsEnabled && prop.type !== 'HOTEL') {
        const hotelProp = await prisma.property.findFirst({
          where: {
            organizationId: prop.organizationId || session.organizationId,
            OR: [
              { hmsEnabled: true },
              { type: 'HOTEL' }
            ]
          },
          select: { id: true }
        });
        if (hotelProp) {
          propertyId = hotelProp.id;
        }
      }
    }

    if (!propertyId) {
      return apiError(new Error('No property context found.'), 400);
    }

    const {
      reservationId, // optional (can be direct checkin/walk-in)
      guestId,       // required
      roomId,        // required
      expectedCheckoutAt, // required
      kycData,       // optional, { idType, idNumber, documentType, documentUrl }
      walkInData,    // optional if reservationId is null, contains pricing info for walk-in
    } = body;

    if (!guestId || !roomId || !expectedCheckoutAt) {
      return apiError(new Error('Guest ID, Room ID, and Expected Checkout date are required.'), 400);
    }

    // Verify room is available
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return apiError(new Error('Room not found.'), 404);
    }

    if (room.status === 'OCCUPIED') {
      return apiError(new Error('Room is already occupied.'), 400);
    }

    // Update guest KYC details if sent
    if (kycData) {
      await prisma.guest.update({
        where: { id: guestId },
        data: {
          idType: kycData.idType || undefined,
          idNumber: kycData.idNumber || undefined,
        }
      });

      if (kycData.documentUrl) {
        await prisma.guestDocument.create({
          data: {
            guestId,
            documentType: kycData.documentType || kycData.idType || 'ID_PROOF',
            documentUrl: kycData.documentUrl,
            verified: true,
          }
        });
      }
    }

    let finalReservationId = reservationId;
    let roomRentTotal = 0;

    if (!finalReservationId) {
      // Create a walk-in Reservation
      const bookingNo = `WALK-${Date.now().toString().slice(-6)}`;
      const nights = Math.max(1, Math.round((new Date(expectedCheckoutAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
      roomRentTotal = Number(walkInData?.ratePerNight || 1000) * nights;

      const walkInRes = await prisma.reservation.create({
        data: {
          propertyId,
          guestId,
          bookingNo,
          arrivalDate: new Date(),
          departureDate: new Date(expectedCheckoutAt),
          adults: Number(walkInData?.adults || 1),
          children: Number(walkInData?.children || 0),
          roomTypeId: room.roomTypeId,
          assignedRoomId: roomId,
          status: 'CHECKED_IN',
          wifiPassword: generateWiFiPassword(room.roomNumber),
          totalAmount: roomRentTotal,
          advanceAmount: Number(walkInData?.advanceAmount || 0),
          dueAmount: roomRentTotal - Number(walkInData?.advanceAmount || 0),
          rooms: {
            create: {
              roomId,
              ratePerNight: Number(walkInData?.ratePerNight || 1000),
              adults: Number(walkInData?.adults || 1),
              children: Number(walkInData?.children || 0),
            }
          }
        }
      });
      finalReservationId = walkInRes.id;
    } else {
      // Update existing reservation status to CHECKED_IN and update room assignment in ReservationRoom
      const reservation = await prisma.reservation.update({
        where: { id: reservationId },
        data: {
          status: 'CHECKED_IN',
          assignedRoomId: roomId,
          wifiPassword: generateWiFiPassword(room.roomNumber),
          rooms: {
            updateMany: {
              where: { reservationId },
              data: { roomId }
            }
          }
        }
      });
      roomRentTotal = reservation.totalAmount;
    }

    // Create Check-In Record
    const checkIn = await prisma.checkIn.create({
      data: {
        reservationId: finalReservationId,
        guestId,
        roomId,
        checkedInAt: new Date(),
        expectedCheckoutAt: new Date(expectedCheckoutAt),
        status: 'ACTIVE',
      }
    });

    // Create Guest Folio (Billing ledger)
    const folioNo = `FOL-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const folio = await prisma.folio.create({
      data: {
        reservationId: finalReservationId,
        guestId,
        folioNo,
        openingBalance: 0,
        totalCharges: roomRentTotal,
        totalPayments: walkInData?.advanceAmount ? Number(walkInData.advanceAmount) : 0,
        closingBalance: roomRentTotal - (walkInData?.advanceAmount ? Number(walkInData.advanceAmount) : 0),
        status: 'OPEN',
      }
    });

    // Add initial Room Rent debit transaction to FolioTransaction
    await prisma.folioTransaction.create({
      data: {
        folioId: folio.id,
        txnType: 'DEBIT',
        sourceModule: 'HMS',
        description: `Room Rent (${room.roomNumber})`,
        debitAmount: roomRentTotal,
        creditAmount: 0,
        netAmount: roomRentTotal,
      }
    });

    // Add Advance Payment credit transaction to FolioTransaction if applicable
    if (walkInData?.advanceAmount && Number(walkInData.advanceAmount) > 0) {
      await prisma.folioTransaction.create({
        data: {
          folioId: folio.id,
          txnType: 'CREDIT',
          sourceModule: 'HMS',
          description: `Advance Deposit Payment`,
          debitAmount: 0,
          creditAmount: Number(walkInData.advanceAmount),
          netAmount: -Number(walkInData.advanceAmount),
        }
      });
    }

    // Update Room status to OCCUPIED
    await prisma.room.update({
      where: { id: roomId },
      data: {
        status: 'OCCUPIED',
      }
    });

    return apiResponse({ checkIn, folio }, 'Guest checked in successfully', 201);
  } catch (error) {
    return apiError(error);
  }
}
