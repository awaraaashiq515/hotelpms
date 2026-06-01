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

    const includeProducts = searchParams.get('includeProducts') === 'true';

    const categories = await prisma.category.findMany({
      where: getMultiTenantWhere(session, propertyIdParam),
      include: {
        _count: {
          select: { products: true }
        },
        ...(includeProducts ? { products: true } : {})
      },
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
    if (!session) return apiError(new Error('Unauthorized'), 401);
    
    const body = await request.json();
    const propertyId = body.propertyId || await resolveAdminProperty(session, prisma);
    
    if (!propertyId) {
      return apiError(new Error('No property context found. Please select a property.'), 400);
    }

    const { name, description, isActive, menuType, parentId } = body;

    const category = await prisma.category.create({
      data: {
        name,
        description,
        isActive: isActive !== undefined ? isActive : true,
        menuType: menuType || 'RESTAURANT',
        parentId: parentId || null,
        propertyId: propertyId,
      },
    });

    return apiResponse(category, 'Category created', 201);
  } catch (error) {
    return apiError(error);
  }
}
