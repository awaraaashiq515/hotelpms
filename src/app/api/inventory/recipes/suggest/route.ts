import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, resolveAdminProperty, resolvePropertyIdentifier } from '@/lib/api-utils';
import { getSession } from '@/lib/session';
import { getWTUserFromRequest } from '@/lib/walkie-talkie-auth';
import { PREP_MASTER_RECIPES, PrepIngredient } from '@/lib/inventory/prep-list-master';

export interface RecipeTemplate {
  pattern: RegExp;
  dishName: string;
  category?: string;
  sellingPrice?: number;
  costPrice?: number;
  isVeg?: boolean;
  ingredients: PrepIngredient[];
}

// Full 180-dish master recipes imported from Excel Restaurant_Prep_List_Full.xlsx
const MASTER_RECIPES: RecipeTemplate[] = PREP_MASTER_RECIPES;

/**
 * GET /api/inventory/recipes/suggest?dishName=...&propertyId=...
 *
 * Suggests standard recipe ingredients for a dish name using the comprehensive
 * 180-dish / 1,648-ingredient library from Restaurant_Prep_List_Full.xlsx.
 * If any raw stock item does not exist in property's StockItem inventory,
 * it auto-creates it so it can be immediately mapped!
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    let staff: any = null;
    if (!session) staff = await getWTUserFromRequest(request as any);
    if (!session && !staff) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const dishName = searchParams.get('dishName');
    let rawPropertyId = searchParams.get('propertyId') || searchParams.get('propertyCode') || session?.propertyId || staff?.propertyId;
    const prop = await resolvePropertyIdentifier(rawPropertyId, session);
    const propertyId = prop?.id;

    if (!dishName) return apiError(new Error('dishName query parameter is required'), 400);
    if (!propertyId) return apiError(new Error('propertyId is required'), 400);

    // 1. Find matching template from 180-dish prep master
    const template = MASTER_RECIPES.find((r) => r.pattern.test(dishName));
    if (!template) {
      return apiResponse({ matched: false, dishName, ingredients: [] }, 'No preset recipe found for this dish');
    }

    // 2. Fetch existing stock items for this property
    const existingStockItems = await prisma.stockItem.findMany({
      where: { propertyId, isActive: true },
    });
    const stockMap = new Map<string, typeof existingStockItems[0]>();
    for (const item of existingStockItems) {
      stockMap.set(item.name.toLowerCase().trim(), item);
    }

    // 3. For each ingredient in the template, ensure StockItem exists
    const resolvedIngredients = [];
    for (const ing of template.ingredients) {
      let stockItem = stockMap.get(ing.name.toLowerCase().trim());

      // If missing from property inventory, auto-create it with standard unit and cost price!
      if (!stockItem) {
        stockItem = await prisma.stockItem.create({
          data: {
            propertyId,
            name: ing.name,
            unit: ing.unit,
            openingStock: ing.unit === 'PC' ? 50 : 25,
            minimumStock: ing.unit === 'PC' ? 10 : 5,
            reorderLevel: ing.unit === 'PC' ? 20 : 10,
            costPrice: ing.costPrice,
            itemType: 'RESTAURANT',
            isActive: true,
          },
        });
        stockMap.set(ing.name.toLowerCase().trim(), stockItem);
      }

      resolvedIngredients.push({
        stockItemId: stockItem.id,
        itemName: stockItem.name,
        unit: stockItem.unit,
        costPrice: stockItem.costPrice,
        quantity: ing.quantity,
      });
    }

    return apiResponse({
      matched: true,
      dishName: template.dishName,
      category: template.category,
      sellingPrice: template.sellingPrice,
      costPrice: template.costPrice,
      isVeg: template.isVeg,
      ingredients: resolvedIngredients,
    });
  } catch (error) {
    return apiError(error);
  }
}
