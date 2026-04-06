import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, getMultiTenantWhere } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const propertyIdParam = searchParams.get('propertyId');

    const categories = await prisma.category.findMany({
      where: getMultiTenantWhere(session, propertyIdParam),
      orderBy: { name: 'asc' },
    });

    return apiResponse(categories);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.propertyId) {
      return apiError(new Error('Unauthorized or no property selected'), 401);
    }

    const body = await request.json();
    const { name, description, isActive } = body;

    const category = await prisma.category.create({
      data: {
        name,
        description,
        isActive: isActive !== undefined ? isActive : true,
        propertyId: session.propertyId,
      },
    });

    return apiResponse(category, 'Category created', 201);
  } catch (error) {
    return apiError(error);
  }
}
