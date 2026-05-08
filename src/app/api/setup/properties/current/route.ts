import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const propertyId = (session.propertyId as string | null) || (await (async () => {
      const first: any[] = await (prisma as any).$queryRawUnsafe(
        'SELECT id FROM "Property" WHERE "organizationId" = $1 ORDER BY "createdAt" ASC LIMIT 1',
        session.organizationId
      );
      return first.length > 0 ? first[0].id : null;
    })());

    if (!propertyId) {
      return apiError(new Error('Unauthorized or no property selected'), 401);
    }

    // Using Raw SQL to fetch the full property record to bypass stale Prisma client field filtering
    const properties: any[] = await (prisma as any).$queryRawUnsafe(
      'SELECT * FROM "Property" WHERE "id" = $1 LIMIT 1',
      propertyId
    );

    if (properties.length === 0) {
      return apiError(new Error('Property not found'), 404);
    }

    const property = properties[0];
    return apiResponse(property);
  } catch (error) {
    console.error('[API Error]:', error);
    return apiError(error);
  }
}
