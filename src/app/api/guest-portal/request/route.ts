import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

const secretKey = process.env.JWT_SECRET || 'super-secret-default-key-change-it-in-prod';
const key = new TextEncoder().encode(secretKey);

export async function POST(request: NextRequest) {
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

    const { type, description } = await request.json();
    if (!type || !description) {
      return NextResponse.json({ success: false, message: 'Type and description are required.' }, { status: 400 });
    }

    // Get guest's active reservation and room
    const guest = await prisma.guest.findUnique({
      where: { id: payload.guestId as string },
      include: {
        reservations: {
          where: { status: { in: ['CONFIRMED', 'CHECKED_IN'] } },
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            rooms: { include: { room: true } }
          }
        }
      }
    });

    if (!guest || !guest.reservations[0]) {
      return NextResponse.json({ success: false, message: 'No active reservation found. You must be checked in to make room requests.' }, { status: 400 });
    }

    const reservation = guest.reservations[0];
    const propertyId = reservation.propertyId;
    const room = reservation.rooms?.[0]?.room;

    if (!room) {
      return NextResponse.json({ success: false, message: 'No room assigned to your booking yet. Please contact the front desk.' }, { status: 400 });
    }

    let createdTask = null;

    if (type === 'CLEANING' || type === 'AMENITIES') {
      // Create Housekeeping Task
      createdTask = await prisma.housekeepingTask.create({
        data: {
          propertyId,
          roomId: room.id,
          taskType: type === 'CLEANING' ? 'ROOM_CLEANING' : 'AMENITIES_REQUEST',
          priority: 'HIGH',
          status: 'PENDING',
          remarks: `Guest Request: ${description}`
        }
      });
    } else {
      // Create Maintenance Ticket
      const ticketNo = `MNT-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
      createdTask = await prisma.maintenanceTicket.create({
        data: {
          propertyId,
          roomId: room.id,
          ticketNo,
          issueType: type === 'MAINTENANCE' ? 'REPAIR' : 'GENERAL_INQUIRY',
          priority: 'MEDIUM',
          description: `Guest Request: ${description}`,
          status: 'OPEN'
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Request submitted successfully! Hotel staff has been notified.',
      data: createdTask
    });
  } catch (error: any) {
    console.error('[Guest Request Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to submit request.' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
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

    // Get guest's active room id
    const guest = await prisma.guest.findUnique({
      where: { id: payload.guestId as string },
      include: {
        reservations: {
          where: { status: { in: ['CONFIRMED', 'CHECKED_IN'] } },
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { rooms: true }
        }
      }
    });

    const roomId = guest?.reservations[0]?.rooms?.[0]?.roomId;
    if (!roomId) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Fetch housekeeping tasks for this room
    const housekeeping = await prisma.housekeepingTask.findMany({
      where: { roomId },
      orderBy: { scheduledAt: 'desc' }
    });

    // Fetch maintenance tickets for this room
    const maintenance = await prisma.maintenanceTicket.findMany({
      where: { roomId },
      orderBy: { openedAt: 'desc' }
    });

    // Format all requests into a unified format
    const requests = [
      ...housekeeping.map((h: any) => ({
        id: h.id,
        type: h.taskType === 'ROOM_CLEANING' ? 'Room Cleaning' : 'Amenities Request',
        description: h.remarks?.replace('Guest Request: ', '') || '',
        status: h.status === 'COMPLETED' ? 'Resolved' : h.status === 'IN_PROGRESS' ? 'In Progress' : 'Pending',
        createdAt: h.scheduledAt || new Date()
      })),
      ...maintenance.map((m: any) => ({
        id: m.id,
        type: m.issueType === 'REPAIR' ? 'Maintenance / Repair' : 'General Inquiry',
        description: m.description?.replace('Guest Request: ', '') || '',
        status: m.status === 'RESOLVED' ? 'Resolved' : m.status === 'IN_PROGRESS' ? 'In Progress' : 'Pending',
        createdAt: m.openedAt
      }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ success: true, data: requests });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
