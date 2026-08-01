import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getWTUserFromRequest } from '@/lib/walkie-talkie-auth';

export async function GET(request: NextRequest) {
  const staff = await getWTUserFromRequest(request as any);
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

    return NextResponse.json({ success: true, data: rooms });
  } catch (err) {
    console.error('[housekeeping-rooms]', err);
    return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const staff = await getWTUserFromRequest(request as any);
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
