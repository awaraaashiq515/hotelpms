import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';

// Last modified: 2026-03-17T12:35:00

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const isAdmin = searchParams.get('admin') === 'true';
    
    console.log('Prisma keys:', Object.keys(prisma).filter(k => !k.startsWith('_')));
    
    if (!prisma.websiteRoom) {
      console.error('prisma.websiteRoom is UNDEFINED');
      return apiError(new Error('Prisma model websiteRoom not found'));
    }

    const rooms = await prisma.websiteRoom.findMany({
      where: isAdmin ? {} : { isActive: true },
      include: {
        images: { orderBy: { order: 'asc' } },
        amenities: true,
      },
      orderBy: { order: 'asc' },
    });
    return apiResponse(rooms);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, price, capacity, type, isActive, order, images, amenities } = body;

    console.log('POST Prisma keys:', Object.keys(prisma).filter(k => !k.startsWith('_')));
    
    // Fallback access if object is weird
    const roomModel = (prisma as any).websiteRoom;
    if (!roomModel) {
      console.error('prisma.websiteRoom is UNDEFINED in POST');
      // Try to re-instantiate as a last resort or just error out specifically
      return apiError(new Error('Prisma model websiteRoom not found in client. Please regenerate prisma client.'));
    }

    // Create unique slug
    let slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    const existing = await roomModel.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 5)}`;
    }

    const room = await roomModel.create({
      data: {
        name,
        slug,
        description,
        price: parseFloat(price) || 0,
        capacity: parseInt(capacity) || 0,
        type,
        isActive: isActive !== undefined ? isActive : true,
        order: parseInt(order) || 0,
        images: {
          create: images?.map((url: string, index: number) => ({
            url,
            order: index,
          })) || [],
        },
        amenities: {
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

    return apiResponse(room, 'Room created successfully', 201);
  } catch (error) {
    console.error('POST Error:', error);
    return apiError(error);
  }
}
