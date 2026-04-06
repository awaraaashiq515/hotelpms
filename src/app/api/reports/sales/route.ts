import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return apiError(new Error('Start and End dates are required (YYYY-MM-DD)'), 400);
    }

    const dateFilter = {
      createdAt: {
        gte: new Date(startDate + 'T00:00:00'),
        lte: new Date(endDate + 'T23:59:59.999'),
      },
      status: 'SETTLED',
      propertyId: session.propertyId!,
    };

    // 1. Fetch all items from settled orders in the date range
    const orderItems = await prisma.posOrderItem.findMany({
      where: {
        posOrder: dateFilter
      },
      include: {
        product: {
          include: { category: true }
        }
      }
    });

    // 2. Aggregate by Product
    const productSales: Record<string, any> = {};
    const categorySales: Record<string, any> = {};
    let totalSales = 0;

    orderItems.forEach((item) => {
      const pId = item.productId;
      const pName = item.product?.name || 'Unknown Item';
      const cId = item.product?.category?.id || 'others';
      const cName = item.product?.category?.name || 'Others';
      const amount = item.totalAmount;
      const qty = item.quantity;

      // Product grouping
      if (!productSales[pId]) {
        productSales[pId] = { id: pId, name: pName, qty: 0, amount: 0, category: cName };
      }
      productSales[pId].qty += qty;
      productSales[pId].amount += amount;

      // Category grouping
      if (!categorySales[cId]) {
        categorySales[cId] = { id: cId, name: cName, qty: 0, amount: 0 };
      }
      categorySales[cId].qty += qty;
      categorySales[cId].amount += amount;

      totalSales += amount;
    });

    // Sort by amount descending
    const products = Object.values(productSales).sort((a, b) => b.amount - a.amount);
    const categories = Object.values(categorySales).sort((a, b) => b.amount - a.amount);

    return apiResponse({
      summary: {
        totalSales,
        productCount: products.length,
        categoryCount: categories.length,
      },
      products,
      categories
    }, 'Sales report fetched successfully');
  } catch (error) {
    console.error('Sales Report Error:', error);
    return apiError(error);
  }
}
