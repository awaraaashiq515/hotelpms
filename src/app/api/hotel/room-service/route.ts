import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, resolveAdminProperty } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

// ── GET — Fetch today's room service orders ────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId') || await resolveAdminProperty(session, prisma);
    const roomNumber = searchParams.get('roomNumber');
    const dateParam = searchParams.get('date');
    const status = searchParams.get('status');

    if (!propertyId) return apiError(new Error('No property context'), 400);

    // Date filter — default today
    const targetDate = dateParam ? new Date(dateParam) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Resolve organization propertyIds so orders match across hotel and restaurant POS
    let propertyIds: string[] = [propertyId];
    if (session.organizationId) {
      const orgProps = await prisma.property.findMany({
        where: { organizationId: session.organizationId },
        select: { id: true }
      });
      if (orgProps.length > 0) {
        propertyIds = orgProps.map((p: any) => p.id);
      }
    }

    // Query active room service & guest pre-orders (excluding COMPLETED/PAID/SETTLED by default)
    const orders = await prisma.posOrder.findMany({
      where: {
        propertyId: { in: propertyIds },
        createdAt: { gte: startOfDay, lte: endOfDay },
        OR: [
          { orderType: 'ROOM_SERVICE' },
          { guestId: { not: null } },
          { deliveryInstructions: { contains: 'ROOM:' } },
          { deliveryInstructions: { contains: 'SERVE_TIME' } }
        ],
        ...(roomNumber ? { deliveryInstructions: { contains: `ROOM:${roomNumber}` } } : {}),
        ...(status ? { status } : { status: { notIn: ['COMPLETED', 'PAID', 'SETTLED', 'CANCELLED'] } }),
      },
      include: {
        items: {
          include: { product: { select: { name: true, isVeg: true } } }
        },
        guest: { select: { firstName: true, lastName: true } },
        staffMember: true,
        servedBy: { include: { staffMember: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Shape response into RoomServiceOrder format
    const shaped = orders.map((o: any) => {
      const sm = o.staffMember || o.servedBy?.staffMember;
      return {
        id: o.id,
        orderNo: o.orderNo || o.id.slice(-6).toUpperCase(),
        roomNumber: extractRoomFromInstructions(o.deliveryInstructions, o.tableNo),
        guestName: o.guest ? `${o.guest.firstName} ${o.guest.lastName || ''}`.trim() : null,
        orderType: o.orderType || 'ROOM_SERVICE',
        tableNo: o.tableNo || null,
        deliveryInstructions: o.deliveryInstructions || null,
        status: o.status || 'PENDING',
        items: (o.items || []).map((item: any) => ({
          id: item.id,
          productId: item.productId,
          name: item.product?.name || item.name || 'Item',
          qty: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.totalAmount || item.unitPrice * item.quantity,
          note: item.note,
        })),
        subtotal: o.subtotal || 0,
        taxAmount: o.taxAmount || 0,
        totalAmount: o.grandTotal || 0,
        specialNote: extractSpecialNoteFromInstructions(o.deliveryInstructions),
        postedToFolio: o.folioId != null,
        folioTxnId: o.folioId,
        staffMember: sm ? { id: sm.id, name: sm.name, designation: sm.designation } : null,
        servedBy: o.servedBy ? { id: o.servedBy.id, name: o.servedBy.fullName } : null,
        servedById: o.servedById,
        staffMemberId: o.staffMemberId || sm?.id || null,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
      };
    });

    return apiResponse(shaped, 'Room service orders fetched');
  } catch (error) {
    return apiError(error);
  }
}

// ── POST — Create a new room service order ─────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const {
      roomNumber,
      orderType = 'ROOM_SERVICE',
      items,           // [{ productId?, name, qty, unitPrice, lineTotal, note }]
      subtotal,
      taxAmount,
      totalAmount,
      postToFolio = true,
      specialNote = '',
      guestId,
      folioId,         // if postToFolio — pass folioId from room lookup
      servedById: bodyServedById,
      staffMemberId: bodyStaffMemberId,
    } = body;

    const propertyId = body.propertyId || await resolveAdminProperty(session, prisma);
    if (!propertyId) return apiError(new Error('No property context'), 400);

    if (!items || items.length === 0) {
      return apiError(new Error('Items are required'), 400);
    }

    // Resolve server POS User and StaffMember
    const currentUserId = bodyServedById || session?.id || null;
    let resolvedStaffMemberId = bodyStaffMemberId || null;

    // Build deliveryInstructions string to encode room metadata safely without unmapped fields
    const instructions = [
      roomNumber ? `ROOM:${roomNumber}` : '',
      specialNote ? `NOTE:${specialNote}` : '',
    ].filter(Boolean).join('|');

    // Generate order number
    const orderNo = `RS-${Date.now().toString().slice(-6)}`;

    // Create PosOrder and automatically attach to active Room Folio
    const order = await prisma.$transaction(async (tx: any) => {
      let outlet = await tx.outlet.findFirst({ where: { propertyId } });
      if (!outlet) {
        outlet = await tx.outlet.create({
          data: {
            propertyId,
            name: 'Main Outlet',
            type: 'RESTAURANT',
          }
        });
      }

      if (currentUserId && !resolvedStaffMemberId) {
        const sm = await tx.staffMember.findFirst({
          where: { userId: currentUserId },
          select: { id: true }
        });
        if (sm) resolvedStaffMemberId = sm.id;
      }

      // Auto-resolve Folio if postToFolio is true and no folioId provided
      let resolvedFolioId = folioId || null;
      let resolvedGuestId = guestId || null;

      if (postToFolio && !resolvedFolioId && roomNumber) {
        // Find room by roomNumber
        const room = await tx.room.findFirst({
          where: { propertyId, roomNumber: String(roomNumber) }
        });
        if (room) {
          const resRoom = await tx.reservationRoom.findFirst({
            where: { roomId: room.id },
            include: { reservation: { include: { folios: true } } },
            orderBy: { id: 'desc' }
          });
          if (resRoom?.reservation) {
            resolvedGuestId = resolvedGuestId || resRoom.reservation.guestId;
            if (resRoom.reservation.folios && resRoom.reservation.folios.length > 0) {
              resolvedFolioId = resRoom.reservation.folios[0].id;
            } else {
              // Create a folio for this reservation if missing
              const newFolio = await tx.folio.create({
                data: {
                  reservationId: resRoom.reservation.id,
                  guestId: resRoom.reservation.guestId,
                  folioNo: `FOL-${resRoom.reservation.bookingNo || Date.now()}`,
                  status: 'OPEN',
                  openingBalance: 0,
                  totalCharges: 0,
                  totalPayments: 0,
                  closingBalance: 0
                }
              });
              resolvedFolioId = newFolio.id;
            }
          }
        }
      }

      const posOrder = await tx.posOrder.create({
        data: {
          propertyId,
          outletId: outlet.id,
          guestId: resolvedGuestId,
          folioId: postToFolio && resolvedFolioId ? resolvedFolioId : null,
          orderNo,
          orderType: 'ROOM_SERVICE',
          tableNo: roomNumber ? `Room ${roomNumber}` : undefined,
          status: 'CONFIRMED',
          servedById: currentUserId,
          staffMemberId: resolvedStaffMemberId,
          subtotal: Number(subtotal) || 0,
          taxAmount: Number(taxAmount) || 0,
          discountAmount: 0,
          grandTotal: Number(totalAmount) || 0,
          deliveryInstructions: instructions,
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              quantity: Number(item.qty),
              unitPrice: Number(item.unitPrice),
              totalAmount: Number(item.lineTotal),
            })),
          },
        },
        include: { items: true },
      });

      // Post charge to room folio if requested & resolved
      if (postToFolio && resolvedFolioId) {
        const totalVal = Number(totalAmount);

        // Create FolioTransaction
        await tx.folioTransaction.create({
          data: {
            folioId: resolvedFolioId,
            txnType: 'DEBIT',
            sourceModule: 'POS',
            sourceRefId: posOrder.id,
            description: `Room Service — ${items.map((i: any) => i.name).join(', ')} (Order #${orderNo})`,
            debitAmount: totalVal,
            creditAmount: 0,
            taxAmount: Number(taxAmount) || 0,
            netAmount: totalVal,
          },
        });

        // Update Folio totals
        const folio = await tx.folio.findUnique({ where: { id: resolvedFolioId } });
        if (folio) {
          const newCharges = folio.totalCharges + totalVal;
          await tx.folio.update({
            where: { id: resolvedFolioId },
            data: {
              totalCharges: newCharges,
              closingBalance: newCharges - folio.totalPayments,
            },
          });
        }
      }

      return posOrder;
    });

    return NextResponse.json({
      success: true,
      data: {
        id: order.id,
        orderNo,
        postedToFolio: postToFolio && !!folioId,
        message: postToFolio && folioId
          ? `Order placed & ₹${totalAmount} posted to Room ${roomNumber} folio`
          : `Order placed successfully (Order #${orderNo})`,
      },
    }, { status: 201 });

  } catch (error) {
    return apiError(error);
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function extractRoomFromInstructions(instructions?: string | null, tableNo?: string | null): string {
  if (instructions) {
    const match = instructions.match(/ROOM:([^|]+)/);
    if (match) return match[1];
  }
  if (tableNo) {
    return tableNo.replace(/^Room\s*/i, '');
  }
  return '';
}

function extractSpecialNoteFromInstructions(instructions?: string | null): string {
  if (!instructions) return '';
  const match = instructions.match(/NOTE:([^|]+)/);
  return match ? match[1] : '';
}
