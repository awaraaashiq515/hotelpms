import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, resolvePropertyIdentifier } from '@/lib/api-utils';
import { getSession } from '@/lib/session';
import { getWTUserFromRequest } from '@/lib/walkie-talkie-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    let staff: any = null;
    if (!session) {
      staff = await getWTUserFromRequest(request as any);
    }

    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department'); // KITCHEN | HOUSEKEEPING | etc.
    const status = searchParams.get('status'); // PENDING | APPROVED | REJECTED | DISPATCHED
    const search = searchParams.get('search');
    const urgency = searchParams.get('urgency');

    let propertyParam = searchParams.get('propertyId') || searchParams.get('propertyCode');
    if (!propertyParam && session?.propertyId) {
      propertyParam = session.propertyId;
    } else if (!propertyParam && staff?.propertyId) {
      propertyParam = staff.propertyId;
    }

    if (!propertyParam && !session) {
      return apiError(new Error('Property identifier is required'), 400);
    }

    const prop = await resolvePropertyIdentifier(propertyParam, session);
    if (!prop) {
      return apiError(new Error('Property not found'), 404);
    }

    let targetPropertyIds = [prop.id];
    const fullProp = await prisma.property.findUnique({
      where: { id: prop.id },
      select: { organizationId: true },
    });
    if (fullProp?.organizationId) {
      const siblings = await prisma.property.findMany({
        where: { organizationId: fullProp.organizationId },
        select: { id: true },
      });
      targetPropertyIds = siblings.map((s) => s.id);
    }

    const where: any = {
      propertyId: { in: targetPropertyIds },
    };

    if (department && department !== 'ALL') {
      where.department = department.toUpperCase();
    }

    if (status && status !== 'ALL') {
      where.status = status.toUpperCase();
    }

    if (urgency && urgency !== 'ALL') {
      where.urgency = urgency.toUpperCase();
    }

    if (search) {
      where.OR = [
        { itemName: { contains: search } },
        { requestedBy: { contains: search } },
        { remarks: { contains: search } },
      ];
    }

    const requests = await prisma.stockRequest.findMany({
      where,
      include: {
        stockItem: {
          select: {
            id: true,
            name: true,
            unit: true,
            itemType: true,
            costPrice: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return apiResponse(requests);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    let staff: any = null;
    if (!session) {
      staff = await getWTUserFromRequest(request as any);
    }

    const body = await request.json();
    const {
      propertyId: rawPropertyId,
      propertyCode,
      stockItemId,
      itemName,
      department = 'KITCHEN',
      requestedBy = 'Staff',
      requestedQty = 1,
      unit,
      urgency = 'NORMAL',
      remarks,
    } = body;

    const propParam = rawPropertyId || propertyCode || session?.propertyId || staff?.propertyId;
    const prop = await resolvePropertyIdentifier(propParam, session);
    if (!prop) {
      return apiError(new Error('Property not found'), 400);
    }

    if (!itemName && !stockItemId) {
      return apiError(new Error('Item name or Stock Item ID is required'), 400);
    }

    let finalItemName = itemName;
    let finalUnit = unit;
    let currentStock = 0;
    let validStockItemId: string | null = null;

    if (stockItemId) {
      const stockItem = await prisma.stockItem.findUnique({
        where: { id: stockItemId },
      });
      if (stockItem) {
        validStockItemId = stockItem.id;
        if (!finalItemName) finalItemName = stockItem.name;
        if (!finalUnit) finalUnit = stockItem.unit || 'pcs';

        // Calculate latest stock balance
        const agg = await prisma.stockMovement.aggregate({
          where: { stockItemId: stockItem.id },
          _sum: { qtyIn: true, qtyOut: true },
        });
        currentStock = (agg._sum.qtyIn || 0) - (agg._sum.qtyOut || 0);
      } else {
        // Check if it's an InventoryItem (Hotel Inventory)
        const invItem = await prisma.inventoryItem.findUnique({
          where: { id: stockItemId },
        });
        if (invItem) {
          if (!finalItemName) finalItemName = invItem.name;
          if (!finalUnit) finalUnit = invItem.unit || 'pcs';
          currentStock = Number(invItem.currentQuantity) || 0;
        }
      }
    }

    const stockReq = await prisma.stockRequest.create({
      data: {
        propertyId: prop.id,
        stockItemId: validStockItemId,
        itemName: finalItemName || 'Unknown Item',
        department: department.toUpperCase(),
        requestedBy: requestedBy || (session as any)?.user?.name || (session as any)?.fullName || session?.email || 'Staff',
        requestedQty: Number(requestedQty || 1),
        unit: finalUnit || 'pcs',
        currentStock: Number(currentStock || 0),
        urgency: urgency.toUpperCase(),
        status: 'PENDING',
        remarks: remarks || null,
      },
      include: {
        stockItem: true,
      },
    });

    // Notify Admin & Store in real-time via Notification table
    try {
      const isUrgent = urgency === 'CRITICAL' || urgency === 'URGENT';
      await prisma.notification.create({
        data: {
          propertyId: prop.id,
          title: `${isUrgent ? '🚨 CRITICAL' : '📦'} ${department} Stock Alert`,
          message: `${requestedBy} reported out-of-stock / requested refill: ${finalItemName} (${requestedQty} ${finalUnit || 'units'}).`,
          type: 'INVENTORY',
          status: 'UNREAD',
          priority: isUrgent ? 'HIGH' : 'MEDIUM',
          metadata: JSON.stringify({
            requestId: stockReq.id,
            department,
            itemName: finalItemName,
            requestedQty,
            unit: finalUnit,
            urgency,
          }),
        },
      });
    } catch (notifErr) {
      console.warn('Failed to insert admin notification:', notifErr);
    }

    return apiResponse(stockReq, 'Stock request submitted successfully', 201);
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    let staff: any = null;
    if (!session) {
      staff = await getWTUserFromRequest(request as any);
    }

    const body = await request.json();
    const { id, status, remarks, resolvedBy } = body;

    if (!id || !status) {
      return apiError(new Error('id and status are required'), 400);
    }

    const existing = await prisma.stockRequest.findUnique({
      where: { id },
    });

    if (!existing) {
      return apiError(new Error('Stock request not found'), 404);
    }

    const updated = await prisma.stockRequest.update({
      where: { id },
      data: {
        status: status.toUpperCase(),
        remarks: remarks !== undefined ? remarks : existing.remarks,
        resolvedAt: ['APPROVED', 'DISPATCHED', 'REJECTED'].includes(status.toUpperCase()) ? new Date() : null,
        resolvedBy: resolvedBy || (session as any)?.user?.name || (session as any)?.fullName || session?.email || staff?.name || 'Admin',
      },
      include: {
        stockItem: true,
      },
    });

    return apiResponse(updated, `Request marked as ${status}`);
  } catch (error) {
    return apiError(error);
  }
}

