import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, getMultiTenantWhere, resolveAdminProperty } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const propertyIdParam = searchParams.get('propertyId');

    const rooms = await prisma.room.findMany({
      where: getMultiTenantWhere(session, propertyIdParam),
      include: {
        roomType: true,
      },
      orderBy: { roomNumber: 'asc' },
    });

    return apiResponse(rooms);
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const { id, status, housekeepingStatus, maintenanceStatus } = body;

    if (!id) {
      return apiError(new Error('Room ID is required'), 400);
    }

    const room = await prisma.room.update({
      where: { id },
      data: {
        status: status || undefined,
        housekeepingStatus: housekeepingStatus || undefined,
        maintenanceStatus: maintenanceStatus || undefined,
      },
      include: { roomType: true },
    });

    return apiResponse(room, 'Room status updated successfully');
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const propertyId = body.propertyId || await resolveAdminProperty(session, prisma);

    if (!propertyId) {
      return apiError(new Error('No property context found.'), 400);
    }

    const { roomNumber, roomTypeId, floor } = body;

    const room = await prisma.room.create({
      data: {
        propertyId,
        roomTypeId,
        roomNumber,
        floor: floor || '1',
        status: 'AVAILABLE',
        housekeepingStatus: 'CLEAN',
      },
      include: { roomType: true },
    });

    return apiResponse(room, 'Room created successfully', 201);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return apiError(new Error('Room ID is required'), 400);
    }

    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        checkIns: {
          where: { status: 'ACTIVE' }
        }
      }
    });

    if (!room) {
      return apiError(new Error('Room not found'), 404);
    }

    if (room.status === 'OCCUPIED' || room.checkIns.length > 0) {
      return apiError(new Error('Cannot delete an occupied room. Check out the guest first.'), 400);
    }

    await prisma.room.delete({
      where: { id }
    });

    return apiResponse(null, 'Room deleted successfully');
  } catch (error) {
    return apiError(error);
  }
}
