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

    const roomTypes = await prisma.roomType.findMany({
      where: getMultiTenantWhere(session, propertyIdParam),
      include: {
        rooms: true,
      },
      orderBy: { name: 'asc' },
    });

    return apiResponse(roomTypes);
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

    const { name, code, baseRate, maxOccupancy } = body;

    const roomType = await prisma.roomType.create({
      data: {
        propertyId,
        name,
        code,
        baseRate: Number(baseRate),
        maxOccupancy: Number(maxOccupancy),
      },
    });

    return apiResponse(roomType, 'Room Type created successfully', 201);
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
      return apiError(new Error('Room Type ID is required'), 400);
    }

    const roomsCount = await prisma.room.count({
      where: { roomTypeId: id }
    });

    if (roomsCount > 0) {
      return apiError(new Error('Cannot delete room type as it is currently assigned to existing rooms. Delete the rooms first.'), 400);
    }

    await prisma.roomType.delete({
      where: { id }
    });

    return apiResponse(null, 'Room Type deleted successfully');
  } catch (error) {
    return apiError(error);
  }
}
