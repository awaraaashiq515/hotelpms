import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, getMultiTenantWhere } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);
    const where = getMultiTenantWhere(session);

    const [tasks, rooms] = await Promise.all([
      prisma.housekeepingTask.findMany({
        where,
        include: { room: { include: { roomType: { select: { name: true } } } } },
        orderBy: { scheduledAt: 'asc' },
        take: 100,
      }),
      prisma.room.findMany({ where, select: { id: true, roomNumber: true, housekeepingStatus: true } }),
    ]);

    const stats = {
      total:      tasks.length,
      pending:    tasks.filter((t: any) => t.status === 'PENDING').length,
      inProgress: tasks.filter((t: any) => t.status === 'IN_PROGRESS').length,
      done:       tasks.filter((t: any) => t.status === 'DONE' || t.status === 'COMPLETED').length,
      byPriority: {
        URGENT: tasks.filter((t: any) => t.priority === 'URGENT').length,
        HIGH:   tasks.filter((t: any) => t.priority === 'HIGH').length,
        NORMAL: tasks.filter((t: any) => t.priority === 'NORMAL').length,
        LOW:    tasks.filter((t: any) => t.priority === 'LOW').length,
      },
      byType: tasks.reduce((acc: any, t: any) => {
        acc[t.taskType] = (acc[t.taskType] || 0) + 1;
        return acc;
      }, {}),
    };

    return apiResponse({ tasks, stats, dirtyRooms: rooms.filter((r: any) => r.housekeepingStatus === 'DIRTY') });
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const { id, status, priority, assignedTo, remarks } = body;

    if (!id) return apiError(new Error('Task ID required'), 400);

    const task = await prisma.housekeepingTask.update({
      where: { id },
      data: {
        status:     status     || undefined,
        priority:   priority   || undefined,
        assignedTo: assignedTo || undefined,
        remarks:    remarks    || undefined,
        startedAt:  status === 'IN_PROGRESS' ? new Date() : undefined,
        completedAt: (status === 'DONE' || status === 'COMPLETED') ? new Date() : undefined,
      },
      include: { room: true },
    });

    return apiResponse(task, 'Task updated');
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const { roomId, taskType, priority, assignedTo, scheduledAt, remarks } = body;

    const where = getMultiTenantWhere(session);
    const propertyId = (where as any).propertyId;

    if (!propertyId || !roomId || !taskType) {
      return apiError(new Error('propertyId, roomId, taskType are required'), 400);
    }

    const task = await prisma.housekeepingTask.create({
      data: { propertyId, roomId, taskType, priority: priority || 'NORMAL', assignedTo, scheduledAt: scheduledAt ? new Date(scheduledAt) : null, remarks, status: 'PENDING' },
      include: { room: true },
    });

    return apiResponse(task, 'Task created', 201);
  } catch (error) {
    return apiError(error);
  }
}
