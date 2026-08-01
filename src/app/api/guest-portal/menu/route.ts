import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

const secretKey = process.env.JWT_SECRET || 'super-secret-default-key-change-it-in-prod';
const key = new TextEncoder().encode(secretKey);

export async function GET(request: NextRequest) {
  try {
    // Verify guest session
    const authHeader = request.headers.get('Authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.substring(7);
    let payload: any;
    try {
      const result = await jwtVerify(token, key, { algorithms: ['HS256'] });
      payload = result.payload;
    } catch {
      return NextResponse.json({ success: false, message: 'Invalid session' }, { status: 401 });
    }
    if (payload.type !== 'GUEST_PORTAL') {
      return NextResponse.json({ success: false, message: 'Invalid session type' }, { status: 401 });
    }

    // Get guest's reservation to find organizationId
    const guest = await prisma.guest.findUnique({
      where: { id: payload.guestId as string },
      include: {
        reservations: {
          where: { status: { in: ['CONFIRMED', 'CHECKED_IN'] } },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            propertyId: true,
            rooms: {
              take: 1,
              include: { room: { select: { roomNumber: true } } }
            }
          }
        },
        organization: { select: { id: true } }
      }
    });

    if (!guest) {
      return NextResponse.json({ success: false, message: 'Guest not found' }, { status: 404 });
    }

    const orgId = guest.organization?.id || guest.organizationId;
    const reservationPropertyId = guest.reservations[0]?.propertyId;

    // Fetch all active categories across the org (from ALL properties)
    // Priority: reservation's property first, then other org properties as fallback
    let categories = await prisma.category.findMany({
      where: {
        isActive: true,
        menuType: 'RESTAURANT',
        property: { organizationId: orgId },
      },
      include: {
        products: {
          where: {
            isActive: true,
            menuType: 'RESTAURANT',
          },
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            description: true,
            sellingPrice: true,
            halfPrice: true,
            taxRate: true,
            taxType: true,
            image: true,
            isVeg: true,
            menuType: true,
            availabilityStatus: true,
            variants: {
              select: { id: true, name: true, price: true }
            }
          }
        },
        property: { select: { name: true } }
      },
      orderBy: { displayOrder: 'asc' },
    });

    // Filter out categories with no products
    categories = categories.filter((c: any) => c.products.length > 0);

    // Fetch dining tables for pre-ordering table seating
    const tables = await prisma.table.findMany({
      where: {
        ...(reservationPropertyId ? { propertyId: reservationPropertyId } : {}),
      },
      select: {
        id: true,
        name: true,
        capacity: true,
        status: true,
        floor: { select: { name: true } }
      },
      orderBy: { name: 'asc' }
    });

    const roomNumber = guest.reservations[0]?.rooms?.[0]?.room?.roomNumber || null;

    return NextResponse.json({
      success: true,
      data: {
        propertyId: reservationPropertyId,
        roomNumber,
        categories,
        tables,
      }
    });
  } catch (error: any) {
    console.error('[Guest Portal Menu Error]:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
