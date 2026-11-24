import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, resolveAdminProperty } from '@/lib/api-utils';
import { getSession } from '@/lib/session';
import { getWTUserFromRequest } from '@/lib/walkie-talkie-auth';
import { getNextKotNumber } from '@/lib/kot-generator';

// ── GET — Fetch today's room service orders ────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const wtUser = await getWTUserFromRequest(request);
    if (!session && !wtUser) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const paramPropertyId = searchParams.get('propertyId');
    const paramPropertyCode = searchParams.get('propertyCode');
    const roomNumber = searchParams.get('roomNumber');
    const dateParam = searchParams.get('date');
    const status = searchParams.get('status');

    let orgId = session?.organizationId || wtUser?.organizationId || (wtUser?.property as any)?.organizationId || null;
    let basePropertyId = paramPropertyId || session?.propertyId || wtUser?.propertyId || null;

    if (paramPropertyCode) {
      const codeProp = await prisma.property.findFirst({
        where: {
          OR: [
            { code: paramPropertyCode },
            { code: paramPropertyCode.toUpperCase() },
            { code: paramPropertyCode.toLowerCase() },
          ],
        },
        select: { id: true, organizationId: true },
      });
      if (codeProp) {
        basePropertyId = basePropertyId || codeProp.id;
        if (!orgId) orgId = codeProp.organizationId;
      }
    }

    if (!orgId && basePropertyId) {
      const p = await prisma.property.findUnique({
        where: { id: basePropertyId },
        select: { organizationId: true },
      });
      if (p) orgId = p.organizationId;
    }

    let propertyIds: string[] = [];
    if (orgId) {
      const orgProps = await prisma.property.findMany({
        where: { organizationId: orgId },
        select: { id: true },
      });
      propertyIds = orgProps.map((p) => p.id);
    } else if (basePropertyId) {
      propertyIds = [basePropertyId];
    } else if (session) {
      const adminProp = await resolveAdminProperty(session, prisma);
      if (adminProp) propertyIds = [adminProp];
    }

    if (propertyIds.length === 0) return apiError(new Error('No property context'), 400);

    // Resolve status filter
    let statusFilter: any = undefined;
    if (status) {
      if (status.includes(',')) {
        statusFilter = { in: status.split(',').map((s) => s.trim()) };
      } else if (status === 'PENDING' || status === 'active' || status === 'UNFULFILLED') {
        // Room portal and tablet orders default to CONFIRMED / PENDING / OPEN
        statusFilter = { in: ['PENDING', 'CONFIRMED', 'OPEN', 'KOT_RUNNING'] };
      } else {
        statusFilter = status;
      }
    } else {
      statusFilter = { notIn: ['COMPLETED', 'PAID', 'SETTLED', 'CANCELLED', 'DELIVERED'] };
    }

    // Date filter — default today unless date=all or querying active/pending unfulfilled orders
    const isQueryingPending = status === 'PENDING' || status === 'active' || status === 'UNFULFILLED';
    let createdAtFilter: any = undefined;
    if (dateParam !== 'all' && !isQueryingPending) {
      const targetDate = dateParam ? new Date(dateParam) : new Date();
      if (!isNaN(targetDate.getTime())) {
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);
        createdAtFilter = { gte: startOfDay, lte: endOfDay };
      }
    }

    // Query active room service & guest pre-orders
    const orders = await prisma.posOrder.findMany({
      where: {
        propertyId: { in: propertyIds },
        ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
        OR: [
          { orderType: 'ROOM_SERVICE' },
          { tableNo: { contains: 'Room' } },
          { deliveryInstructions: { contains: 'ROOM:' } },
          { deliveryInstructions: { contains: 'SERVE_TIME' } },
          { guestId: { not: null } },
        ],
        ...(roomNumber ? {
          OR: [
            { deliveryInstructions: { contains: `ROOM:${roomNumber}` } },
            { tableNo: `Room ${roomNumber}` },
          ]
        } : {}),
        status: statusFilter,
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
        serveTiming: extractServeTimeFromInstructions(o.deliveryInstructions),
        packagingType: extractPackagingFromInstructions(o.deliveryInstructions),
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
    const wtUser = await getWTUserFromRequest(request);
    if (!session && !wtUser) return apiError(new Error('Unauthorized'), 401);

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

    const propertyId = body.propertyId || wtUser?.propertyId || (session ? await resolveAdminProperty(session, prisma) : null);
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
        if (!room) {
          throw new Error(`Room ${roomNumber} not found.`);
        }

        // C9 & C15: Strictly verify active stay and open folio — never post to previous occupants or vacant rooms
        const activeCheckIn = await tx.checkIn.findFirst({
          where: {
            roomId: room.id,
            status: 'ACTIVE',
          },
          include: {
            reservation: {
              include: {
                folios: {
                  where: { status: 'OPEN' },
                },
              },
            },
          },
        });

        if (!activeCheckIn || !activeCheckIn.reservation?.folios?.[0]) {
          throw new Error(`Cannot charge to Room ${roomNumber}: Room does not have an active guest with an open folio.`);
        }

        resolvedGuestId = activeCheckIn.guestId;
        resolvedFolioId = activeCheckIn.reservation.folios[0].id;
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

    // ── Create live notification for hotel staff ──────────────────────────────
    try {
      const itemsSummary = items.map((i: any) => `${i.name} x${i.qty}`).join(', ');
      const escalateAt = new Date(Date.now() + 3 * 60 * 1000).toISOString();

      await prisma.notification.create({
        data: {
          propertyId,
          title: `🛒 Room Service — Room ${roomNumber || 'N/A'}`,
          message: `${itemsSummary} — ₹${totalAmount}${specialNote ? ` | Note: ${specialNote}` : ''}`,
          type: 'ROOM_SERVICE_ORDER',
          priority: 'HIGH',
          status: 'UNREAD',
          metadata: JSON.stringify({
            orderId: order.id,
            orderNo,
            roomNumber: roomNumber || '',
            totalAmount: Number(totalAmount),
            items: itemsSummary,
            link: '/hotel/room-service',
            escalateAt,
            autoEscalate: true,
            escalateAfterMinutes: 3,
          }),
        },
      });
    } catch (notifErr) {
      console.error('[RoomService] Notification create failed (non-blocking):', notifErr);
    }

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

// ── PATCH — Update room service order status ─────────────────────────────────
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    const wtUser = await getWTUserFromRequest(request);
    if (!session && !wtUser) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const { id, orderId, status } = body;
    const targetId = id || orderId;

    if (!targetId) {
      return apiError(new Error('Order ID is required'), 400);
    }

    const updated = await prisma.posOrder.update({
      where: { id: targetId },
      data: {
        ...(status ? { status } : {}),
      },
    });

    // ── Generate KOT ticket for Kitchen Display when order is accepted/preparing ──
    if (status === 'PREPARING' || status === 'CONFIRMED' || status === 'KOT_RUNNING') {
      try {
        const existingKot = await (prisma as any).kotTicket.findFirst({
          where: { orderId: targetId }
        });

        if (!existingKot) {
          const fullOrder = await prisma.posOrder.findUnique({
            where: { id: targetId },
            include: {
              items: {
                include: { product: true }
              }
            }
          });

          if (fullOrder && fullOrder.items && fullOrder.items.length > 0) {
            const kotNo = await getNextKotNumber(fullOrder.propertyId);

            await (prisma as any).kotTicket.create({
              data: {
                kotNo,
                orderId: fullOrder.id,
                propertyId: fullOrder.propertyId,
                outletId: fullOrder.outletId,
                tableNo: fullOrder.tableNo || 'Room Service',
                status: 'NEW', // arrives in NEW ORDERS on Kitchen Display!
                items: {
                  create: fullOrder.items.map((it: any) => ({
                    orderItemId: it.id,
                    productId: it.productId,
                    itemName: it.product?.name || 'Dish Item',
                    quantity: it.quantity,
                    status: 'NEW',
                  }))
                },
                statusLogs: {
                  create: {
                    oldStatus: 'PENDING',
                    newStatus: 'NEW',
                    changedBy: (session as any)?.user?.name || (session as any)?.name || 'Front Desk',
                    remarks: 'Order accepted by Front Desk and sent to Kitchen Display',
                  }
                }
              }
            });
          }
        }
      } catch (kotErr) {
        console.error('[Room Service] Failed to create KOT ticket for kitchen display:', kotErr);
      }
    }

    // Mark pending notification read
    try {
      await prisma.notification.updateMany({
        where: {
          type: 'ROOM_SERVICE_ORDER',
          metadata: { contains: targetId },
          status: 'UNREAD',
        },
        data: { status: 'READ' },
      });
    } catch {}

    return NextResponse.json({
      success: true,
      message: `Order status updated to ${status || updated.status}`,
      data: updated,
    });
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

function extractServeTimeFromInstructions(instructions?: string | null): string {
  if (!instructions) return 'ASAP';
  const match = instructions.match(/SERVE_TIME:([^|]+)/);
  return match ? match[1] : 'ASAP';
}

function extractPackagingFromInstructions(instructions?: string | null): string {
  if (!instructions) return 'SERVE_IN_ROOM';
  const match = instructions.match(/PACKAGING:([^|]+)/);
  return match ? match[1] : 'SERVE_IN_ROOM';
}
