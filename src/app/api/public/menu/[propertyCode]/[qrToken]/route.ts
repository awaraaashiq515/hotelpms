import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ propertyCode: string; qrToken: string }> }
) {
  try {
    const { propertyCode, qrToken } = await params;

    // 1. Find the table by qrToken or ID and include its property details
    const tableData = await prisma.table.findFirst({
      where: {
        OR: [
          { qrToken: qrToken },
          { id: qrToken }
        ]
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
            lastUpiResetDate: true,
            showBarInQrMenu: true
          }
        }
      }
    });

    if (!tableData) {
      return apiError(new Error('Invalid or expired QR link'), 404);
    }

    // Verify property code matches (case-insensitive)
    if (tableData.property.code.toLowerCase() !== propertyCode.toLowerCase()) {
      return apiError(new Error('Invalid property code for this QR'), 400);
    }

    let property = { ...tableData.property };

    // --- UPI ROTATION LOGIC ---
    const now = new Date();
    const lastReset = property.lastUpiResetDate ? new Date(property.lastUpiResetDate) : null;
    
    // Check if we need to reset daily counts (different day)
    const isDifferentDay = !lastReset || 
      lastReset.getDate() !== now.getDate() || 
      lastReset.getMonth() !== now.getMonth() || 
      lastReset.getFullYear() !== now.getFullYear();

    if (isDifferentDay) {
      // Reset in DB
      await prisma.property.update({
        where: { id: property.id },
        data: {
          upiReceivedToday: 0,
          upiReceivedToday2: 0,
          lastUpiResetDate: now
        }
      });
      property.upiReceivedToday = 0;
      property.upiReceivedToday2 = 0;
    }

    // Determine active UPI ID
    let activeUpiId = property.upiId;
    let activeUpiName = property.upiName;

    if (property.upiId && property.upiReceivedToday !== null && property.upiLimit !== null) {
      if (property.upiReceivedToday >= property.upiLimit) {
        // Primary limit reached, try secondary
        if (property.upiId2 && property.upiReceivedToday2 !== null && property.upiLimit2 !== null) {
          if (property.upiReceivedToday2 < property.upiLimit2) {
             activeUpiId = property.upiId2;
             activeUpiName = property.upiName2;
          }
        }
      }
    }

    // Inject active UPI into property object for frontend
    (property as any).upiId = activeUpiId;
    (property as any).upiName = activeUpiName;
    const table = { id: tableData.id, name: tableData.name };

    // 2. Fetch Active Orders for this table (Dine-in)
    const activeOrders = await prisma.posOrder.findMany({
      where: {
        restaurantTableId: table.id,
        status: { in: ['OPEN', 'PENDING', 'PLACED', 'IN_KITCHEN', 'READY', 'SERVED', 'BILL_PRINTED', 'PAYMENT_AWAITING_APPROVAL'] },
        orderType: 'DINE_IN',
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      },
      include: {
        items: {
          include: {
            product: {
              select: { name: true, image: true }
            },
            kotItems: {
              select: { status: true, quantity: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // 3. Fetch Menu (Categories + Products)
    // Filter by BAR menuType if showBarInQrMenu is false
    const categories = await prisma.category.findMany({
      where: {
        propertyId: property.id,
        isActive: true,
        ...(property.showBarInQrMenu ? {} : { menuType: { not: 'BAR' } })
      },
      include: {
        products: {
          where: {
            isActive: true,
            availabilityStatus: true,
            ...(property.showBarInQrMenu ? {} : { menuType: { not: 'BAR' } })
          },
          include: {
            variants: true
          },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });

    // Filter out categories with no products
    const menu = categories.filter((cat: any) => cat.products.length > 0);

    return apiResponse({
      property,
      table,
      activeOrders,
      menu,
    });
  } catch (error) {
    console.error('Public Menu API Error:', error);
    return apiError(error);
  }
}
