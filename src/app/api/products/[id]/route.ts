import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const product = await prisma.product.findUnique({
      where: { id },
      include: { 
        category: true,
        variants: true
      },
    });

    if (!product) return apiError(new Error('Product not found'), 404);

    return apiResponse(product);
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const { 
      name, 
      sellingPrice, 
      costPrice, 
      categoryId, 
      productType, 
      sku, 
      barcode, 
      hsnCode,
      taxRate,
      taxType,
      trackInventory, 
      isActive,
      image,
      description,
      menuType,
      pegSize,
      pegUnit,
      bottleSize,
      bottlePrice,
      pegPrice,
      stockItemId,
      halfPrice,
      variants,
      isVeg,
      mealTimes
    } = body;

    // Use transaction to sync variants
    const product = await prisma.$transaction(async (tx: any) => {
      // 1. Delete existing variants
      await tx.productVariant.deleteMany({
        where: { productId: id }
      });

      // 2. Update product and create new variants
      return await tx.product.update({
        where: { id },
        data: {
          name,
          description: description !== undefined ? (description || null) : undefined,
          sellingPrice: Number(sellingPrice),
          halfPrice: halfPrice !== undefined ? (halfPrice ? Number(halfPrice) : null) : undefined,
          costPrice: Number(costPrice || 0),
          productType,
          sku,
          barcode,
          hsnCode,
          taxRate: taxRate !== undefined ? (taxRate === null ? null : Number(taxRate)) : undefined,
          taxType: taxType !== undefined ? taxType : undefined,
          image,
          trackInventory: trackInventory === true,
          isActive: isActive !== false,
          isVeg: isVeg !== undefined ? (isVeg === true) : undefined,
          mealTimes: mealTimes !== undefined ? mealTimes : undefined,
          menuType: menuType !== undefined ? menuType : undefined,
          pegSize: pegSize !== undefined ? (pegSize ? Number(pegSize) : null) : undefined,
          pegUnit: pegUnit !== undefined ? pegUnit : undefined,
          bottleSize: bottleSize !== undefined ? (bottleSize ? Number(bottleSize) : null) : undefined,
          bottlePrice: bottlePrice !== undefined ? (bottlePrice ? Number(bottlePrice) : null) : undefined,
          pegPrice: pegPrice !== undefined ? (pegPrice ? Number(pegPrice) : null) : undefined,
          stockItemId: stockItemId !== undefined ? (stockItemId || null) : undefined,
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
    });


    return apiResponse(product, 'Product updated');
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    // Check for dependencies before deletion
    const dependencies = await Promise.all([
      prisma.invoiceItem.count({ where: { productId: id } }),
      prisma.posOrderItem.count({ where: { productId: id } }),
      prisma.kotItem.count({ where: { productId: id } }),
    ]);

    const hasDependencies = dependencies.some((count: number) => count > 0);

    if (hasDependencies) {
      return apiError(
        new Error('Cannot delete product because it has sales history or KOT records. Please mark it as "Inactive" instead.'),
        400
      );
    }

    await prisma.product.delete({
      where: { id },
    });

    return apiResponse(null, 'Product deleted');
  } catch (error) {
    return apiError(error);
  }
}
