import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ propertyCode: string; qrToken: string }> }
) {
  try {
    const { propertyCode, qrToken } = await params;

    // Find the parking slot by qrToken or id
    const slotData = await (prisma as any).parkingSlot.findFirst({
      where: {
        OR: [{ qrToken }, { id: qrToken }],
      },
      include: {
        property: {
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
            showBarInQrMenu: true,
          },
        },
      },
    });

    if (!slotData) {
      return apiError(new Error('Invalid or expired QR link'), 404);
    }

    if (slotData.property.code.toLowerCase() !== propertyCode.toLowerCase()) {
      return apiError(new Error('Invalid property code for this QR'), 400);
    }

    let property = { ...slotData.property };

    // UPI rotation logic
    const now = new Date();
    const lastReset = property.lastUpiResetDate ? new Date(property.lastUpiResetDate) : null;
    const isDifferentDay =
      !lastReset ||
      lastReset.getDate() !== now.getDate() ||
      lastReset.getMonth() !== now.getMonth() ||
      lastReset.getFullYear() !== now.getFullYear();

    if (isDifferentDay) {
      await prisma.property.update({
        where: { id: property.id },
        data: { upiReceivedToday: 0, upiReceivedToday2: 0, lastUpiResetDate: now },
      });
      property.upiReceivedToday = 0;
      property.upiReceivedToday2 = 0;
    }

    let activeUpiId = property.upiId;
    let activeUpiName = property.upiName;
    if (property.upiId && property.upiReceivedToday !== null && property.upiLimit !== null) {
      if (property.upiReceivedToday >= property.upiLimit) {
        if (property.upiId2 && property.upiReceivedToday2 < property.upiLimit2) {
          activeUpiId = property.upiId2;
          activeUpiName = property.upiName2;
        }
      }
    }
    (property as any).upiId = activeUpiId;
    (property as any).upiName = activeUpiName;

    const slot = { id: slotData.id, name: slotData.name };

    // Active parking orders for this slot
    const activeOrders = await (prisma as any).posOrder.findMany({
      where: {
        parkingSlotId: slot.id,
        orderType: { in: ['PARKING', 'TAKEAWAY'] },
        status: {
          in: ['OPEN', 'PENDING', 'PLACED', 'IN_KITCHEN', 'READY', 'SERVED', 'BILL_PRINTED', 'PAYMENT_AWAITING_APPROVAL'],
        },
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      include: {
        items: {
          include: {
            product: { select: { name: true, image: true } },
            kotItems: { select: { status: true, quantity: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Menu categories + products
    const categories = await prisma.category.findMany({
      where: {
        propertyId: property.id,
        isActive: true,
        menuType: { not: 'BAR' },
      },
      include: {
        products: {
          where: { isActive: true, availabilityStatus: true, menuType: { not: 'BAR' } },
          include: { variants: true },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });

    const menu = categories.filter((cat: any) => cat.products.length > 0);

    return apiResponse({ property, slot, activeOrders, menu });
  } catch (error) {
    console.error('Public Parking Menu API Error:', error);
    return apiError(error);
  }
}
