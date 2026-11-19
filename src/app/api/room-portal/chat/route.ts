import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';
import { DEFAULT_KNOWLEDGE, processHotelConciergeQuery } from '@/lib/ai-concierge-engine';

const secretKey = process.env.JWT_SECRET || 'super-secret-default-key-change-it-in-prod';
const key = new TextEncoder().encode(secretKey);

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function authenticateGuest(request: NextRequest) {
  const authHeader = request.headers.get('Authorization') || '';
  let token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    token = request.nextUrl.searchParams.get('token');
  }

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
    if (payload.type !== 'ROOM_PORTAL') return null;

    const { guestId, roomId, reservationId, propertyId } = payload as any;

    const [guest, room, reservation] = await Promise.all([
      prisma.guest.findUnique({
        where: { id: guestId },
        select: { id: true, firstName: true, lastName: true, mobile: true },
      }),
      prisma.room.findUnique({
        where: { id: roomId },
        select: { id: true, roomNumber: true, floor: true },
      }),
      prisma.reservation.findUnique({
        where: { id: reservationId },
        select: {
          id: true,
          bookingNo: true,
          status: true,
          propertyId: true,
          property: { select: { id: true, name: true, brandName: true } },
        },
      }),
    ]);

    if (!guest || !room || !reservation) return null;

    return { guest, room, reservation, propertyId: reservation.propertyId || propertyId };
  } catch {
    return null;
  }
}

// ── GET: Fetch chat history for this room / reservation ──────────
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateGuest(request);
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { guest, room, reservation, propertyId } = auth;

    // Fetch all messages logged for this room or reservation
    const logs = await prisma.roomPortalActivityLog.findMany({
      where: {
        action: { in: ['GUEST_MESSAGE', 'CONCIERGE_REPLY'] },
        OR: [
          { roomId: room.id },
          { reservationId: reservation.id },
          { details: { contains: `"roomNumber":"${room.roomNumber}"` } },
        ],
      },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    const messages = logs.map((log) => {
      let parsed: any = {};
      try {
        parsed = log.details ? JSON.parse(log.details) : {};
      } catch {
        parsed = { content: log.details };
      }

      return {
        id: parsed.id || log.id,
        role: log.action === 'GUEST_MESSAGE' ? 'user' : 'assistant',
        content: parsed.content || '',
        time: parsed.time || new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        senderName: parsed.senderName || (log.action === 'GUEST_MESSAGE' ? guest.firstName : 'AI Concierge'),
        action: parsed.action,
        quickReplies: parsed.quickReplies,
        isStaffReply: parsed.isStaffReply || false,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        roomNumber: room.roomNumber,
        guestName: `${guest.firstName} ${guest.lastName || ''}`.trim(),
        messages,
      },
    });
  } catch (err: any) {
    console.error('[Room Portal Chat GET Error]:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// ── POST: Guest sends a message ──────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateGuest(request);
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, language = 'en' } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ success: false, message: 'Message is required' }, { status: 400 });
    }

    const { guest, room, reservation, propertyId } = auth;
    const guestFullName = `${guest.firstName} ${guest.lastName || ''}`.trim();
    const currentTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Log guest message to database
    const userMsgObj = {
      id: `msg-guest-${Date.now()}`,
      role: 'user',
      content: message.trim(),
      time: currentTimeStr,
      senderName: guestFullName,
      roomNumber: room.roomNumber,
    };

    await prisma.roomPortalActivityLog.create({
      data: {
        propertyId,
        roomId: room.id,
        guestId: guest.id,
        reservationId: reservation.id,
        action: 'GUEST_MESSAGE',
        details: JSON.stringify(userMsgObj),
      },
    });

    // 2. Create high-priority hotel Notification so staff is immediately alerted
    await prisma.notification.create({
      data: {
        propertyId,
        title: `Guest Message · Room ${room.roomNumber}`,
        message: `${guestFullName}: "${message.trim().slice(0, 90)}"`,
        type: 'GUEST_CHAT',
        status: 'UNREAD',
        priority: 'HIGH',
        metadata: JSON.stringify({
          roomNumber: room.roomNumber,
          guestName: guestFullName,
          roomId: room.id,
          reservationId: reservation.id,
          content: message.trim(),
          time: currentTimeStr,
        }),
      },
    }).catch(() => {});

    // 3. Process with AI Concierge Engine to generate intelligent reply
    const aiResult = processHotelConciergeQuery(
      message.trim(),
      guest.firstName,
      room.roomNumber,
      DEFAULT_KNOWLEDGE,
      language
    );

    const aiMsgObj = {
      id: `msg-ai-${Date.now()}`,
      role: 'assistant',
      content: aiResult.reply,
      time: currentTimeStr,
      action: aiResult.action,
      quickReplies: aiResult.quickReplies,
      roomNumber: room.roomNumber,
      senderName: 'AI Concierge',
    };

    // 4. Save AI Reply to activity log
    await prisma.roomPortalActivityLog.create({
      data: {
        propertyId,
        roomId: room.id,
        guestId: guest.id,
        reservationId: reservation.id,
        action: 'CONCIERGE_REPLY',
        details: JSON.stringify(aiMsgObj),
      },
    });

    // 5. If automated task action was generated (e.g. housekeeping dispatch or maintenance), create task in DB
    if (aiResult.action) {
      if (aiResult.action.type === 'HOUSEKEEPING_CREATED') {
        await prisma.housekeepingTask.create({
          data: {
            propertyId,
            roomId: room.id,
            taskType: 'GUEST_REQUEST',
            priority: 'NORMAL',
            status: 'PENDING',
            notes: `Guest Portal Concierge: ${message.trim()} (Room ${room.roomNumber} - ${guestFullName})`,
            source: 'ROOM_PORTAL_CONCIERGE',
          },
        }).catch(() => {});
      } else if (aiResult.action.type === 'MAINTENANCE_CREATED') {
        await prisma.maintenanceTicket.create({
          data: {
            propertyId,
            roomId: room.id,
            ticketNo: aiResult.action.ticketNo || `MNT-${room.roomNumber}-${Math.floor(100 + Math.random() * 900)}`,
            issueType: 'ROOM_ISSUE',
            priority: 'URGENT',
            description: `Guest Portal Ticket: ${message.trim()} (Room ${room.roomNumber} - ${guestFullName})`,
            raisedBy: 'Guest Portal AI',
            status: 'OPEN',
          },
        }).catch(() => {});
      }
    }

    return NextResponse.json({
      success: true,
      userMessage: userMsgObj,
      aiMessage: aiMsgObj,
    });
  } catch (err: any) {
    console.error('[Room Portal Chat POST Error]:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
