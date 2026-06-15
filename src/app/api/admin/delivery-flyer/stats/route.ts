import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { apiResponse, apiError } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const { searchParams } = new URL(request.url);
    const propertyCode = searchParams.get('propertyCode');

    // Find property by code if provided, otherwise fallback to session.propertyId
    let propertyId = session.propertyId;
    if (propertyCode) {
      const slugifyInline = (str: string) => str.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
      let prop = await prisma.property.findFirst({
        where: {
          OR: [
            { code: propertyCode },
            { id: propertyCode }
          ]
        }
      });
      
      if (!prop) {
        const allProps = await prisma.property.findMany();
        prop = allProps.find((p: any) => slugifyInline(p.name || '') === propertyCode) || null;
      }

      if (prop) {
        propertyId = prop.id;
      }
    }

    if (!propertyId) {
      return apiError(new Error('Property ID is required'), 400);
    }

    // Fetch all pos orders where orderNo starts with "DEL-"
    const orders = await prisma.posOrder.findMany({
      where: {
        propertyId,
        orderNo: {
          startsWith: 'DEL-'
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        },
        deliveryRider: true,
        driver: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const totalBills = orders.length;
    const totalRevenue = orders
      .filter((o: any) => o.status === 'SETTLED' || o.status === 'COMPLETED')
      .reduce((sum: number, o: any) => sum + (o.grandTotal || 0), 0);
    
    const activeBillsCount = orders
      .filter((o: any) => !['SETTLED', 'COMPLETED', 'CANCELLED'].includes(o.status))
      .reduce((sum: number, o: any) => sum + 1, 0);

    return apiResponse({
      orders,
      stats: {
        totalBills,
        totalRevenue,
        activeBillsCount
      }
    }, 'Delivery flyer stats fetched successfully');
  } catch (error) {
    console.error('Delivery flyer stats error:', error);
    return apiError(error);
  }
}
