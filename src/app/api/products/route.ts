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

    const products = await prisma.product.findMany({
      where: getMultiTenantWhere(session, propertyIdParam),
      include: { category: true },
      orderBy: { name: 'asc' },
    });

    return apiResponse(products);
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
    const { name, sellingPrice, costPrice, categoryId, productType, sku, barcode, hsnCode, taxRate, trackInventory, isActive, image } = body;

    const product = await prisma.product.create({
      data: {
        name,
        sellingPrice: Number(sellingPrice),
        costPrice: Number(costPrice || 0),
        productType: productType || 'REVENUE',
        sku,
        barcode,
        hsnCode,
        taxRate: taxRate ? Number(taxRate) : null,
        image,
        trackInventory: trackInventory === true,
        isActive: isActive !== false,
        propertyId: session.propertyId,
        categoryId,
      },
    });

    return apiResponse(product, 'Product created', 201);
  } catch (error) {
    return apiError(error);
  }
}
