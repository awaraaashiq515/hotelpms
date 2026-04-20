import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { id } = await params;
    const body = await request.json();
    const { rating, comments } = body;

    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const invoice = await prisma.invoice.update({
      where: { id, propertyId: session.propertyId! },
      data: {
        rating,
        ratingComments: comments
      }
    });

    // Also update OrderRating if linked
    if (invoice.posOrderId) {
      await prisma.orderRating.upsert({
        where: { orderId: invoice.posOrderId },
        update: { rating, comments },
        create: {
          orderId: invoice.posOrderId,
          rating,
          comments
        }
      });
    }

    return apiResponse(invoice, 'Rating saved successfully');
  } catch (error: any) {
    console.error('Rating Error:', error);
    return apiError(error, 400);
  }
}
