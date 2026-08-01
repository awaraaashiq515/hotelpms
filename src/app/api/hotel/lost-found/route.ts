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
    if ((prisma as any).lostItem) {
      items = await (prisma as any).lostItem.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // Raw SQL fallback for hot-reload dev server
      try {
        let sql = `SELECT * FROM "LostItem"`;
        if (whereClause.propertyId) {
          sql += ` WHERE "propertyId" = '${whereClause.propertyId}'`;
        }
        sql += ` ORDER BY "createdAt" DESC`;
        items = await prisma.$queryRawUnsafe(sql);
      } catch (e) {
        console.warn('[LostFound API GET raw fallback]', e);
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
    const { item, description, room, foundBy, foundAt, guestContact, notes, propertyId: bodyPropId, propertyCode: bodyPropCode } = body;

    if (!item) {
      return apiError(new Error('Item name is required'), 400);
    }

    const propertyId = await getEffectivePropertyId(request, session, staff, bodyPropId, bodyPropCode);

    if (!propertyId) {
      return apiError(new Error('Property context is required to register lost item.'), 400);
    }

    let newItem: any = null;

    if ((prisma as any).lostItem) {
      newItem = await (prisma as any).lostItem.create({
        data: {
          propertyId,
          item,
          description: description || '',
          room: room || 'N/A',
          foundBy: foundBy || (session ? (session.email || 'Staff') : (staff ? staff.fullName : 'Housekeeper')),
          foundAt: foundAt ? new Date(foundAt) : new Date(),
          status: 'FOUND',
          guestContact: guestContact || null,
          notes: notes || null,
        },
      });
    } else {
      // Raw SQL fallback
      const id = 'c' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
      const now = new Date().toISOString();
      const foundByStr = foundBy || (session ? (session.email || 'Staff') : (staff ? staff.fullName : 'Housekeeper'));

      await prisma.$executeRawUnsafe(
        `INSERT INTO "LostItem" ("id", "propertyId", "item", "description", "room", "foundBy", "foundAt", "status", "guestContact", "notes", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        id, propertyId, item, description || '', room || 'N/A', foundByStr, foundAt ? new Date(foundAt).toISOString() : now, 'FOUND', guestContact || null, notes || null, now, now
      );

      newItem = {
        id,
        propertyId,
        item,
        description: description || '',
        room: room || 'N/A',
        foundBy: foundByStr,
        foundAt: foundAt ? new Date(foundAt).toISOString() : now,
        status: 'FOUND',
        guestContact: guestContact || null,
        notes: notes || null,
        createdAt: now,
        updatedAt: now,
      };
    }

    return apiResponse(newItem, 'Lost item logged successfully', 201);
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, guestContact, claimedBy, notes } = body;

    if (!id) {
      return apiError(new Error('Item ID is required'), 400);
    }

    let updated: any = null;

    if ((prisma as any).lostItem) {
      const updateData: any = {};
      if (status) updateData.status = status;
      if (guestContact !== undefined) updateData.guestContact = guestContact;
      if (claimedBy !== undefined) updateData.claimedBy = claimedBy;
      if (notes !== undefined) updateData.notes = notes;
      if (status === 'CLAIMED') updateData.claimedAt = new Date();

      updated = await (prisma as any).lostItem.update({
        where: { id },
        data: updateData,
      });
    } else {
      // Raw SQL fallback
      const now = new Date().toISOString();
      await prisma.$executeRawUnsafe(
        `UPDATE "LostItem" SET "status" = ?, "guestContact" = ?, "claimedBy" = ?, "claimedAt" = ?, "updatedAt" = ? WHERE "id" = ?`,
        status || 'FOUND', guestContact || null, claimedBy || null, status === 'CLAIMED' ? now : null, now, id
      );
      updated = { id, status, guestContact, claimedBy, updatedAt: now };
    }

    return apiResponse(updated, 'Lost item status updated successfully');
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return apiError(new Error('Item ID is required'), 400);
    }

    if ((prisma as any).lostItem) {
      await (prisma as any).lostItem.delete({
        where: { id },
      });
    } else {
      await prisma.$executeRawUnsafe(`DELETE FROM "LostItem" WHERE "id" = ?`, id);
    }

    return apiResponse(null, 'Item deleted successfully');
  } catch (error) {
    return apiError(error);
  }
}
