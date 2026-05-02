import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ propertyCode: string; qrToken: string }> }
) {
  try {
    const { propertyCode, qrToken } = await params;

    // 1. Find Property
    const property = await prisma.property.findFirst({
      where: { 
        code: propertyCode.toLowerCase()
      },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        address: true,
        phone: true,
        upiId: true,
        upiName: true,
      },
    });

    if (!property) {
      return apiError(new Error('Property not found'), 404);
    }

    // 2. Find Table
    const table = await prisma.table.findFirst({
      where: {
        OR: [
          { qrToken: qrToken },
          { id: qrToken }
        ],
        propertyId: property.id,
      },
    });

    if (!table) {
      return apiError(new Error('Table not found or invalid QR code'), 404);
    }

    // 3. Fetch Active Orders for this table (Dine-in)
    const activeOrders = await prisma.posOrder.findMany({
      where: {
        restaurantTableId: table.id,
        status: { in: ['OPEN', 'PENDING', 'PLACED', 'IN_KITCHEN', 'READY', 'SERVED', 'BILL_PRINTED'] },
        orderType: 'DINE_IN',
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      },
      include: {
        items: {
          include: {
            product: {
              select: { name: true, image: true }
            },
            kotItems: {
              select: { status: true, quantity: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // 4. Fetch Menu (Categories + Products)
    const categories = await prisma.category.findMany({
      where: {
        propertyId: property.id,
        isActive: true,
      },
      include: {
        products: {
          where: {
            isActive: true,
            availabilityStatus: true,
          },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });

    // Filter out categories with no products
    const menu = categories.filter((cat: any) => cat.products.length > 0);

    return apiResponse({
      property,
      table: {
        id: table.id,
        name: table.name,
      },
      activeOrders,
      menu,
    });
  } catch (error) {
    return apiError(error);
  }
}
