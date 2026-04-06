import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { category, order, isActive } = body;

    const galleryModel = (prisma as any).websiteGalleryImage;
    if (!galleryModel) return apiError('Prisma model websiteGalleryImage not found', 500);

    const image = await galleryModel.update({
      where: { id },
      data: {
        category,
        order: parseInt(order) || 0,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return apiResponse(image, 'Gallery image updated successfully');
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    const galleryModel = (prisma as any).websiteGalleryImage;
    if (!galleryModel) return apiError('Prisma model websiteGalleryImage not found', 500);

    await galleryModel.delete({
      where: { id },
    });
    return apiResponse(null, 'Gallery image deleted successfully');
  } catch (error) {
    return apiError(error);
  }
}
