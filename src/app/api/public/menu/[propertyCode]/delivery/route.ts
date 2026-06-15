import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';

/**
 * Public API: Fetch menu for Home Delivery ordering.
 * No table QR needed — just the property code.
 * GET /api/public/menu/[propertyCode]/delivery?phone=XXX
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ propertyCode: string }> }
) {
  try {
    const { propertyCode } = await params;
    const { searchParams } = new URL(request.url);
    const guestPhone = searchParams.get('phone') || undefined;

    // 1. Find property by code
    const property = await prisma.property.findUnique({
      where: { code: propertyCode },
      select: {
        id: true,
        name: true,
        code: true,
        logoUrl: true,
        brandName: true,
        address: true,
        phone: true,
        upiId: true,
        upiName: true,
        upiLimit: true,
        upiReceivedToday: true,
        upiId2: true,
        upiName2: true,
        upiLimit2: true,
        upiReceivedToday2: true,
        lastUpiResetDate: true,
        showBarInQrMenu: true,
        showCafeInQrMenu: true,
        deliveryEnabled: true,
        showDeliveryInQrMenu: true,
        latitude: true,
        longitude: true,
      }
    });

    if (!property) {
      return apiError(new Error('Restaurant not found'), 404);
    }

    // 2. UPI daily rotation logic
    const now = new Date();
    const lastReset = property.lastUpiResetDate ? new Date(property.lastUpiResetDate) : null;
    const isDifferentDay = !lastReset ||
      lastReset.getDate() !== now.getDate() ||
      lastReset.getMonth() !== now.getMonth() ||
      lastReset.getFullYear() !== now.getFullYear();

    let activeUpiId = property.upiId;
    let activeUpiName = property.upiName;

    if (isDifferentDay) {
      await prisma.property.update({
        where: { id: property.id },
        data: { upiReceivedToday: 0, upiReceivedToday2: 0, lastUpiResetDate: now }
      });
      (property as any).upiReceivedToday = 0;
      (property as any).upiReceivedToday2 = 0;
    }

    if (property.upiId && (property.upiReceivedToday ?? 0) >= (property.upiLimit ?? 999999)) {
      if (property.upiId2 && (property.upiReceivedToday2 ?? 0) < (property.upiLimit2 ?? 999999)) {
        activeUpiId = property.upiId2;
        activeUpiName = property.upiName2;
      }
    }

    const propertyOut = { ...property, upiId: activeUpiId, upiName: activeUpiName };

    // 3. Fetch active delivery orders for this phone (last 24h)
    let activeOrders: any[] = [];
    if (guestPhone) {
      activeOrders = await prisma.posOrder.findMany({
        where: {
          propertyId: property.id,
          OR: [
            { deliveryPhone: guestPhone, orderType: { in: ['DELIVERY', 'TAKEAWAY'] } },
            { guest: { mobile: guestPhone }, orderType: { in: ['DELIVERY', 'TAKEAWAY'] } },
          ],
          status: {
            in: ['OPEN', 'PENDING', 'PLACED', 'ACCEPTED', 'IN_KITCHEN', 'READY',
                 'SERVED', 'BILL_PRINTED', 'KOT_RUNNING', 'PAYMENT_AWAITING_APPROVAL', 'SETTLED', 'COMPLETED', 'CANCELLED', 'OUT_FOR_DELIVERY']
          },
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        },
        include: {
          guest: true,
          driver: true,
          deliveryRider: true,
          items: {
            include: {
              product: { select: { name: true, image: true } },
              kotItems: { select: { status: true, quantity: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    // 4. Fetch menu
    const excludedMenuTypes: string[] = [];
    if (!property.showBarInQrMenu) excludedMenuTypes.push('BAR');
    if (!property.showCafeInQrMenu) excludedMenuTypes.push('CAFE');

    const categories = await prisma.category.findMany({
      where: {
        propertyId: property.id,
        isActive: true,
        ...(excludedMenuTypes.length > 0 ? { menuType: { notIn: excludedMenuTypes } } : {}),
      },
      include: {
        products: {
          where: {
            isActive: true,
            availabilityStatus: true,
            ...(excludedMenuTypes.length > 0 ? { menuType: { notIn: excludedMenuTypes } } : {}),
          },
          include: { variants: true },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });

    const menu = categories.filter((cat: any) => cat.products.length > 0);

    const deliveryZones = await prisma.deliveryZone.findMany({
      where: { propertyId: property.id, isActive: true },
      orderBy: { createdAt: 'asc' }
    });

    return apiResponse({ property: propertyOut, activeOrders, menu, deliveryZones });
  } catch (error) {
    console.error('Delivery Menu API Error:', error);
    return apiError(error);
  }
}
