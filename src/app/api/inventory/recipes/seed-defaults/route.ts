import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, resolveAdminProperty, resolvePropertyIdentifier } from '@/lib/api-utils';
import { getSession } from '@/lib/session';
import { getWTUserFromRequest } from '@/lib/walkie-talkie-auth';
import { PREP_MASTER_RECIPES } from '@/lib/inventory/prep-list-master';

/**
 * POST /api/inventory/recipes/seed-defaults
 * Body: { propertyId?: string, overwrite?: boolean }
 *
 * Automatically maps realistic recipes (ingredients + quantities) from the
 * 180-dish / 1,648-ingredient library against the property's StockItems.
 */
export async function POST(request: NextRequest) {
  try {
    let session = await getSession();
    let staff: any = null;
    if (!session) {
      staff = await getWTUserFromRequest(request as any);
    }
    if (!session && !staff) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json().catch(() => ({}));
    let rawPropertyId = body.propertyId || body.propertyCode || session?.propertyId || staff?.propertyId;
    const prop = await resolvePropertyIdentifier(rawPropertyId, session);
    const propertyId = prop?.id;

    if (!propertyId) {
      return apiError(new Error('propertyId is required'), 400);
    }

    const overwrite = Boolean(body.overwrite);

    // 1. Fetch all stock items for this property to build name -> id map
    const stockItems = await prisma.stockItem.findMany({
      where: { propertyId, isActive: true },
      select: { id: true, name: true, unit: true, costPrice: true },
    });

    if (stockItems.length === 0) {
      return apiError(
        new Error('No stock items found for this property. Please seed default inventory items first.'),
        400,
      );
    }

    // Build case-insensitive stock items dictionary
    const stockMap = new Map<string, typeof stockItems[0]>();
    for (const item of stockItems) {
      stockMap.set(item.name.toLowerCase().trim(), item);
    }

    // 2. Fetch all products for this property
    const products = await prisma.product.findMany({
      where: { propertyId, isActive: true },
      include: {
        ingredients: true,
      },
    });

    if (products.length === 0) {
      return apiError(
        new Error('No products found for this property. Please create or seed products first.'),
        400,
      );
    }

    let mappedCount = 0;
    let skippedCount = 0;
    const mappedProducts: Array<{ name: string; ingredientsCount: number }> = [];

    // 3. For each product, test recipe rules against PREP_MASTER_RECIPES
    for (const prod of products) {
      // If already has ingredients and overwrite is false, skip
      if (prod.ingredients && prod.ingredients.length > 0 && !overwrite) {
        skippedCount++;
        continue;
      }

      // Find matching template
      const template = PREP_MASTER_RECIPES.find((r) => r.pattern.test(prod.name));
      if (!template) continue;

      // Resolve stock items for this rule
      const validIngredients: Array<{ stockItemId: string; quantity: number }> = [];
      for (const ing of template.ingredients) {
        const found = stockMap.get(ing.name.toLowerCase().trim());
        if (found) {
          validIngredients.push({
            stockItemId: found.id,
            quantity: ing.quantity,
          });
        }
      }

      if (validIngredients.length > 0) {
        await prisma.$transaction(async (tx) => {
          // Delete existing ingredients
          await tx.productIngredient.deleteMany({
            where: { productId: prod.id },
          });

          // Insert new ingredients
          await tx.productIngredient.createMany({
            data: validIngredients.map((v) => ({
              productId: prod.id,
              stockItemId: v.stockItemId,
              quantity: v.quantity,
            })),
          });

          // Update product
          await tx.product.update({
            where: { id: prod.id },
            data: {
              trackInventory: true,
            },
          });
        });

        mappedCount++;
        mappedProducts.push({
          name: prod.name,
          ingredientsCount: validIngredients.length,
        });
      }
    }

    return apiResponse(
      {
        totalProducts: products.length,
        mappedCount,
        skippedCount,
        mappedProducts,
      },
      `Successfully mapped recipes for ${mappedCount} products (${skippedCount} already had recipes)`,
      200,
    );
  } catch (error) {
    return apiError(error);
  }
}
