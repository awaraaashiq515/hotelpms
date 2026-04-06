import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const isAdmin = searchParams.get('admin') === 'true';
    
    const galleryModel = (prisma as any).websiteGalleryImage;
    if (!galleryModel) return apiError('Prisma model websiteGalleryImage not found', 500);

    const images = await galleryModel.findMany({
      where: isAdmin ? {} : { isActive: true },
      orderBy: { order: 'asc' },
    });
    return apiResponse(images);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, category, order, isActive } = body;

    const galleryModel = (prisma as any).websiteGalleryImage;
    if (!galleryModel) return apiError('Prisma model websiteGalleryImage not found', 500);

    const image = await galleryModel.create({
      data: {
        url,
        category: category || 'General',
        order: parseInt(order) || 0,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return apiResponse(image, 'Gallery image added successfully', 201);
  } catch (error) {
    return apiError(error);
  }
}
