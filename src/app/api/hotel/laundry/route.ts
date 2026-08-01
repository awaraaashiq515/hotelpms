import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, getMultiTenantWhere, resolveAdminProperty } from '@/lib/api-utils';
import { getSession } from '@/lib/session';
import { getWTUserFromRequest } from '@/lib/walkie-talkie-auth';

// Helper to resolve propertyId from session, staff token, propertyCode, or fallback
async function getEffectivePropertyId(req: NextRequest, session: any, staff: any, bodyPropertyId?: string, bodyPropertyCode?: string) {
  const { searchParams } = new URL(req.url);
  const paramPropId = searchParams.get('propertyId') || bodyPropertyId;
  const paramPropCode = searchParams.get('propertyCode') || bodyPropertyCode;

  if (paramPropId && paramPropId !== 'all' && paramPropId !== 'null' && paramPropId !== 'undefined') {
    return paramPropId;
  }

  if (paramPropCode && (prisma as any).property) {
    const prop = await (prisma as any).property.findUnique({ where: { code: paramPropCode }, select: { id: true } });
    if (prop) return prop.id;
  }

  if (session) {
    const adminProp = await resolveAdminProperty(session, prisma);
    if (adminProp) return adminProp;
  }

  if (staff?.propertyId) {
    return staff.propertyId;
  }

  // Fallback to first property in system if available
  if ((prisma as any).property) {
    const firstProp = await (prisma as any).property.findFirst({ select: { id: true } });
    return firstProp?.id || null;
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const staff = !session ? await getWTUserFromRequest(request as any) : null;
    const { searchParams } = new URL(request.url);
    const propertyIdParam = searchParams.get('propertyId');
    const propertyCodeParam = searchParams.get('propertyCode');

    let whereClause: any = {};

    if (session) {
      whereClause = getMultiTenantWhere(session, propertyIdParam);
    } else if (staff?.propertyId) {
      whereClause = { propertyId: staff.propertyId };
    } else if (propertyIdParam) {
      whereClause = { propertyId: propertyIdParam };
    } else if (propertyCodeParam && (prisma as any).property) {
      const prop = await (prisma as any).property.findUnique({ where: { code: propertyCodeParam }, select: { id: true } });
      if (prop) {
        whereClause = { propertyId: prop.id };
      }
    }

    let items: any[] = [];
    if ((prisma as any).laundryRequest) {
      items = await (prisma as any).laundryRequest.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // Raw SQL fallback
      try {
        let sql = `SELECT * FROM "LaundryRequest"`;
        if (whereClause.propertyId) {
          sql += ` WHERE "propertyId" = '${whereClause.propertyId}'`;
        }
        sql += ` ORDER BY "createdAt" DESC`;
        items = await prisma.$queryRawUnsafe(sql);
      } catch (e) {
        console.warn('[Laundry API GET raw fallback]', e);
        items = [];
      }
    }

    return apiResponse(items);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const staff = !session ? await getWTUserFromRequest(request as any) : null;

    const body = await request.json();
    const { roomNumber, guestName, itemsCount, itemsDetail, amount, status, collectedBy, notes, propertyId: bodyPropId, propertyCode: bodyPropCode } = body;

    if (!roomNumber) {
      return apiError(new Error('Room number is required'), 400);
    }

    const propertyId = await getEffectivePropertyId(request, session, staff, bodyPropId, bodyPropCode);

    if (!propertyId) {
      return apiError(new Error('Property context is required to register laundry request.'), 400);
    }

    let newItem: any = null;
    const finalItemsCount = Number(itemsCount) || 1;
    const finalAmount = Number(amount) || (finalItemsCount * 150); // Default ₹150 per item rate if not specified
    const finalCollectedBy = collectedBy || (session ? (session.email || 'Staff') : (staff ? staff.fullName : 'Housekeeper'));
    const finalStatus = status || 'COLLECTED';

    if ((prisma as any).laundryRequest) {
      newItem = await (prisma as any).laundryRequest.create({
        data: {
          propertyId,
          roomNumber: String(roomNumber),
          guestName: guestName || 'In-House Guest',
          itemsCount: finalItemsCount,
          itemsDetail: itemsDetail || '',
          amount: finalAmount,
          status: finalStatus,
          collectedBy: finalCollectedBy,
          notes: notes || null,
        },
      });
    } else {
      // Raw SQL fallback
      const id = 'c' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
      const now = new Date().toISOString();

      await prisma.$executeRawUnsafe(
        `INSERT INTO "LaundryRequest" ("id", "propertyId", "roomNumber", "guestName", "itemsCount", "itemsDetail", "amount", "status", "collectedBy", "collectedAt", "notes", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        id, propertyId, String(roomNumber), guestName || 'In-House Guest', finalItemsCount, itemsDetail || '', finalAmount, finalStatus, finalCollectedBy, now, notes || null, now, now
      );

      newItem = {
        id,
        propertyId,
        roomNumber: String(roomNumber),
        guestName: guestName || 'In-House Guest',
        itemsCount: finalItemsCount,
        itemsDetail: itemsDetail || '',
        amount: finalAmount,
        status: finalStatus,
        collectedBy: finalCollectedBy,
        collectedAt: now,
        notes: notes || null,
        createdAt: now,
        updatedAt: now,
      };
    }

    return apiResponse(newItem, 'Laundry request logged successfully', 201);
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, guestName, amount, itemsCount, notes } = body;

    if (!id) {
      return apiError(new Error('Laundry request ID is required'), 400);
    }

    let updated: any = null;

    if ((prisma as any).laundryRequest) {
      const updateData: any = {};
      if (status) updateData.status = status;
      if (guestName !== undefined) updateData.guestName = guestName;
      if (amount !== undefined) updateData.amount = Number(amount);
      if (itemsCount !== undefined) updateData.itemsCount = Number(itemsCount);
      if (notes !== undefined) updateData.notes = notes;
      if (status === 'DELIVERED') updateData.deliveredAt = new Date();

      updated = await (prisma as any).laundryRequest.update({
        where: { id },
        data: updateData,
      });
    } else {
      // Raw SQL fallback
      const now = new Date().toISOString();
      const deliveredAtVal = status === 'DELIVERED' ? now : null;
      await prisma.$executeRawUnsafe(
        `UPDATE "LaundryRequest" SET "status" = ?, "guestName" = COALESCE(?, "guestName"), "amount" = COALESCE(?, "amount"), "deliveredAt" = COALESCE(?, "deliveredAt"), "updatedAt" = ? WHERE "id" = ?`,
        status || 'COLLECTED', guestName || null, amount ? Number(amount) : null, deliveredAtVal, now, id
      );
      updated = { id, status, guestName, amount, updatedAt: now };
    }

    return apiResponse(updated, 'Laundry request updated successfully');
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return apiError(new Error('Laundry request ID is required'), 400);
    }

    if ((prisma as any).laundryRequest) {
      await (prisma as any).laundryRequest.delete({
        where: { id },
      });
    } else {
      await prisma.$executeRawUnsafe(`DELETE FROM "LaundryRequest" WHERE "id" = ?`, id);
    }

    return apiResponse(null, 'Laundry request deleted successfully');
  } catch (error) {
    return apiError(error);
  }
}
