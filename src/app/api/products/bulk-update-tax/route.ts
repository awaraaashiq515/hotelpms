import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.propertyId) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const { taxType } = await request.json();
    if (!['EXCLUSIVE', 'INCLUSIVE', 'EXEMPT'].includes(taxType)) {
      return apiError(new Error('Invalid tax type'), 400);
    }

    const result = await prisma.$transaction(async (tx: any) => {
      // Update all products for the property
      const updatedProducts = await tx.product.updateMany({
        where: {
          propertyId: session.propertyId as string
        },
        data: {
          taxType: taxType
        }
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          propertyId: session.propertyId as string,
          userId: session.id,
          moduleName: 'PRODUCT',
          actionType: 'BULK_UPDATE_TAX',
          recordId: 'ALL',
          newData: JSON.stringify({ taxType, count: updatedProducts.count }),
        }
      });

      return updatedProducts;
    });

    return apiResponse(result, `Successfully updated ${result.count} products to ${taxType} tax type`);
  } catch (error) {
    return apiError(error);
  }
}
