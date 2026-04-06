import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const isAdmin = searchParams.get('admin') === 'true';
    
    const experiences = await prisma.websiteExperience.findMany({
      where: isAdmin ? {} : { isActive: true },
      orderBy: { order: 'asc' },
    });
    return apiResponse(experiences);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const experience = await prisma.websiteExperience.create({
      data: {
        title: body.title,
        description: body.description,
        imageUrl: body.imageUrl,
        order: body.order || 0,
        isActive: body.isActive !== undefined ? body.isActive : true,
      },
    });
    return apiResponse(experience, 'Experience created successfully', 201);
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) return apiError('ID is required', 400);
    
    const experience = await prisma.websiteExperience.update({
      where: { id: body.id },
      data: {
        title: body.title,
        description: body.description,
        imageUrl: body.imageUrl,
        order: body.order,
        isActive: body.isActive,
      },
    });
    return apiResponse(experience, 'Experience updated successfully');
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return apiError('ID is required', 400);
    
    await prisma.websiteExperience.delete({
      where: { id },
    });
    return apiResponse(null, 'Experience deleted successfully');
  } catch (error) {
    return apiError(error);
  }
}
