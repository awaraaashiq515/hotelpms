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

    const products = await prisma.product.findMany({
      where: getMultiTenantWhere(session, propertyIdParam),
      include: { 
        category: true,
        variants: true,
        property: { select: { name: true, city: true } }
      },
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
    if (!session) return apiError(new Error('Unauthorized'), 401);
    
    const body = await request.json();
    const propertyId = body.propertyId || await resolveAdminProperty(session, prisma);
    
    if (!propertyId) {
      return apiError(new Error('No property context found. Please select a property.'), 400);
    }

    const { name, sellingPrice, halfPrice, costPrice, categoryId, productType, sku, barcode, hsnCode, taxRate, taxType, trackInventory, isActive, image, description, menuType, pegSize, pegUnit, stockItemId, variants, bottleSize, bottlePrice, pegPrice } = body;

    const product = await prisma.product.create({
      data: {
        name,
        description: description || null,
        sellingPrice: Number(sellingPrice),
        halfPrice: halfPrice ? Number(halfPrice) : null,
        costPrice: Number(costPrice || 0),
        productType: productType || 'REVENUE',
        sku,
        barcode,
        hsnCode,
        taxRate: taxRate ? Number(taxRate) : null,
        taxType: taxType || 'EXCLUSIVE',
        image,
        trackInventory: trackInventory === true,
        isActive: isActive !== false,
        menuType: menuType || 'RESTAURANT',
        pegSize: pegSize ? Number(pegSize) : null,
        pegUnit: pegUnit || 'ml',
        bottleSize: bottleSize ? Number(bottleSize) : null,
        bottlePrice: bottlePrice ? Number(bottlePrice) : null,
        pegPrice: pegPrice ? Number(pegPrice) : null,
        stockItemId: stockItemId || null,
        propertyId: propertyId,
        categoryId,
        variants: variants && variants.length > 0 ? {
          create: variants.map((v: any) => ({
            name: v.name,
            price: Number(v.price)
          }))
        } : undefined
      },
      include: { variants: true }
    });


    return apiResponse(product, 'Product created', 201);
  } catch (error) {
    return apiError(error);
  }
}
