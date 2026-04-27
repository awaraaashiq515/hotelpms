import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

// GET: Get ingredients for a product
// POST: Update ingredients for a product
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) return apiError(new Error('productId required'), 400);

    const ingredients = await prisma.productIngredient.findMany({
      where: { productId },
      include: {
        stockItem: {
          select: {
            name: true,
            unit: true,
          }
        }
      }
    });

    return apiResponse(ingredients);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const { productId, ingredients } = body; // ingredients: Array<{stockItemId, quantity}>

    if (!productId) return apiError(new Error('productId required'), 400);

    // Use transaction to update ingredients
    const result = await prisma.$transaction(async (tx) => {
      // 1. Delete existing ingredients
      await tx.productIngredient.deleteMany({
        where: { productId }
      });

      // 2. Create new ones if any
      if (ingredients && ingredients.length > 0) {
        await tx.productIngredient.createMany({
          data: ingredients.map((ing: any) => ({
            productId,
            stockItemId: ing.stockItemId,
            quantity: Number(ing.quantity),
          }))
        });
      }

      // 3. Update product trackInventory flag
      await tx.product.update({
        where: { id: productId },
        data: {
          trackInventory: ingredients && ingredients.length > 0
        }
      });

      return await tx.productIngredient.findMany({
        where: { productId },
        include: { stockItem: true }
      });
    });

    return apiResponse(result, 'Recipe updated successfully');
  } catch (error) {
    return apiError(error);
  }
}
