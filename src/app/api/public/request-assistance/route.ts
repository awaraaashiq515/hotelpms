import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tableId, parkingSlotId, propertyId, type } = body;

    if ((!tableId && !parkingSlotId) || !propertyId || !type) {
      return apiError(new Error('Missing required fields'), 400);
    }

    let title = type === 'BILL' ? 'Bill Request' : 'Assistance Requested';
    let message = '';
    let metadata: any = { 
      propertyId, 
      requestType: type,
      link: tableId ? '/operations/tables' : '/operations/parking'
    };

    if (tableId) {
      const table = await prisma.table.findUnique({
        where: { id: tableId },
        include: { floor: true }
      });
      if (!table) return apiError(new Error('Table not found'), 404);
      
      message = type === 'BILL' 
        ? `Guest at Table ${table.name} (${table.floor.name}) has requested the bill.`
        : `Guest at Table ${table.name} (${table.floor.name}) is calling for a waiter.`;
      
      metadata = {
        ...metadata,
        tableId,
        tableName: table.name,
        floorName: table.floor.name
      };
    } else if (parkingSlotId) {
      const slot = await (prisma as any).parkingSlot.findUnique({
        where: { id: parkingSlotId }
      });
      if (!slot) return apiError(new Error('Parking slot not found'), 404);

      message = type === 'BILL' 
        ? `Guest at Parking Slot ${slot.name} has requested the bill.`
        : `Guest at Parking Slot ${slot.name} is calling for assistance.`;

      metadata = {
        ...metadata,
        parkingSlotId,
        slotName: slot.name
      };
    }

    const notification = await prisma.notification.create({
      data: {
        propertyId,
        title,
        message,
        type: 'ASSISTANCE',
        priority: 'URGENT',
        metadata: JSON.stringify(metadata),
      },
    });

    return apiResponse(notification, 'Request sent successfully', 201);
  } catch (error) {
    return apiError(error);
  }
}
