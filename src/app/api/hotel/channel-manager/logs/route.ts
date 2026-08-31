import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, getMultiTenantWhere, resolveAdminProperty } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const propertyIdParam = searchParams.get('propertyId');
    const where = getMultiTenantWhere(session, propertyIdParam);

    let propertyId = propertyIdParam || session.propertyId;
    if (!propertyId && session.role === 'RESTAURANTS_ADMIN') {
      propertyId = await resolveAdminProperty(session, prisma);
    }
    if (!propertyId && where.propertyId) {
      propertyId = where.propertyId;
    }
    if (!propertyId && session.organizationId) {
      const firstProp = await prisma.property.findFirst({
        where: { organizationId: session.organizationId },
        select: { id: true },
      });
      propertyId = firstProp?.id || null;
    }

    const logs = await prisma.channelSyncLog.findMany({
      where: propertyId ? { propertyId } : where,
      include: {
        channel: {
          select: { name: true, logo: true, channelCode: true },
        },
      },
      orderBy: { syncedAt: 'desc' },
      take: 40,
    });

    const formattedLogs = logs.map((l) => ({
      id: l.id,
      propertyId: l.propertyId,
      channelId: l.channelId,
      channelName: l.channel?.name || 'PMS Global Sync',
      channelLogo: l.channel?.logo || '⚡',
      actionType: l.actionType,
      status: l.status,
      message: l.message,
      payload: l.payload,
      syncedAt: l.syncedAt.toISOString(),
    }));

    return apiResponse(formattedLogs);
  } catch (error) {
    return apiError(error);
  }
}
