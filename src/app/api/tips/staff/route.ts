import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/tips/staff?propertyId=xxx or ?guestId=xxx
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let propertyId = searchParams.get('propertyId');
    let guestId = searchParams.get('guestId');

    // Also check token in Authorization header
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    if (!guestId && authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        if (decoded?.guestId) {
          guestId = decoded.guestId;
        }
        if (!propertyId && decoded?.propertyId) {
          propertyId = decoded.propertyId;
        }
      } catch {}
    }

    let guestInfo: any = null;
    let recentOrders: any[] = [];
    let roomNumber = '';

    // If guestId is available, resolve propertyId, roomNumber and recent orders
    if (guestId) {
      const guest = await prisma.guest.findUnique({
        where: { id: guestId },
        include: {
          reservations: {
            orderBy: { createdAt: 'desc' },
            take: 3,
            include: {
              property: true,
              rooms: { include: { room: true } },
              folios: {
                include: {
                  posOrders: {
                    orderBy: { createdAt: 'desc' },
                    take: 8,
                    include: {
                      staffMember: true,
                      servedBy: { include: { staffMember: true } },
                      items: { include: { product: true } },
                    },
                  },
                },
              },
            },
          },
          posOrders: {
            orderBy: { createdAt: 'desc' },
            take: 8,
            include: {
              staffMember: true,
              servedBy: { include: { staffMember: true } },
              items: { include: { product: true } },
            },
          },
        },
      });

      if (guest) {
        guestInfo = {
          id: guest.id,
          name: `${guest.firstName} ${guest.lastName || ''}`.trim(),
          mobile: guest.mobile,
        };

        const activeReservation = guest.reservations.find(r => r.status === 'CHECKED_IN' || r.status === 'CONFIRMED') || guest.reservations[0];

        if (activeReservation) {
          if (!propertyId) {
            propertyId = activeReservation.propertyId;
          }
          const assignedRoom = activeReservation.rooms?.[0]?.room?.roomNumber;
          if (assignedRoom) {
            roomNumber = assignedRoom;
            guestInfo.roomNumber = assignedRoom;
          }
        }

        // Collect orders from folios and direct posOrders
        const allOrders: any[] = [];
        const seenOrderIds = new Set<string>();

        guest.reservations.forEach(r => {
          r.folios.forEach(f => {
            f.posOrders.forEach(o => {
              if (!seenOrderIds.has(o.id)) {
                seenOrderIds.add(o.id);
                allOrders.push(o);
              }
            });
          });
        });

        guest.posOrders.forEach(o => {
          if (!seenOrderIds.has(o.id)) {
            seenOrderIds.add(o.id);
            allOrders.push(o);
          }
        });

        // Also query room service orders matching this room or guest from the property
        try {
          const roomOrders = await prisma.posOrder.findMany({
            where: {
              propertyId: propertyId || undefined,
              OR: [
                { guestId: guest.id },
                ...(roomNumber ? [
                  { tableNo: `Room ${roomNumber}` },
                  { tableNo: roomNumber },
                  { deliveryInstructions: { contains: `ROOM:${roomNumber}` } },
                ] : []),
              ],
            },
            include: {
              staffMember: true,
              servedBy: { include: { staffMember: true } },
              items: { include: { product: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
          });

          for (const o of roomOrders) {
            if (!seenOrderIds.has(o.id)) {
              seenOrderIds.add(o.id);
              allOrders.push(o);
            }
          }
        } catch (err) {
          console.error('[Tipping API] Error fetching extra room orders:', err);
        }

        const sorted = allOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // Resolve staffMember details for each order
        recentOrders = await Promise.all(
          sorted.slice(0, 6).map(async o => {
            let sm: any = o.staffMember;
            if (!sm && o.servedBy?.staffMember) {
              sm = o.servedBy.staffMember;
            }
            if (!sm && o.servedById) {
              sm = await prisma.staffMember.findFirst({
                where: { userId: o.servedById },
                include: { user: { select: { avatarUrl: true } } },
              });
            }

            return {
              id: o.id,
              orderNo: o.orderNo,
              grandTotal: o.grandTotal,
              status: o.status,
              createdAt: o.createdAt,
              itemsSummary: o.items?.map((i: any) => i.product?.name).filter(Boolean).join(', ') || 'Room Service Order',
              staffMember: sm ? {
                id: sm.id,
                name: sm.name,
                designation: sm.designation,
                upiId: sm.upiId,
                upiName: sm.upiName,
                avatarUrl: sm.avatarUrl || sm.user?.avatarUrl || null,
              } : null,
              servedBy: o.servedBy ? { id: o.servedBy.id, name: o.servedBy.fullName } : null,
            };
          })
        );

        if (!propertyId && allOrders.length > 0 && allOrders[0].propertyId) {
          propertyId = allOrders[0].propertyId;
        }
      }
    }

    // Fallback: If still no propertyId, find the property with tipping enabled or the first property
    if (!propertyId) {
      const fallbackProp = await prisma.property.findFirst({
        where: { tippingEnabled: true },
        select: { id: true },
      }) || await prisma.property.findFirst({
        select: { id: true },
      });

      if (fallbackProp) {
        propertyId = fallbackProp.id;
      }
    }

    if (!propertyId) {
      return NextResponse.json({ success: false, message: 'Property not found' }, { status: 404 });
    }

    // Fetch property tipping settings
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        tippingEnabled: true,
        tippingStaffRoles: true,
        tippingPresets: true,
        name: true,
      },
    });

    if (!property) {
      return NextResponse.json({ success: false, message: 'Property not found' }, { status: 404 });
    }

    // Fetch all active staff of this property
    const allStaff = await prisma.staffMember.findMany({
      where: {
        propertyId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        designation: true,
        upiId: true,
        upiName: true,
        avatarUrl: true,
        user: {
          select: { avatarUrl: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Flexible role matching: check if designation contains any allowed role
    const allowedRoles = property.tippingStaffRoles
      ? property.tippingStaffRoles.split(',').map((r: string) => r.trim().toLowerCase()).filter(Boolean)
      : [];

    let filteredStaff = allStaff;
    if (allowedRoles.length > 0) {
      const matched = allStaff.filter(s => {
        if (!s.designation) return true;
        const des = s.designation.toLowerCase();
        return allowedRoles.some(role => {
          const rootRole = role.replace(/ing$|s$|er$|ers$/i, '');
          return des.includes(role) || role.includes(des) || (rootRole.length >= 4 && des.includes(rootRole));
        });
      });
      // Only filter down if there are matches; otherwise fallback to all staff so list isn't empty
      if (matched.length > 0) {
        filteredStaff = matched;
      }
    }

    // Identify who served the room order (from the most recent served order)
    const servedOrder = recentOrders.find(o => o.staffMember && o.staffMember.id);
    const orderServer = servedOrder?.staffMember || null;

    // Ensure the server who delivered the order is always in the staff list and prioritized
    if (orderServer) {
      const existingIdx = filteredStaff.findIndex(s => s.id === orderServer.id);
      if (existingIdx >= 0) {
        const [serverItem] = filteredStaff.splice(existingIdx, 1);
        filteredStaff.unshift(serverItem);
      } else {
        filteredStaff.unshift({
          id: orderServer.id,
          name: orderServer.name,
          designation: orderServer.designation,
          upiId: orderServer.upiId,
          upiName: orderServer.upiName,
          avatarUrl: orderServer.avatarUrl,
          user: null,
        } as any);
      }
    }

    const presets = property.tippingPresets
      ? property.tippingPresets.split(',').map((p: string) => parseFloat(p.trim())).filter((p: number) => !isNaN(p))
      : [10, 20, 50, 100];

    const staffWithAvatars = filteredStaff.map(s => ({
      id: s.id,
      name: s.name,
      designation: s.designation,
      upiId: s.upiId,
      upiName: s.upiName,
      avatarUrl: s.avatarUrl || (s as any).user?.avatarUrl || null,
      isOrderServer: orderServer ? s.id === orderServer.id : false,
    }));

    return NextResponse.json({
      success: true,
      staff: staffWithAvatars,
      orderServer: orderServer ? {
        ...orderServer,
        orderNo: servedOrder?.orderNo,
        orderTotal: servedOrder?.grandTotal,
        orderId: servedOrder?.id,
      } : null,
      presets,
      propertyName: property.name,
      propertyId: property.id,
      guestInfo,
      roomNumber,
      recentOrders,
    });
  } catch (error: any) {
    console.error('Failed to get tipping staff:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
