import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { id } = await params;

    // 1. Fetch guest details, self-referrals, loyalty logs, coupons, and orders
    const guest = await prisma.guest.findUnique({
      where: { id },
      include: {
        referredBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        referrals: {
          select: { id: true, firstName: true, lastName: true, createdAt: true, loyaltyPoints: true },
        },
        loyaltyLogs: {
          orderBy: { createdAt: 'desc' },
        },
        coupons: {
          where: { isActive: true, expiryDate: { gte: new Date() } },
        },
        posOrders: {
          orderBy: { createdAt: 'desc' },
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (!guest) {
      return apiError(new Error('Guest profile not found'), 404);
    }

    // 2. Calculate profile metrics
    const settledOrders = guest.posOrders.filter((o: any) => o.status === 'SETTLED');
    const totalVisits = settledOrders.length;
    const totalSpend = settledOrders.reduce((sum: number, o: any) => sum + (o.grandTotal || 0), 0);
    const averageOrderValue = totalVisits > 0 ? totalSpend / totalVisits : 0;

    // 3. Calculate favorite dishes
    const dishCounts: Record<string, { id: string; name: string; count: number; totalRevenue: number }> = {};
    
    settledOrders.forEach((order: any) => {
      order.items.forEach((item: any) => {
        if (!item.product) return;
        const productId = item.productId;
        const productName = item.product.name;
        
        if (!dishCounts[productId]) {
          dishCounts[productId] = {
            id: productId,
            name: productName,
            count: 0,
            totalRevenue: 0,
          };
        }
        dishCounts[productId].count += item.quantity;
        dishCounts[productId].totalRevenue += item.quantity * item.unitPrice;
      });
    });

    const favoriteDishes = Object.values(dishCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // top 5 dishes

    // 4. Clean order payload to send back to client
    const visitHistory = guest.posOrders.map((order: any) => ({
      id: order.id,
      orderNo: order.orderNo,
      orderType: order.orderType,
      status: order.status,
      grandTotal: order.grandTotal,
      createdAt: order.createdAt,
      itemSummary: order.items.map((i: any) => `${i.product?.name || 'Item'} x${i.quantity}`).join(', '),
    }));

    return apiResponse({
      guest: {
        id: guest.id,
        firstName: guest.firstName,
        lastName: guest.lastName,
        mobile: guest.mobile,
        email: guest.email,
        gender: guest.gender,
        nationality: guest.nationality,
        address: guest.address,
        segment: guest.segment,
        birthDate: guest.birthDate,
        loyaltyPoints: guest.loyaltyPoints,
        referralCode: guest.referralCode,
        referredBy: guest.referredBy,
        createdAt: guest.createdAt,
      },
      metrics: {
        totalSpend,
        totalVisits,
        averageOrderValue,
      },
      favoriteDishes,
      visitHistory,
      loyaltyLogs: guest.loyaltyLogs,
      referrals: guest.referrals,
      coupons: guest.coupons,
    });
  } catch (error) {
    return apiError(error);
  }
}
