import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, getMultiTenantWhere, resolveAdminProperty } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const thresholdHours = searchParams.get('thresholdHours');
    
    let where = getMultiTenantWhere(session);
    
    // For admins, let's expand the search to all properties in their organization
    // to ensure no counter requests are missed.
    if (session.role === 'RESTAURANTS_ADMIN' && session.organizationId) {
      where = { property: { organizationId: session.organizationId } };
    } else if (session.role === 'SUPER_ADMIN') {
      where = {};
    }

    // Apply auto-clear threshold if provided
    const thresholdDate = thresholdHours 
      ? new Date(Date.now() - parseInt(thresholdHours) * 60 * 60 * 1000)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days safety limit if disabled

    console.log('[Counter API] Session:', { role: session.role, org: session.organizationId });
    console.log('[Counter API] Threshold:', thresholdDate.toISOString());

    const orders = await prisma.posOrder.findMany({
      where: {
        ...where,
        createdAt: { gte: thresholdDate },
        OR: [
          { status: { in: ['OPEN', 'PENDING', 'PLACED', 'IN_KITCHEN', 'PREPARING', 'READY', 'SERVED', 'BILL_PRINTED', 'KOT_RUNNING', 'PAYMENT_AWAITING_APPROVAL'] } },
          { paymentRequested: true }
        ],
        status: { not: 'SETTLED' }
      },
      include: {
        items: { 
          include: { 
            product: { select: { name: true, image: true } } 
          } 
        },
        guest: { select: { id: true, firstName: true, lastName: true, mobile: true } },
        table: { select: { id: true, name: true } },
        parkingSlot: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    console.log(`[Counter API] Found ${orders.length} orders`);

    return apiResponse(orders, 'Counter pending orders fetched');
  } catch (error) {
    return apiError(error);
  }
}
