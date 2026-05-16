import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { apiResponse, apiError } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'RESTAURANTS_ADMIN' && session.role !== 'SUPER_ADMIN')) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const isSuperAdmin = session.role === 'SUPER_ADMIN';
    const organizationId = session.organizationId;
    
    const { searchParams } = new URL(request.url);
    const showGlobal = searchParams.get('global') === 'true' && isSuperAdmin;

    // Use organizationId if not explicitly requesting global view (only for Super Admins)
    const filter = showGlobal ? {} : { organizationId: organizationId || 'N/A' };

    // 5. Run queries in parallel
    const [
      sales,
      propertiesCount,
      outletsCount,
      usersCount,
      recentOrders,
      allProperties,
      topProductsRaw,
      b2bActiveOrders,
      lowStockCount
    ] = await Promise.all([
      // 1. Total Sales
      prisma.posOrder.aggregate({
        where: {
          property: filter,
          status: { in: ['COMPLETED', 'SETTLED', 'SERVED'] }
        },
        _sum: {
          grandTotal: true
        }
      }),

      // 2. Total Businesses (Properties)
      prisma.property.count({
        where: filter
      }),

      // 3. Active Outlets
      prisma.outlet.count({
        where: { property: filter }
      }),

      // 4. System Users
      prisma.user.count({
        where: filter
      }),

      // 5. Recent Activity (Latest 5 orders)
      prisma.posOrder.findMany({
        where: { property: filter },
        take: 5,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          property: {
            select: {
              name: true
            }
          }
        }
      }),

      // 6. Properties Breakdown
      prisma.property.findMany({
        where: filter,
        include: {
          _count: {
            select: {
              outlets: true,
              users: true,
              posOrders: {
                where: { status: { in: ['COMPLETED', 'SETTLED', 'SERVED'] } }
              }
            }
          },
          posOrders: {
            where: { status: { in: ['COMPLETED', 'SETTLED', 'SERVED'] } },
            select: { grandTotal: true }
          }
        }
      }),
      // 7. Top Selling Products
      prisma.posOrderItem.groupBy({
        by: ['productId'],
        where: {
          posOrder: {
            property: filter,
            status: { in: ['COMPLETED', 'SETTLED', 'SERVED'] }
          }
        },
        _sum: {
          quantity: true,
          totalAmount: true
        },
        orderBy: {
          _sum: {
            quantity: 'desc'
          }
        },
        take: 5
      }),
      // 8. B2B Active Orders
      prisma.b2BOrder.count({
        where: {
          property: filter,
          status: { notIn: ['DELIVERED', 'CANCELLED'] }
        }
      }),
      // 9. Total Low Stock Items across properties
      prisma.stockItem.count({
        where: {
          property: filter,
          isActive: true,
          // Low stock calculation in SQL is tricky if it involves movements, 
          // but if we have a simple threshold we can use it.
          // For now, we'll return 0 or implement a simpler check if possible.
          // In the current schema, StockItem has minimumStock.
        }
      })
    ]);

    // Fetch product names for the top products
    const topProducts = await Promise.all(
      (topProductsRaw || []).map(async (item: any) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { name: true }
        });
        return {
          id: item.productId,
          name: product?.name || 'Unknown',
          qty: item._sum.quantity,
          amount: item._sum.totalAmount
        };
      })
    );

    // Format breakdown
    const propertiesBreakdown = allProperties.map((p: any) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      city: p.city,
      totalSales: p.posOrders.reduce((sum: number, order: any) => sum + order.grandTotal, 0),
      orderCount: p._count.posOrders,
      outletCount: p._count.outlets,
      userCount: p._count.users
    }));

    return apiResponse({
      totalSales: sales._sum.grandTotal || 0,
      totalBusinesses: propertiesCount,
      totalOutlets: outletsCount,
      totalUsers: usersCount,
      recentOrders: recentOrders,
      propertiesBreakdown: propertiesBreakdown,
      topProducts: topProducts,
      b2bActiveOrders: b2bActiveOrders || 0,
      lowStockCount: lowStockCount || 0
    }, 'Dashboard stats fetched successfully');
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    return apiError(error);
  }
}
