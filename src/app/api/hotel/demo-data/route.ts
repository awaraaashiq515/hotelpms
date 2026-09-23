import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

async function resolveHotelProperty(session: any, propertyIdParam?: string | null) {
  const propertyId = propertyIdParam || session.propertyId;
  let targetPropertyId = propertyId;

  if (propertyId && propertyId !== 'all' && propertyId !== 'null' && propertyId !== 'undefined') {
    const prop = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { hmsEnabled: true, type: true, organizationId: true }
    });
    if (prop && !prop.hmsEnabled && prop.type !== 'HOTEL') {
      const hotelProp = await prisma.property.findFirst({
        where: {
          organizationId: prop.organizationId || session.organizationId,
          OR: [{ hmsEnabled: true }, { type: 'HOTEL' }]
        },
        select: { id: true }
      });
      if (hotelProp) {
        targetPropertyId = hotelProp.id;
      }
    }
  } else if (session.organizationId) {
    const hotelProp = await prisma.property.findFirst({
      where: {
        organizationId: session.organizationId,
        OR: [{ hmsEnabled: true }, { type: 'HOTEL' }]
      },
      select: { id: true }
    });
    if (hotelProp) {
      targetPropertyId = hotelProp.id;
    }
  }

  return targetPropertyId;
}

// GET /api/hotel/demo-data: Check if current hotel property has seeded demo data
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const targetPropertyId = await resolveHotelProperty(session, searchParams.get('propertyId'));
    const orgId = session.organizationId;

    if (!targetPropertyId && !orgId) {
      return apiResponse({ hasDemoData: false });
    }

    // 1. Check for seeded demo guests
    const demoGuests = await prisma.guest.findMany({
      where: {
        organizationId: orgId,
        email: { in: ['tarun@example.com', 'priya@example.com'] }
      },
      select: { id: true, firstName: true, lastName: true, email: true }
    });

    const demoGuestIds = demoGuests.map(g => g.id);

    // 2. Check for demo reservations
    const demoReservations = await prisma.reservation.findMany({
      where: {
        ...(targetPropertyId ? { propertyId: targetPropertyId } : {}),
        guestId: { in: demoGuestIds }
      },
      select: { id: true, bookingNo: true, status: true, totalAmount: true }
    });

    // 3. Check for demo rooms (101, 102, 103, 201, 202, 203)
    const demoRooms = targetPropertyId ? await prisma.room.findMany({
      where: {
        propertyId: targetPropertyId,
        roomNumber: { in: ['101', '102', '103', '201', '202', '203'] }
      },
      select: { id: true, roomNumber: true, status: true }
    }) : [];

    const hasDemoData = demoGuests.length > 0 || demoReservations.length > 0;

    return apiResponse({
      hasDemoData,
      demoGuestsCount: demoGuests.length,
      demoReservationsCount: demoReservations.length,
      demoRoomsCount: demoRooms.length,
      guestNames: demoGuests.map(g => `${g.firstName} ${g.lastName}`),
      bookingNumbers: demoReservations.map(r => r.bookingNo),
      roomNumbers: demoRooms.map(r => r.roomNumber)
    });

  } catch (error) {
    return apiError(error);
  }
}

