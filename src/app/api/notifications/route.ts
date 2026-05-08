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
    const status = searchParams.get('status') || 'UNREAD';

    const notifications = await prisma.notification.findMany({
      where: {
        propertyId: session.propertyId,
        status: status as any,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
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

export async function POST(request: NextRequest) {
  try {
    // This could be called internally or by a webhook
    const body = await request.json();
    const { propertyId, title, message, type, priority, metadata } = body;

    if (!propertyId || !title || !message) {
      return apiError(new Error('Missing required fields'), 400);
    }

    const notification = await prisma.notification.create({
      data: {
        propertyId,
        title,
        message,
        type: type || 'GENERAL',
        priority: priority || 'MEDIUM',
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });

    return apiResponse(notification, 'Notification created successfully', 201);
  } catch (error) {
    return apiError(error);
  }
}
