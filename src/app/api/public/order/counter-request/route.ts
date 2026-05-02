import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, propertyId } = body;

    if (!orderId || !propertyId) {
      return apiError(new Error('Missing orderId or propertyId'), 400);
    }

    const order = await prisma.posOrder.update({
      where: { id: orderId },
      data: {
        paymentRequested: true
      }
    });

    // You could also trigger a real-time notification here if using WebSockets/Pusher
    
    return apiResponse({ success: true }, 'Staff notified for counter payment');
  } catch (error) {
    console.error('Counter Request Error:', error);
    return apiError(error);
  }
}