// DELETE /api/hotel/demo-data: Clear demo bookings, guests, and optionally rooms
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'bookings'; // 'bookings' or 'all'
    const targetPropertyId = await resolveHotelProperty(session, searchParams.get('propertyId'));
    const orgId = session.organizationId;

    if (!orgId) {
      return apiError(new Error('Organization not found'), 400);
    }

    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Find demo guests
      const demoGuests = await tx.guest.findMany({
        where: {
          organizationId: orgId,
          email: { in: ['tarun@example.com', 'priya@example.com'] }
        },
        select: { id: true }
      });

      const demoGuestIds = demoGuests.map((g: any) => g.id);

      // 2. Find demo reservations
      const demoReservations = await tx.reservation.findMany({
        where: {
          ...(targetPropertyId ? { propertyId: targetPropertyId } : {}),
          guestId: { in: demoGuestIds }
        },
        select: { id: true }
      });

      const demoResIds = demoReservations.map((r: any) => r.id);

      if (demoResIds.length > 0) {
        // 1. Delete CheckOut records linked to demo check-ins first (prevents foreign key violation)
        const checkIns = await tx.checkIn.findMany({
          where: { reservationId: { in: demoResIds } },
          select: { id: true }
        });
        const checkInIds = checkIns.map((c: any) => c.id);

        if (checkInIds.length > 0) {
          await tx.checkOut.deleteMany({
            where: { checkInId: { in: checkInIds } }
          });
        }

        // 2. Delete check-ins
        await tx.checkIn.deleteMany({
          where: { reservationId: { in: demoResIds } }
        });

        // 3. Find folios linked to these reservations
        const folios = await tx.folio.findMany({
          where: { reservationId: { in: demoResIds } },
          select: { id: true }
        });
        const folioIds = folios.map((f: any) => f.id);

        if (folioIds.length > 0) {
          // Delete folio transactions
          await tx.folioTransaction.deleteMany({
            where: { folioId: { in: folioIds } }
          });
          // Unlink invoices linked to folios
          await tx.invoice.updateMany({
            where: { folioId: { in: folioIds } },
            data: { folioId: null }
          });
          // Unlink POS orders
          await tx.posOrder.updateMany({
            where: { folioId: { in: folioIds } },
            data: { folioId: null }
          });
          // Unlink spa bookings
          await tx.spaBooking.updateMany({
            where: { folioId: { in: folioIds } },
            data: { folioId: null }
          });
          // Delete folios
          await tx.folio.deleteMany({
            where: { id: { in: folioIds } }
          });
        }

        // 4. Delete RoomPortal records
        await tx.roomPortalSession.deleteMany({
          where: { reservationId: { in: demoResIds } }
        });
        await tx.roomPortalActivityLog.deleteMany({
          where: { reservationId: { in: demoResIds } }
        });

        // 5. Delete reservation rooms
        await tx.reservationRoom.deleteMany({
          where: { reservationId: { in: demoResIds } }
        });

        // 6. Delete reservations
        await tx.reservation.deleteMany({
          where: { id: { in: demoResIds } }
        });
      }

      // 7. Delete demo guests (with child records)
      if (demoGuestIds.length > 0) {
        await tx.guestDocument.deleteMany({
          where: { guestId: { in: demoGuestIds } }
        });
        await tx.loyaltyLog.deleteMany({
          where: { guestId: { in: demoGuestIds } }
        });
        await tx.coupon.updateMany({
          where: { assignedGuestId: { in: demoGuestIds } },
          data: { assignedGuestId: null }
        });
        await tx.tipTransaction.updateMany({
          where: { guestId: { in: demoGuestIds } },
          data: { guestId: null }
        });
        await tx.posOrder.updateMany({
          where: { guestId: { in: demoGuestIds } },
          data: { guestId: null }
        });
        await tx.invoice.updateMany({
          where: { guestId: { in: demoGuestIds } },
          data: { guestId: null }
        });
        await tx.roomPortalSession.deleteMany({
          where: { guestId: { in: demoGuestIds } }
        });
        await tx.guest.deleteMany({
          where: { id: { in: demoGuestIds } }
        });
      }

      // Reset room occupancy status for all rooms in property to AVAILABLE / CLEAN
      if (targetPropertyId) {
        await tx.room.updateMany({
          where: { propertyId: targetPropertyId },
          data: {
            status: 'AVAILABLE',
            housekeepingStatus: 'CLEAN'
          }
        });
      }

      // If mode === 'all', also remove demo rooms and room types (only if no other reservations exist)
      let deletedRoomsCount = 0;
      let deletedTypesCount = 0;

      if (mode === 'all' && targetPropertyId) {
        // Find rooms with no active reservations
        const demoRoomsToDelete = await tx.room.findMany({
          where: {
            propertyId: targetPropertyId,
            roomNumber: { in: ['101', '102', '103', '201', '202', '203'] },
            rooms: { none: {} }
          },
          select: { id: true }
        });

        if (demoRoomsToDelete.length > 0) {
          const roomIds = demoRoomsToDelete.map((r: any) => r.id);
          // Delete child records of rooms
          await tx.housekeepingTask.deleteMany({ where: { roomId: { in: roomIds } } });
          await tx.maintenanceTicket.deleteMany({ where: { roomId: { in: roomIds } } });
          await tx.reservationRoom.deleteMany({ where: { roomId: { in: roomIds } } });
          await tx.checkIn.deleteMany({ where: { roomId: { in: roomIds } } });
          const delRes = await tx.room.deleteMany({
            where: { id: { in: roomIds } }
          });
          deletedRoomsCount = delRes.count;
        }

        // Find room types that now have no rooms
        const emptyRoomTypes = await tx.roomType.findMany({
          where: {
            propertyId: targetPropertyId,
            code: { in: ['DELUXE', 'SDELUXE', 'SUITE'] },
            rooms: { none: {} }
          },
          select: { id: true }
        });

        if (emptyRoomTypes.length > 0) {
          const typeIds = emptyRoomTypes.map((t: any) => t.id);
          const delTypes = await tx.roomType.deleteMany({
            where: { id: { in: typeIds } }
          });
          deletedTypesCount = delTypes.count;
        }
      }

      return {
        deletedReservations: demoResIds.length,
        deletedGuests: demoGuestIds.length,
        deletedRooms: deletedRoomsCount,
        deletedTypes: deletedTypesCount
      };
    });

    const msg = mode === 'all'
      ? `Demo data completely removed (${result.deletedReservations} bookings, ${result.deletedGuests} guests, ${result.deletedRooms} rooms).`
      : `Demo bookings (${result.deletedReservations}) and demo guests (${result.deletedGuests}) removed successfully. Rooms reset to Available.`;

    return apiResponse(result, msg);

  } catch (error) {
    return apiError(error);
  }
}
