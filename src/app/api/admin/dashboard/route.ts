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
      allProperties
    ] = await Promise.all([
      // 1. Total Sales
      prisma.posOrder.aggregate({
        where: {
          property: filter,
          status: 'COMPLETED'
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
                where: { status: 'COMPLETED' }
              }
            }
          },
          posOrders: {
            where: { status: 'COMPLETED' },
            select: { grandTotal: true }
          }
        }
      })
    ]);

    // Format breakdown
    const propertiesBreakdown = allProperties.map(p => ({
      id: p.id,
      name: p.name,
      type: p.type,
      city: p.city,
      totalSales: p.posOrders.reduce((sum, order) => sum + order.grandTotal, 0),
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
      propertiesBreakdown: propertiesBreakdown
    }, 'Dashboard stats fetched successfully');
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    return apiError(error);
  }
}
