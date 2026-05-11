import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.propertyId) {
      return apiError(new Error('Unauthorized'), 401);
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
            propertyId: session.propertyId,
            createdAt: { lt: cleanupDate }
          }
        });
      } catch (cleanupError) {
        console.error('Auto-cleanup failed:', cleanupError);
      }
    }

    const where: any = {
      propertyId: session.propertyId,
    };

    if (status && status !== 'ALL') {
      where.status = status;
    }

    const notifications = await prisma.notification.findMany({
      where,
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
        where: { propertyId: session.propertyId }
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
          propertyId: session.propertyId,
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
