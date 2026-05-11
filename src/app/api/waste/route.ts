import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, getMultiTenantWhere } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const reason = searchParams.get('reason');
    const status = searchParams.get('status');
    const productId = searchParams.get('productId');
    const query = searchParams.get('query');

    const where: any = {
      ...getMultiTenantWhere(session),
    };

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (reason && reason !== 'all') where.reason = reason;
    if (status && status !== 'all') where.status = status;
    if (productId) where.productId = productId;
    
    if (query) {
      where.OR = [
        { productName: { contains: query } },
        { orderNo: { contains: query } },
        { tableNo: { contains: query } },
        { staffName: { contains: query } },
        { notes: { contains: query } },
      ];
    }

    const wastes = await prisma.waste.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: {
            name: true,
            costPrice: true,
            image: true,
          }
        }
      }
    });

    return apiResponse(wastes);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const { 
      productId, 
      productName, 
      quantity, 
      reason, 
      orderNo, 
      tableNo, 
      staffName, 
      notes,
      costPrice,
      status 
    } = body;

    if (!productName || !quantity || !reason) {
      return apiError(new Error('Product name, quantity, and reason are required'), 400);
    }

    // If costPrice is not provided, try to fetch it from product
    let finalCostPrice = costPrice || 0;
    if (!finalCostPrice && productId) {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { costPrice: true }
      });
      if (product) finalCostPrice = product.costPrice;
    }

    const waste = await prisma.waste.create({
      data: {
        propertyId: session.propertyId!,
        productId,
        productName,
        quantity: parseFloat(quantity),
        reason,
        orderNo,
        tableNo,
        staffName: staffName || (session as any).user?.name || 'Staff',
        notes,
        costPrice: finalCostPrice,
        totalCost: finalCostPrice * parseFloat(quantity),
        status: status || 'RECORDED',
      }
    });

    return apiResponse(waste, 'Waste recorded successfully', 201);
  } catch (error) {
    return apiError(error);
  }
}
