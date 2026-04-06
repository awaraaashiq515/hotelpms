import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const section = searchParams.get('section');
    
    const sliders = await prisma.websiteSlider.findMany({
      where: section ? { section, isActive: true } : { isActive: true },
      orderBy: { order: 'asc' },
    });
    
    return apiResponse(sliders);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const slider = await prisma.websiteSlider.create({
      data: {
        section: body.section || 'HERO',
        type: body.type || 'IMAGE',
        url: body.url,
        title: body.title,
        subtitle: body.subtitle,
        order: body.order || 0,
        isActive: body.isActive !== undefined ? body.isActive : true,
      },
    });
    return apiResponse(slider, 'Slider created successfully', 201);
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) return apiError('ID is required', 400);
    
    const slider = await prisma.websiteSlider.update({
      where: { id: body.id },
      data: {
        section: body.section,
        type: body.type,
        url: body.url,
        title: body.title,
        subtitle: body.subtitle,
        order: body.order,
        isActive: body.isActive,
      },
    });
    return apiResponse(slider, 'Slider updated successfully');
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return apiError('ID is required', 400);
    
    await prisma.websiteSlider.delete({
      where: { id },
    });
    return apiResponse(null, 'Slider deleted successfully');
  } catch (error) {
    return apiError(error);
  }
}
