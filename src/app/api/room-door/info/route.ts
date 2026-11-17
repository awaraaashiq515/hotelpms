import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolvePropertyIdentifier } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

/**
 * GET /api/room-door/info
 * Public endpoint called by guests scanning the QR code outside their room.
 * Returns hotel contact info, Wi-Fi details, room details, and stay status.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyParam = searchParams.get('propertyCode') || searchParams.get('propertyId') || searchParams.get('property') || '';
    const roomParam = searchParams.get('room') || searchParams.get('roomNumber') || searchParams.get('roomId') || '';

    if (!roomParam) {
      return NextResponse.json({ success: false, message: 'Room number or ID is required.' }, { status: 400 });
    }

    // 1. Resolve property
    let property: any = null;
    if (propertyParam) {
      property = await resolvePropertyIdentifier(propertyParam);
    }
    if (!property) {
      property = await prisma.property.findFirst({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          code: true,
          address: true,
          phone: true,
        },
      });
    }

    if (!property) {
      return NextResponse.json({ success: false, message: 'Property not found.' }, { status: 404 });
    }

    // 2. Resolve room in this property
    const room: any = await (prisma as any).room.findFirst({
      where: {
        propertyId: property.id,
        OR: [
          { roomNumber: roomParam },
          { id: roomParam },
        ],
      },
      include: {
        roomType: {
          select: {
            id: true,
            name: true,
            baseRate: true,
          },
        },
        checkIns: {
          where: { status: 'CHECKED_IN' },
          orderBy: { checkedInAt: 'desc' },
          take: 1,
          include: {
            guest: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                mobile: true,
              },
            },
          },
        },
      },
    });

    if (!room) {
      return NextResponse.json({
        success: false,
        message: `Room "${roomParam}" not found for property "${property.name}".`,
      }, { status: 404 });
    }

    // 3. Resolve portal & Wi-Fi configuration
    const config = await prisma.roomPortalConfig.findUnique({
      where: { propertyId: property.id },
    });

    // 4. Resolve Active Guest Stay (if checked in)
    const activeCheckIn = room.checkIns?.[0] || null;
    const activeGuest = activeCheckIn?.guest || null;

    // Sanitize phone numbers for tel: and whatsapp:
    const frontDeskPhone = config?.frontDeskPhone || property.phone || '+91-9876543210';
    const emergencyPhone = config?.emergencyPhone || property.phone || '+91-9876543210';
    const cleanPhoneDigits = frontDeskPhone.replace(/[^0-9]/g, '');

    // Format guest greeting if checked in
    const guestGreeting = activeGuest
      ? `${activeGuest.firstName || ''} ${activeGuest.lastName || ''}`.trim()
      : null;

    return NextResponse.json({
      success: true,
      property: {
        id: property.id,
        name: property.name,
        code: property.code,
        address: property.address || '',
        frontDeskPhone,
        emergencyPhone,
        whatsappNumber: cleanPhoneDigits,
        wifiName: config?.wifiName || `${property.name}-Guest-WiFi`,
        wifiPassword: config?.wifiPassword || 'Welcome@Stay',
      },
      room: {
        id: room.id,
        roomNumber: room.roomNumber,
        floor: room.floor || 'Ground',
        status: room.status,
        housekeepingStatus: room.housekeepingStatus,
        isDND: room.isDND,
        roomTypeName: room.roomType?.name || 'Deluxe Room',
      },
      guest: activeGuest
        ? {
            name: guestGreeting,
            mobile: activeGuest.mobile ? `***${activeGuest.mobile.slice(-4)}` : null,
            expectedCheckout: activeCheckIn?.expectedCheckoutAt,
          }
        : null,
    });
  } catch (error: any) {
    console.error('Error fetching room door info:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to load room door details.',
      error: error.message,
    }, { status: 500 });
  }
}
