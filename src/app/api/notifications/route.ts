import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

async function getTargetPropertyFilter(session: any) {
  if (!session.propertyId) return null;

  // Check if businessType is BOTH (attached hotel + restaurant)
  let isAttachedBoth = session.businessType === 'BOTH' || (session.isMultiProperty === true && session.businessType !== 'BOTH_SEPARATE');

  if (!isAttachedBoth && session.organizationId) {
    const org = await prisma.organization.findUnique({
      where: { id: session.organizationId },
      select: { businessType: true }
    });
    if (org?.businessType === 'BOTH') {
      isAttachedBoth = true;
    }
  }

  // If businessType === 'BOTH_SEPARATE', or 'HOTEL', or 'RESTAURANT', or not attached:
  // Strictly filter by current session.propertyId only!
  if (!isAttachedBoth || !session.organizationId) {
    return { propertyId: session.propertyId };
  }

  // Attached BOTH: Fetch all property IDs for this organization (Hotel + Restaurant)
  const properties = await prisma.property.findMany({
    where: { organizationId: session.organizationId },
    select: { id: true }
  });

  const ids = properties.map(p => p.id);
  if (ids.length <= 1) {
    return { propertyId: session.propertyId };
  }

  return { propertyId: { in: ids } };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const propertyFilter = await getTargetPropertyFilter(session);
    if (!propertyFilter) {
      return apiResponse([], 'No property linked');
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const autoCleanup = searchParams.get('autoCleanup'); // '24h', '7d', '30d'

    // Perform automatic cleanup if policy is provided
    if (autoCleanup && autoCleanup !== 'off') {
      let cleanupDate = new Date();
      if (autoCleanup === '24h') cleanupDate.setHours(cleanupDate.getHours() - 24);
      else if (autoCleanup === '7d') cleanupDate.setDate(cleanupDate.getDate() - 7);
      else if (autoCleanup === '30d') cleanupDate.setDate(cleanupDate.getDate() - 30);

      try {
        await prisma.notification.deleteMany({
          where: {
            ...propertyFilter,
            createdAt: { lt: cleanupDate }
          }
        });
      } catch (cleanupError) {
        console.error('Auto-cleanup failed:', cleanupError);
      }
    }

    const where: any = {
      ...propertyFilter,
    };

    if (status && status !== 'ALL') {
      where.status = status;
    }

    // Fetch current user and their table assignments to filter notifications
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: {
        role: true,
        tableAssignments: true
      }
    });

    const isManagerOrAdmin = user?.role?.name?.toLowerCase().includes('manager') || 
                             user?.role?.name?.toLowerCase().includes('admin');

    const assignedTableIds = user?.tableAssignments?.map((ta: any) => ta.tableId) || [];

    if (!isManagerOrAdmin && assignedTableIds.length > 0) {
      where.OR = [
        { tableId: null }, // Keep general notifications (parking slot calls, alerts)
        { tableId: { in: assignedTableIds } } // Keep notifications for assigned tables
      ];
    }

    const notifications = await prisma.notification.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            name: true,
            code: true,
            type: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100, // Increase take limit for better visibility
    });

    return apiResponse(notifications, 'Notifications fetched successfully');
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return apiError(new Error('Missing id or status'), 400);
    }

    const notification = await prisma.notification.update({
      where: { id },
      data: { status },
    });

    return apiResponse(notification, 'Notification updated successfully');
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.propertyId) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const propertyFilter = await getTargetPropertyFilter(session);
    if (!propertyFilter) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const all = searchParams.get('all') === 'true';
    const olderThan = searchParams.get('olderThan'); // e.g. '24h', '7d'

    if (id) {
      await prisma.notification.delete({ where: { id } });
      return apiResponse(null, 'Notification deleted successfully');
    }

    if (all) {
      await prisma.notification.deleteMany({
        where: propertyFilter
      });
      return apiResponse(null, 'All notifications cleared');
    }

    if (olderThan) {
      let date = new Date();
      if (olderThan === '24h') date.setHours(date.getHours() - 24);
      else if (olderThan === '7d') date.setDate(date.getDate() - 7);
      else if (olderThan === '30d') date.setDate(date.getDate() - 30);
      
      const result = await prisma.notification.deleteMany({
        where: { 
          ...propertyFilter,
          createdAt: { lt: date }
        }
      });
      return apiResponse(result, `Deleted ${result.count} old notifications`);
    }

    return apiError(new Error('Invalid delete request'), 400);
  } catch (error) {
    return apiError(error);
  }
}
