import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getWTUserFromRequest } from '@/lib/walkie-talkie-auth';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  let staff = await getWTUserFromRequest(request as any);
  if (!staff) {
    const session = await getSession();
    if (session && session.id) {
      staff = await prisma.user.findUnique({
        where: { id: session.id },
        include: { role: true, property: true },
      });
    }
  }

  if (!staff) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId') || staff.propertyId || '';

    if (!propertyId) {
      return NextResponse.json({ error: 'No property found for this user' }, { status: 400 });
    }

    const rooms = await (prisma as any).room.findMany({
      where: { propertyId },
      orderBy: [{ floor: 'asc' }, { roomNumber: 'asc' }],
      include: {
        roomType: { select: { name: true } },
        housekeepingTasks: {
          where: { status: { not: 'COMPLETED' } },
          orderBy: { scheduledAt: 'asc' },
          take: 5,
        },
        checkIns: {
          where: { status: 'CHECKED_IN' },
          include: {
            guest: { select: { firstName: true, lastName: true } },
          },
          take: 1,
        },
      },
    });

    // Filter rooms by assignment:
    // - Show rooms that are assigned to THIS staff member
    // - Show rooms that are NOT assigned to anyone (unassigned)
    // - Hide rooms assigned to other staff
    const staffName = (staff as any).fullName || (staff as any).name || '';
    const userRole = (staff as any).role?.name?.toUpperCase() || '';
    const isManagerOrAdmin = userRole.includes('ADMIN') || userRole.includes('MANAGER') || userRole === 'OWNER';

    const filteredRooms = rooms.filter((room: any) => {
      if (isManagerOrAdmin && searchParams.get('all') === 'true') {
        return true;
      }
      const ms: string | null = room.maintenanceStatus || null;
      if (!ms || !ms.startsWith('ASSIGNED:')) {
        // Not assigned to anyone — show to everyone
        return true;
      }
      const assignedName = ms.replace('ASSIGNED:', '').trim();
      if (!assignedName || assignedName.toLowerCase() === 'unassigned') {
        return true;
      }
      // Show only if assigned to this staff member (case-insensitive)
      return staffName && assignedName.toLowerCase() === staffName.toLowerCase();
    });

    return NextResponse.json({ success: true, data: filteredRooms });
  } catch (err) {
    console.error('[housekeeping-rooms]', err);
    return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  let staff = await getWTUserFromRequest(request as any);
  if (!staff) {
    const session = await getSession();
    if (session && session.id) {
      staff = await prisma.user.findUnique({
        where: { id: session.id },
        include: { role: true, property: true },
      });
    }
  }

  if (!staff) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { roomId, housekeepingStatus, taskId, taskStatus } = await request.json();

    if (taskId && taskStatus) {
      const updateData: any = { status: taskStatus };
      if (taskStatus === 'IN_PROGRESS') updateData.startedAt = new Date();
      if (taskStatus === 'COMPLETED') updateData.completedAt = new Date();

      const task = await (prisma as any).housekeepingTask.update({
        where: { id: taskId },
        data: updateData,
      });
      return NextResponse.json({ success: true, data: task });
    }

    if (roomId && housekeepingStatus) {
      const room = await (prisma as any).room.update({
        where: { id: roomId },
        data: { housekeepingStatus },
      });
      return NextResponse.json({ success: true, data: room });
    }

    return NextResponse.json({ error: 'Missing roomId or taskId' }, { status: 400 });
  } catch (err) {
    console.error('[housekeeping-rooms PATCH]', err);
    return NextResponse.json({ error: 'Failed to update room' }, { status: 500 });
  }
}
