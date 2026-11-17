import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolvePropertyIdentifier } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

/**
 * POST /api/room-door/request
 * Public endpoint called when guest outside a room triggers an action:
 * - LOCKED_OUT: Guest is locked out / key left inside / key not working
 * - KEY_ASSISTANCE: Needs duplicate key or keycard re-programmed
 * - CALL_RECEPTION: Guest requests an immediate callback to their mobile
 * - HOUSEKEEPING: Request room cleaning, extra towels, water bottles, or DND
 * - LUGGAGE: Request bellboy to room
 * - EMERGENCY_SOS: Urgent security / medical SOS
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      propertyCode,
      propertyId,
      roomNumber,
      roomId,
      type = 'KEY_ASSISTANCE',
      reason = '',
      notes = '',
      guestName = '',
      guestPhone = '',
    } = body;

    if (!roomNumber && !roomId) {
      return NextResponse.json({ success: false, message: 'Room number or ID is required.' }, { status: 400 });
    }

    // 1. Resolve property
    let property: any = null;
    if (propertyCode || propertyId) {
      property = await resolvePropertyIdentifier(propertyCode || propertyId);
    }
    if (!property) {
      property = await prisma.property.findFirst({
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!property) {
      return NextResponse.json({ success: false, message: 'Property not found.' }, { status: 404 });
    }

    // 2. Resolve room
    const room: any = await (prisma as any).room.findFirst({
      where: {
        propertyId: property.id,
        OR: [
          { roomNumber: roomNumber || '' },
          { id: roomId || '' },
        ],
      },
      include: {
        roomType: true,
        checkIns: {
          where: { status: 'CHECKED_IN' },
          orderBy: { checkedInAt: 'desc' },
          take: 1,
          include: { guest: true },
        },
      },
    });

    if (!room) {
      return NextResponse.json({
        success: false,
        message: `Room "${roomNumber || roomId}" not found.`,
      }, { status: 404 });
    }

    const activeGuest = room.checkIns?.[0]?.guest;
    const finalGuestName = guestName.trim() || (activeGuest ? `${activeGuest.firstName} ${activeGuest.lastName || ''}`.trim() : 'Guest');
    const finalGuestPhone = guestPhone.trim() || activeGuest?.mobile || 'Not Provided';
    const displayRoom = room.roomNumber;

    // 3. Configure title & message based on request type
    let title = '';
    let message = '';
    let priority = 'HIGH';
    let typeCode = 'DOOR_ASSISTANCE';

    switch (type) {
      case 'LOCKED_OUT':
        title = `🚨 LOCKED OUT: Room ${displayRoom}`;
        message = `Guest ${finalGuestName} is locked outside Room ${displayRoom}. Situation: ${reason || 'Left Key Inside / Key Not Opening'}. Contact: ${finalGuestPhone}. Please dispatch master key runner immediately!`;
        priority = 'URGENT';
        break;

      case 'KEY_ASSISTANCE':
        title = `🔑 Key Help: Room ${displayRoom}`;
        message = `Guest ${finalGuestName} outside Room ${displayRoom} needs key assistance. Reason: ${reason || notes || 'Key issue'}. Contact: ${finalGuestPhone}.`;
        priority = 'HIGH';
        break;

      case 'CALL_RECEPTION':
        title = `📞 Callback Request: Room ${displayRoom}`;
        message = `Guest ${finalGuestName} outside Room ${displayRoom} requested an immediate phone callback at ${finalGuestPhone}. Notes: ${notes || reason || 'Waiting at room door'}.`;
        priority = 'HIGH';
        break;

      case 'HOUSEKEEPING':
        title = `🧹 Door Service: Room ${displayRoom}`;
        message = `Guest outside Room ${displayRoom} requested housekeeping/amenities: ${reason || notes || 'Service requested'}. Contact: ${finalGuestPhone}.`;
        priority = 'MEDIUM';
        typeCode = 'HOUSEKEEPING';
        break;

      case 'LUGGAGE':
        title = `🧳 Bellboy Request: Room ${displayRoom}`;
        message = `Guest ${finalGuestName} outside Room ${displayRoom} requested luggage/bellboy assistance. Contact: ${finalGuestPhone}.`;
        priority = 'MEDIUM';
        break;

      case 'EMERGENCY_SOS':
        title = `🚨 EMERGENCY SOS: Room ${displayRoom}`;
        message = `URGENT SOS triggered from outside Room ${displayRoom}! Guest: ${finalGuestName}, Phone: ${finalGuestPhone}. Reason: ${reason || notes || 'Emergency assistance needed'}.`;
        priority = 'URGENT';
        break;

      default:
        title = `🛎️ Door Assistance: Room ${displayRoom}`;
        message = `Guest ${finalGuestName} outside Room ${displayRoom} requested assistance: ${reason || notes}. Contact: ${finalGuestPhone}.`;
        priority = 'HIGH';
    }

    // 4. Create Notification in Database
    const metadata = {
      propertyId: property.id,
      propertyCode: property.code,
      roomId: room.id,
      roomNumber: room.roomNumber,
      floor: room.floor || 'Ground',
      requestType: type,
      guestName: finalGuestName,
      guestPhone: finalGuestPhone,
      reason: reason || notes,
      timestamp: new Date().toISOString(),
      link: '/hotel/rooms',
    };

    const notification = await prisma.notification.create({
      data: {
        propertyId: property.id,
        title,
        message,
        type: typeCode,
        priority,
        metadata: JSON.stringify(metadata),
      },
    });

    // 5. Broadcast to real-time notification socket server (ports 5001 / 5002)
    try {
      const socketPorts = [5002, 5001];
      for (const port of socketPorts) {
        try {
          await fetch(`http://127.0.0.1:${port}/api/broadcast-notification`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              propertyId: property.id,
              event: 'door_assistance_alert',
              payload: {
                id: notification.id,
                title,
                message,
                type: typeCode,
                priority,
                roomNumber: room.roomNumber,
                guestName: finalGuestName,
                guestPhone: finalGuestPhone,
                createdAt: notification.createdAt,
              },
            }),
            signal: AbortSignal.timeout(1000),
          });
          break;
        } catch {}
      }
    } catch {}

    // 6. Return friendly response to guest on phone
    return NextResponse.json({
      success: true,
      message: type === 'LOCKED_OUT'
        ? `Reception alerted! A staff member is on the way to Room ${displayRoom} with a master key.`
        : type === 'CALL_RECEPTION'
        ? `Callback requested! Front Desk will call ${finalGuestPhone} shortly.`
        : `Your request has been received by Front Desk for Room ${displayRoom}.`,
      alertId: notification.id,
      roomNumber: room.roomNumber,
      priority,
    });
  } catch (error: any) {
    console.error('Error processing room door request:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to submit door assistance request. Please call reception directly.',
      error: error.message,
    }, { status: 500 });
  }
}
