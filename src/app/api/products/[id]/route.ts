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
      include: { category: true },
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
      description
    } = body;

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        description: description !== undefined ? (description || null) : undefined,
        sellingPrice: Number(sellingPrice),
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
        categoryId,
      },
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
