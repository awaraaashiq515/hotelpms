import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const roomModel = (prisma as any).websiteRoom;
    if (!roomModel) return apiError('Prisma model websiteRoom not found in client', 500);

    const room = await roomModel.findFirst({
      where: {
        OR: [
          { id },
          { slug: id }
        ]
      },
      include: {
        images: { orderBy: { order: 'asc' } },
        amenities: true,
      },
    });
    
    if (!room) return apiError('Room not found', 404);
    return apiResponse(room);
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, description, price, capacity, type, isActive, order, images, amenities } = body;

    const roomModel = (prisma as any).websiteRoom;
    if (!roomModel) return apiError('Prisma model websiteRoom not found in client', 500);

    const existing = await roomModel.findUnique({ where: { id } });
    if (!existing) return apiError('Room not found', 404);

    const room = await roomModel.update({
      where: { id },
      data: {
        name,
        description,
        price: parseFloat(price) || 0,
        capacity: parseInt(capacity) || 0,
        type,
        isActive: isActive !== undefined ? isActive : true,
        order: parseInt(order) || 0,
        // For simplicity, we'll replace images and amenities
        images: {
          deleteMany: {},
          create: images?.map((url: string, index: number) => ({
            url,
            order: index,
          })) || [],
        },
        amenities: {
          set: [], // Disconnect all
          connectOrCreate: amenities?.map((name: string) => ({
            where: { name },
            create: { name },
          })) || [],
        },
      },
      include: {
        images: true,
        amenities: true,
      },
    });

    return apiResponse(room, 'Room updated successfully');
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const roomModel = (prisma as any).websiteRoom;
    if (!roomModel) return apiError('Prisma model websiteRoom not found in client', 500);

    await roomModel.delete({
      where: { id },
    });
    return apiResponse(null, 'Room deleted successfully');
  } catch (error) {
    return apiError(error);
  }
}
