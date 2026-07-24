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

    const propertyId = propertyIdParam || session.propertyId;
    let targetPropertyId = propertyId;

    if (propertyId && propertyId !== 'all' && propertyId !== 'null' && propertyId !== 'undefined') {
      const prop = await prisma.property.findUnique({
        where: { id: propertyId },
        select: { hmsEnabled: true, type: true, organizationId: true }
      });
      if (prop && !prop.hmsEnabled && prop.type !== 'HOTEL') {
        const hotelProp = await prisma.property.findFirst({
          where: {
            organizationId: prop.organizationId || session.organizationId,
            OR: [
              { hmsEnabled: true },
              { type: 'HOTEL' }
            ]
          },
          select: { id: true }
        });
        if (hotelProp) {
          targetPropertyId = hotelProp.id;
        }
      }
    } else if (session.organizationId) {
      const hotelProp = await prisma.property.findFirst({
        where: {
          organizationId: session.organizationId,
          OR: [
            { hmsEnabled: true },
            { type: 'HOTEL' }
          ]
        },
        select: { id: true }
      });
      if (hotelProp) {
        targetPropertyId = hotelProp.id;
      }
    }

    const rooms = await prisma.room.findMany({
      where: targetPropertyId ? { propertyId: targetPropertyId } : getMultiTenantWhere(session, propertyIdParam),
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
    const { 
      id, 
      status, 
      housekeepingStatus, 
      maintenanceStatus,
      amenities,
      customRate,
      discount,
      gstRate,
      isVIP,
      description,
      roomNumber,
      floor,
      roomTypeId
    } = body;

    if (!id) {
      return apiError(new Error('Room ID is required'), 400);
    }

    const room = await prisma.room.update({
      where: { id },
      data: {
        status: status || undefined,
        housekeepingStatus: housekeepingStatus || undefined,
        maintenanceStatus: maintenanceStatus || undefined,
        amenities: amenities !== undefined ? amenities : undefined,
        customRate: customRate !== undefined ? (customRate ? Number(customRate) : null) : undefined,
        discount: discount !== undefined ? (discount ? Number(discount) : null) : undefined,
        gstRate: gstRate !== undefined ? (gstRate ? Number(gstRate) : 0) : undefined,
        isVIP: isVIP !== undefined ? isVIP : undefined,
        description: description !== undefined ? description : undefined,
        roomNumber: roomNumber || undefined,
        floor: floor || undefined,
        roomTypeId: roomTypeId || undefined,
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
    let propertyId = body.propertyId || await resolveAdminProperty(session, prisma);

    if (propertyId) {
      const prop = await prisma.property.findUnique({
        where: { id: propertyId },
        select: { hmsEnabled: true, type: true, organizationId: true }
      });
      if (prop && !prop.hmsEnabled && prop.type !== 'HOTEL') {
        const hotelProp = await prisma.property.findFirst({
          where: {
            organizationId: prop.organizationId || session.organizationId,
            OR: [
              { hmsEnabled: true },
              { type: 'HOTEL' }
            ]
          },
          select: { id: true }
        });
        if (hotelProp) {
          propertyId = hotelProp.id;
        }
      }
    }

    if (!propertyId) {
      return apiError(new Error('No property context found.'), 400);
    }

    const { 
      roomNumber, 
      roomTypeId, 
      floor,
      amenities,
      customRate,
      discount,
      gstRate,
      isVIP,
      description
    } = body;

    const room = await prisma.room.create({
      data: {
        propertyId,
        roomTypeId,
        roomNumber,
        floor: floor || '1',
        status: 'AVAILABLE',
        housekeepingStatus: 'CLEAN',
        amenities: amenities || null,
        customRate: customRate ? Number(customRate) : null,
        discount: discount ? Number(discount) : null,
        gstRate: gstRate ? Number(gstRate) : 0,
        isVIP: isVIP || false,
        description: description || null,
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
