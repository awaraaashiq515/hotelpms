import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, resolveAdminProperty } from '@/lib/api-utils';
import { getSession } from '@/lib/session';
import { sendMetaWhatsAppTemplate } from '@/lib/whatsapp';

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
    let propertyId = body.propertyId || (await resolveAdminProperty(session, prisma));

    if (propertyId) {
      const prop = await prisma.property.findUnique({
        where: { id: propertyId },
        select: { hmsEnabled: true, type: true, organizationId: true },
      });
      if (prop && !prop.hmsEnabled && prop.type !== 'HOTEL') {
        const hotelProp = await prisma.property.findFirst({
          where: {
            organizationId: prop.organizationId || session.organizationId,
            OR: [{ hmsEnabled: true }, { type: 'HOTEL' }],
          },
          select: { id: true },
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
      reservationId,
      guestId,
      roomId,
      expectedCheckoutAt,
      kycData,
      walkInData,
    } = body;

    // Strict validation: Room ID and expected checkout are mandatory (C1, H3)
    if (!guestId || !roomId || !expectedCheckoutAt) {
      return apiError(new Error('Guest ID, Room assignment, and Expected Checkout date are strictly required.'), 400);
    }

    // Verify room exists and is not occupied
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return apiError(new Error('Selected room not found.'), 404);
    }

    const activeOccupant = await prisma.checkIn.findFirst({
      where: { roomId, status: 'ACTIVE' },
    });

    if (activeOccupant || room.status === 'OCCUPIED') {
      return apiError(new Error(`Room ${room.roomNumber} is already occupied. A second guest cannot be checked in.`), 400);
    }

    // Verify Guest details & KYC (H3)
    const existingGuest = await prisma.guest.findUnique({ where: { id: guestId } });
    const mb = (body.mobile || body.guestMobile || body.phone || kycData?.mobile || existingGuest?.mobile || '').trim();
    const cleanMobile = mb.replace(/[^0-9]/g, '');

    if (!cleanMobile || cleanMobile === '0000000000' || cleanMobile.length < 10) {
      return apiError(new Error('A valid 10-digit guest mobile number is required for check-in.'), 400);
    }

    const idType = (kycData?.idType || body.idType || existingGuest?.idType || '').trim();
    const idNumber = (kycData?.idNumber || body.idNumber || existingGuest?.idNumber || '').trim();

    if (!idType || !idNumber || idNumber.length < 4) {
      return apiError(new Error('Guest KYC (ID Type & valid ID Number) is strictly required to check-in.'), 400);
    }

    // Update guest KYC details if sent
    const gUpdate: any = {};
    if (idType) gUpdate.idType = idType;
    if (idNumber) gUpdate.idNumber = idNumber;
    if (mb) gUpdate.mobile = mb;
    const em = body.email || body.guestEmail || kycData?.email;
    if (em) gUpdate.email = String(em).trim();
    const addr = kycData?.address || body.address || body.guestAddress;
    if (addr) gUpdate.address = String(addr).trim();
    const nat = kycData?.nationality || body.nationality || body.guestNationality;
    if (nat) gUpdate.nationality = String(nat).trim();

    if (Object.keys(gUpdate).length > 0) {
      await prisma.guest.update({
        where: { id: guestId },
        data: gUpdate,
      }).catch(() => null);
    }

    if (kycData?.documentUrl) {
      await prisma.guestDocument.create({
        data: {
          guestId,
          documentType: kycData.documentType || idType || 'ID_PROOF',
          documentUrl: kycData.documentUrl,
          verified: true,
        },
      }).catch(() => null);
    }

    let finalReservationId = reservationId;
    let roomRentTotal = 0;

    if (!finalReservationId) {
      // Walk-in reservation
      const rate = Number(walkInData?.ratePerNight || room.customRate || 1000);
      const isComplimentary = Boolean(walkInData?.isComplimentary);

      if (rate <= 0 && !isComplimentary) {
        return apiError(new Error('Room tariff must be greater than ₹0 (unless marked complimentary).'), 400);
      }

      const bookingNo = `WALK-${Date.now().toString().slice(-6)}`;
      const nights = Math.max(1, Math.round((new Date(expectedCheckoutAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
      roomRentTotal = isComplimentary ? 0 : rate * nights;

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
          wifiStatus: 'ACTIVE',
          wifiPassword: generateWiFiPassword(room.roomNumber),
          totalAmount: roomRentTotal,
          advanceAmount: Number(walkInData?.advanceAmount || 0),
          dueAmount: Math.max(0, roomRentTotal - Number(walkInData?.advanceAmount || 0)),
          waiveBill: isComplimentary,
          rooms: {
            create: {
              roomId,
              ratePerNight: rate,
              adults: Number(walkInData?.adults || 1),
              children: Number(walkInData?.children || 0),
            },
          },
        },
      });
      finalReservationId = walkInRes.id;
    } else {
      const reservation = await prisma.reservation.update({
        where: { id: reservationId },
        data: {
          status: 'CHECKED_IN',
          wifiStatus: 'ACTIVE',
          assignedRoomId: roomId,
          wifiPassword: generateWiFiPassword(room.roomNumber),
          rooms: {
            updateMany: {
              where: { reservationId },
              data: { roomId },
            },
          },
        },
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
      },
    });

    // Create Folio (Billing Ledger) - Mandatory for every check-in (H3)
    const folioNo = `FOL-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const currentRes = await prisma.reservation.findUnique({
      where: { id: finalReservationId },
      select: {
        extraAdults: true,
        extraAdultCharge: true,
        extraBed: true,
        extraBedCharge: true,
        advanceAmount: true,
        waiveBill: true,
        isOwnerGuest: true,
      },
    });

    const isWaived = Boolean(currentRes?.waiveBill || currentRes?.isOwnerGuest);
    const advancePaid = isWaived ? 0 : Number(walkInData?.advanceAmount || currentRes?.advanceAmount || 0);

    const folio = await prisma.folio.create({
      data: {
        reservationId: finalReservationId,
        guestId,
        folioNo,
        openingBalance: 0,
        totalCharges: isWaived ? 0 : roomRentTotal,
        totalPayments: advancePaid,
        closingBalance: isWaived ? 0 : Math.max(0, roomRentTotal - advancePaid),
        status: 'OPEN',
      },
    });

    if (!isWaived && roomRentTotal > 0) {
      await prisma.folioTransaction.create({
        data: {
          folioId: folio.id,
          txnType: 'DEBIT',
          sourceModule: 'HMS',
          description: `Room Rent (${room.roomNumber})`,
          debitAmount: roomRentTotal,
          creditAmount: 0,
          netAmount: roomRentTotal,
        },
      });

      if (advancePaid > 0) {
        await prisma.folioTransaction.create({
          data: {
            folioId: folio.id,
            txnType: 'CREDIT',
            sourceModule: 'HMS',
            description: 'Advance Deposit Payment',
            debitAmount: 0,
            creditAmount: advancePaid,
            netAmount: -advancePaid,
          },
        });
      }
    }

    // Update Room status to OCCUPIED
    await prisma.room.update({
      where: { id: roomId },
      data: {
        status: 'OCCUPIED',
      },
    });

    // Send WhatsApp Guest Portal & Wi-Fi Access Template
    if (cleanMobile && cleanMobile.length >= 10) {
      try {
        const propInfo = await prisma.property.findUnique({
          where: { id: propertyId },
          select: { name: true, hotelWifiName: true, whatsAppEnabled: true },
        });

        const gName = `${existingGuest?.firstName || ''} ${existingGuest?.lastName || ''}`.trim() || 'Guest';
        const wifiNet = propInfo?.hotelWifiName || 'OrderMint_Guest_WiFi';
        const wifiPass = (walkInData as any)?.wifiPassword || generateWiFiPassword(room.roomNumber);

        sendMetaWhatsAppTemplate({
          mobile: cleanMobile,
          templateName: 'guest_room_portal_access',
          parameters: [
            gName,
            propInfo?.name || 'OrderMint Hotel',
            room.roomNumber,
            wifiNet,
            wifiPass,
          ],
          propertyId,
        }).catch((err) => console.error('[Checkin WhatsApp BG Error]:', err));
      } catch (waErr) {
        console.error('[Checkin WhatsApp Send Error]:', waErr);
      }
    }

    return apiResponse({ checkIn, folio }, 'Guest checked in successfully', 201);
  } catch (error) {
    console.error('Checkin error:', error);
    return apiError(error);
  }
}
