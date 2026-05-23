import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, apiResponse } from '@/lib/api-utils';

// Public API — no session required, only valid tablet ID is needed.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Verify the tablet exists and is active
    const tablet = await prisma.tablet.findUnique({
      where: { id },
      include: { property: true },
    });

    if (!tablet) return apiError(new Error('Tablet not found'), 404);

    const propertyId = tablet.propertyId;

    // Fetch all data in parallel using the tablet's propertyId
    const [products, categories, tables, waiter, websiteSettings, activeOrders] = await Promise.all([
      prisma.product.findMany({
        where: { propertyId, isActive: true },
        include: { category: true, variants: true },
        orderBy: { name: 'asc' },
      }),
      prisma.category.findMany({
        where: { propertyId, isActive: true },
        orderBy: { name: 'asc' },
      }),
      prisma.table.findMany({
        where: { propertyId },
        include: { floor: true },
        orderBy: { name: 'asc' },
      }),
      tablet.waiterId
        ? prisma.staffMember.findUnique({
            where: { id: tablet.waiterId },
            select: { id: true, name: true, designation: true },
          })
        : null,
      prisma.websiteSettings.findFirst({
        select: { logoUrl: true }
      }),
      prisma.posOrder.findMany({
        where: {
          propertyId,
          status: { in: ['KOT_RUNNING', 'IN_KITCHEN', 'READY', 'PAYMENT_AWAITING_APPROVAL'] }
        },
        select: {
          id: true,
          status: true,
          restaurantTableId: true,
          tableNo: true,
          orderNo: true,
          table: {
            select: { name: true }
          }
        },
        orderBy: { updatedAt: 'desc' }
      })
    ]);

    return apiResponse({ products, categories, tables, property: tablet.property, waiter, websiteSettings, activeOrders });
  } catch (error) {
    return apiError(error);
  }
}
