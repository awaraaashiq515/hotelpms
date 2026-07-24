import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, resolveAdminProperty } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const roomNumber = searchParams.get('roomNumber');
    const roomId = searchParams.get('roomId');
    const propertyId = searchParams.get('propertyId') || await resolveAdminProperty(session, prisma);

    if (!roomNumber && !roomId) {
      return apiError(new Error('Room number or Room ID is required.'), 400);
    }
    if (!propertyId) {
      return apiError(new Error('No property context found.'), 400);
    }

    let targetPropertyId = propertyId;
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
          targetPropertyId = hotelProp.id;
        }
      }
    }

    // Find the active checkin for this room
    const activeCheckIn = await prisma.checkIn.findFirst({
      where: {
        ...(roomId ? { roomId } : {
          room: {
            roomNumber: roomNumber!,
            propertyId: targetPropertyId,
          }
        }),
        status: 'ACTIVE',
      },
      orderBy: {
        checkedInAt: 'desc',
      },
      include: {
        room: true,
        guest: true,
        reservation: {
          include: {
            folios: {
              where: { status: 'OPEN' }
            }
          }
        }
      }
    });

    if (!activeCheckIn) {
      return apiError(new Error('Room is not currently occupied.'), 404);
    }

    const folio = activeCheckIn.reservation?.folios?.[0] || null;

    if (!folio) {
      return apiError(new Error('No open billing account found for this room.'), 404);
    }

    return apiResponse({
      roomId: activeCheckIn.roomId,
      roomNumber: activeCheckIn.room.roomNumber,
      guestName: `${activeCheckIn.guest.firstName} ${activeCheckIn.guest.lastName || ''}`.trim(),
      guestId: activeCheckIn.guestId,
      folioId: folio.id,
      checkInId: activeCheckIn.id
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const { roomNumber, amount, description, sourceRefId } = body;

    const propertyId = body.propertyId || await resolveAdminProperty(session, prisma);

    if (!roomNumber || amount === undefined || !description) {
      return apiError(new Error('Room Number, Amount, and Description are required.'), 400);
    }
    if (!propertyId) {
      return apiError(new Error('No property context found.'), 400);
    }

    let targetPropertyId = propertyId;
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
          targetPropertyId = hotelProp.id;
        }
      }
    }

    // Find the room
    // Get active check-in
    const activeCheckIn = await prisma.checkIn.findFirst({
      where: {
        room: {
          roomNumber,
          propertyId: targetPropertyId,
        },
        status: 'ACTIVE',
      },
      orderBy: {
        checkedInAt: 'desc',
      },
      include: {
        room: true,
        reservation: {
          include: {
            folios: {
              where: { status: 'OPEN' }
            }
          }
        }
      }
    });

    if (!activeCheckIn) {
      return apiError(new Error('Room is not currently occupied.'), 400);
    }

    const folio = activeCheckIn.reservation?.folios?.[0];
    if (!folio) {
      return apiError(new Error('No open billing account found for this room.'), 400);
    }

    const val = Number(amount);

    // Create FolioTransaction
    const transaction = await prisma.folioTransaction.create({
      data: {
        folioId: folio.id,
        txnType: 'DEBIT',
        sourceModule: 'POS',
        sourceRefId: sourceRefId || null,
        description: description,
        debitAmount: val,
        creditAmount: 0,
        netAmount: val,
      }
    });

    // Update Folio balances
    const newCharges = folio.totalCharges + val;
    const newClosing = newCharges - folio.totalPayments;

    await prisma.folio.update({
      where: { id: folio.id },
      data: {
        totalCharges: newCharges,
        closingBalance: newClosing,
      }
    });

    // Reset Table status to VACANT if sourceRefId was a dining table order
    if (sourceRefId) {
      try {
        const order = await prisma.posOrder.findUnique({
          where: { id: sourceRefId },
          select: { restaurantTableId: true }
        });
        if (order?.restaurantTableId) {
          await prisma.table.update({
            where: { id: order.restaurantTableId },
            data: { status: 'VACANT' }
          });
        }
      } catch (e) {
        console.error('[post-to-room] Failed to reset table status:', e);
      }
    }

    return apiResponse(transaction, 'Charge posted to room successfully', 201);
  } catch (error) {
    return apiError(error);
  }
}
