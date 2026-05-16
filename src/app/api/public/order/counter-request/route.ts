import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, propertyId, rating, comments } = body;

    if (!orderId || !propertyId) {
      return apiError(new Error('Missing orderId or propertyId'), 400);
    }

    const result = await prisma.$transaction(async (tx: any) => {
      const order = await tx.posOrder.update({
        where: { id: orderId },
        data: { paymentRequested: true },
        include: { 
          table: { include: { floor: true } },
          parkingSlot: true,
          items: { include: { product: true } }
        }
      });

      let locationName = 'Unknown Location';
      if (order.table) {
        locationName = `Table ${order.table.name} (${order.table.floor.name})`;
      } else if (order.parkingSlot) {
        locationName = `Parking Slot ${order.parkingSlot.name}`;
      }

      await tx.notification.create({
        data: {
          propertyId,
          title: 'Counter Payment Request',
          message: `Guest at ${locationName} wants to pay at counter. Amount: ₹${order.grandTotal.toFixed(2)}`,
          type: 'PAYMENT',
          priority: 'URGENT',
          metadata: JSON.stringify({
            locationName,
            amount: order.grandTotal,
            orderId,
            orderNo: order.orderNo,
            paymentMethod: 'COUNTER',
            items: order.items.map((i: any) => ({ name: i.product.name, qty: i.quantity }))
          }),
        }
      });

      if (rating) {
        await tx.orderRating.upsert({
          where: { orderId },
          update: { rating, comments },
          create: { orderId, rating, comments }
        });
      }

      return order;
    });

    // You could also trigger a real-time notification here if using WebSockets/Pusher
    
    return apiResponse({ success: true }, 'Staff notified for counter payment');
  } catch (error) {
    console.error('Counter Request Error:', error);
    return apiError(error);
  }
}
