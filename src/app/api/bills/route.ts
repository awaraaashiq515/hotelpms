import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, getMultiTenantWhere } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date'); // YYYY-MM-DD
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const multiTenantWhere = getMultiTenantWhere(session);

    // Build date filter
    let dateFilter: any = {};
    if (date) {
      const dayStart = new Date(date + 'T00:00:00');
      const dayEnd = new Date(date + 'T23:59:59.999');
      dateFilter = { createdAt: { gte: dayStart, lte: dayEnd } };
    } else if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          gte: new Date(startDate + 'T00:00:00'),
          lte: new Date(endDate + 'T23:59:59.999'),
        },
      };
    }

    const orders = await prisma.posOrder.findMany({
      where: {
        ...multiTenantWhere,
        status: 'SETTLED',
        ...dateFilter,
      },
      include: {
        property: { select: { name: true, city: true } },
        items: {
          include: { product: { select: { id: true, name: true, sku: true } } },
        },
        staffMember: true,
        driver: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Compute aggregates
    const totalOrders = orders.length;
    const totalSubtotal = orders.reduce((s, o) => s + (o.subtotal || 0), 0);
    const totalTax = orders.reduce((s, o) => s + (o.taxAmount || 0), 0);
    const totalDiscount = orders.reduce((s, o) => s + (o.discountAmount || 0), 0);
    const totalGrand = orders.reduce((s, o) => s + (o.grandTotal || 0), 0);

    return apiResponse({
      orders,
      summary: {
        totalOrders,
        totalSubtotal,
        totalTax,
        totalDiscount,
        totalGrand,
        averageOrder: totalOrders > 0 ? totalGrand / totalOrders : 0,
      },
    }, 'Bills fetched successfully');
  } catch (error) {
    return apiError(error);
  }
}
