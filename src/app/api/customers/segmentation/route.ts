import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.organizationId) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const organizationId = session.organizationId;
    
    // 1. Fetch all guests in the organization
    const guests = await prisma.guest.findMany({
      where: { organizationId },
      include: {
        posOrders: {
          where: { status: 'SETTLED' },
          select: { grandTotal: true, createdAt: true },
        },
      },
    });

    const now = new Date();
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setDate(now.getDate() - 60);

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(now.getDate() - 14);

    let updatedCount = 0;

    // 2. Classify and update guests in a transaction/sequentially
    for (const guest of guests) {
      const orders = guest.posOrders || [];
      const totalVisits = orders.length;
      const totalSpend = orders.reduce((sum: number, order: any) => sum + (order.grandTotal || 0), 0);
      
      const lastOrderDate = orders.length > 0 
        ? new Date(Math.max(...orders.map((o: any) => new Date(o.createdAt).getTime()))) 
        : null;

      let calculatedSegment = 'REGULAR';

      if (totalSpend > 10000 || totalVisits > 10) {
        calculatedSegment = 'VIP';
      } else if (lastOrderDate && lastOrderDate < twoMonthsAgo) {
        calculatedSegment = 'INACTIVE';
      } else if (new Date(guest.createdAt) >= fourteenDaysAgo && totalVisits < 2) {
        calculatedSegment = 'NEW';
      } else if (totalSpend > 2000 || totalVisits > 3) {
        calculatedSegment = 'REGULAR';
      } else {
        calculatedSegment = 'NEW';
      }

      if (guest.segment !== calculatedSegment) {
        await prisma.guest.update({
          where: { id: guest.id },
          data: { segment: calculatedSegment },
        });
        updatedCount++;
      }
    }

    return apiResponse({ updatedCount }, `${updatedCount} guest segments updated successfully.`);
  } catch (error) {
    return apiError(error);
  }
}
