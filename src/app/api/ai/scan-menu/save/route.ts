import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.propertyId) {
      return apiError(new Error('Unauthorized or no property selected'), 401);
    }

    const body = await request.json();
    const { categories } = body; // Array of { name: string, items: [] }

    if (!categories || !Array.isArray(categories)) {
      return apiError(new Error('Invalid data format: categories array is required'), 400);
    }

    // Run everything in a transaction for safety
    await prisma.$transaction(async (tx: any) => {
      for (const cat of categories) {
        if (!cat.name) continue;

        // 1. Find or Create Category
        let categoryRecord = await tx.category.findFirst({
          where: { name: cat.name, propertyId: session.propertyId! }
        });

        if (!categoryRecord) {
          categoryRecord = await tx.category.create({
            data: { name: cat.name, propertyId: session.propertyId! }
          });
        }

        const categoryId = categoryRecord.id;

        // 2. Create Products
        if (cat.items && Array.isArray(cat.items)) {
          for (const item of cat.items) {
            if (!item.name) continue;

            await tx.product.create({
              data: {
                name: item.name,
                sku: item.sku || null,
                barcode: item.barcode || null,
                sellingPrice: Number(item.sellingPrice || item.price || 0),
                costPrice: Number(item.costPrice || 0),
                productType: item.productType || 'REVENUE_ITEM',
                propertyId: session.propertyId!,
                categoryId: categoryId,
                hsnCode: item.hsnCode || null,
                taxRate: Number(item.taxRate || 5),
                trackInventory: Boolean(item.trackInventory),
                isActive: item.isActive !== undefined ? Boolean(item.isActive) : true,
                availabilityStatus: item.showInMenu !== undefined ? Boolean(item.showInMenu) : true,
                description: item.description || null,
              }
            });
          }
        }
      }
    });

    return apiResponse(null, 'Menu items saved successfully', 201);

  } catch (error) {
    console.error('Batch Save Error:', error);
    return apiError(error);
  }
}
