import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tableId, propertyId, type } = body;

    if (!tableId || !propertyId || !type) {
      return apiError(new Error('Missing required fields'), 400);
    }

    const table = await prisma.table.findUnique({
      where: { id: tableId },
      include: { floor: true }
    });

    if (!table) return apiError(new Error('Table not found'), 404);

    const title = type === 'BILL' ? 'Bill Request' : 'Assistance Requested';
    const message = type === 'BILL' 
      ? `Guest at Table ${table.name} (${table.floor.name}) has requested the bill.`
      : `Guest at Table ${table.name} (${table.floor.name}) is calling for a waiter.`;

    const notification = await prisma.notification.create({
      data: {
        propertyId,
        title,
        message,
        type: 'ASSISTANCE',
        priority: 'URGENT',
        metadata: JSON.stringify({
          tableId,
          tableName: table.name,
          floorName: table.floor.name,
          requestType: type,
          link: '/operations/tables'
        }),
      },
    });

    return apiResponse(notification, 'Request sent successfully', 201);
  } catch (error) {
    return apiError(error);
  }
}
