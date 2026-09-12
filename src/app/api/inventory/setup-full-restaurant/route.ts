import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, resolveAdminProperty, resolvePropertyIdentifier } from '@/lib/api-utils';
import { getSession } from '@/lib/session';
import { getWTUserFromRequest } from '@/lib/walkie-talkie-auth';
import {
  PREP_RAW_MATERIALS,
  PREP_CATEGORIES,
  PREP_DISHES,
  PREP_MASTER_RECIPES,
} from '@/lib/inventory/prep-list-master';

/**
 * 1-Click Master Restaurant Setup
 * Powered by Restaurant_Prep_List_Full.xlsx:
 * 1. Seeds all 178 kitchen raw items into StockItem with opening stock & units.
 * 2. Seeds all 180 restaurant menu dishes into Product across 13 categories.
 * 3. Pre-maps all 1,648 recipe ingredients into ProductIngredient automatically.
 */
export async function executeSetupFullRestaurant(propertyIdOrCode: string) {
  // Always resolve to the exact Property ID (supports code, id, name, and URL slugs like 'main-hotel')
  const prop = await resolvePropertyIdentifier(propertyIdOrCode);
  if (!prop) {
    throw new Error(`Property not found for identifier: ${propertyIdOrCode}`);
  }
  const propertyId = prop.id;

  // ── 1. Seed Warehouse ──
  let warehouse = await prisma.warehouse.findFirst({ where: { propertyId } });
  if (!warehouse) {
    warehouse = await prisma.warehouse.create({
      data: { propertyId, name: 'Main Kitchen Store', code: 'KIT_MAIN' },
    });
  }

  // ── 2. Seed Raw Stock Items (178 items) ──
  let createdStockCount = 0;
  const stockMap = new Map<string, any>();

  const existingStock = await prisma.stockItem.findMany({ where: { propertyId } });
  for (const item of existingStock) {
    stockMap.set(item.name.toLowerCase().trim(), item);
  }

  for (const item of PREP_RAW_MATERIALS) {
    const key = item.name.toLowerCase().trim();
    let current = stockMap.get(key);
    if (!current) {
      current = await prisma.stockItem.create({
        data: {
          propertyId,
          name: item.name,
          unit: item.unit,
          openingStock: item.openingStock,
          minimumStock: item.minimumStock,
          reorderLevel: item.reorderLevel,
          costPrice: item.costPrice,
          itemType: 'RESTAURANT',
          isActive: true,
        },
      });
      await prisma.stockMovement.create({
        data: {
          propertyId,
          warehouseId: warehouse.id,
          stockItemId: current.id,
          movementType: 'OPENING',
          qtyIn: item.openingStock,
          qtyOut: 0,
          balanceQty: item.openingStock,
          unitCost: item.costPrice,
          referenceModule: 'OPENING_STOCK',
        },
      });
      stockMap.set(key, current);
      createdStockCount++;
    }
  }

  // ── 3. Seed Categories (13 categories) ──
  const categoryMap = new Map<string, string>();
  for (const catName of PREP_CATEGORIES) {
    let category = await prisma.category.findFirst({
      where: { propertyId, name: catName },
    });
    if (!category) {
      category = await prisma.category.create({
        data: { propertyId, name: catName, menuType: 'RESTAURANT' },
      });
    }
    categoryMap.set(catName, category.id);
  }

  // ── 4. Seed Dishes (180 dishes) ──
  let createdProductCount = 0;
  for (const dish of PREP_DISHES) {
    const categoryId = categoryMap.get(dish.category) || Array.from(categoryMap.values())[0];
    let product = await prisma.product.findFirst({
      where: { propertyId, name: dish.dishName },
    });

    if (!product) {
      product = await prisma.product.create({
        data: {
          propertyId,
          categoryId,
          name: dish.dishName,
          sellingPrice: dish.sellingPrice,
          costPrice: dish.costPrice,
          productType: 'RESTAURANT',
          menuType: 'RESTAURANT',
          isVeg: dish.isVeg,
          trackInventory: true,
          isActive: true,
        },
      });
      createdProductCount++;
    }
  }

  // ── 5. Map Recipes for All Products in Property (1,648 mappings) ──
  let mappedRecipeCount = 0;
  const allPropertyProducts = await prisma.product.findMany({
    where: { propertyId, isActive: true },
  });

  for (const prod of allPropertyProducts) {
    const template = PREP_MASTER_RECIPES.find((r) => r.pattern.test(prod.name));
    if (!template) continue;

    const validIngredients: Array<{ stockItemId: string; quantity: number }> = [];
    for (const ing of template.ingredients) {
      const stockItem = stockMap.get(ing.name.toLowerCase().trim());
      if (stockItem) {
        validIngredients.push({
          stockItemId: stockItem.id,
          quantity: ing.quantity,
        });
      }
    }

    if (validIngredients.length > 0) {
      await prisma.$transaction(async (tx) => {
        await tx.productIngredient.deleteMany({ where: { productId: prod.id } });
        await tx.productIngredient.createMany({
          data: validIngredients.map((v) => ({
            productId: prod.id,
            stockItemId: v.stockItemId,
            quantity: v.quantity,
          })),
        });
        await tx.product.update({
          where: { id: prod.id },
          data: { trackInventory: true },
        });
      });
      mappedRecipeCount++;
    }
  }

  return {
    createdStockCount,
    createdProductCount,
    mappedRecipeCount,
    totalProducts: allPropertyProducts.length,
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    let staff: any = null;
    if (!session) staff = await getWTUserFromRequest(request as any);
    if (!session && !staff) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json().catch(() => ({}));
    const rawIdentifier = body.propertyId || body.propertyCode || session?.propertyId || staff?.propertyId;
    const prop = await resolvePropertyIdentifier(rawIdentifier, session);

    if (!prop) return apiError(new Error('Property not found or propertyId is required'), 400);

    const result = await executeSetupFullRestaurant(prop.id);

    return apiResponse(
      result,
      `Restaurant Setup Complete: Provisioned ${result.createdStockCount} raw items, ${result.createdProductCount} dishes across 13 categories, and pre-mapped recipes for ${result.mappedRecipeCount} dishes!`,
      201,
    );
  } catch (error) {
    return apiError(error);
  }
}
