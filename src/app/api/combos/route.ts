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

    const combos = await prisma.combo.findMany({
      where: getMultiTenantWhere(session, propertyIdParam),
      include: {
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: { name: 'asc' },
    });

    return apiResponse(combos);
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

    const { name, description, price, isActive, items, image } = body;

    const combo = await prisma.combo.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        isActive: isActive !== undefined ? isActive : true,
        image,
        propertyId: propertyId,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: parseInt(item.quantity) || 1
          }))
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    return apiResponse(combo, 'Combo created', 201);
  } catch (error) {
    return apiError(error);
  }
}
