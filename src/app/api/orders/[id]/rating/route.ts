import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { apiError, apiResponse } from '@/lib/api-utils'
import { createNotification } from '@/lib/notificationService'

const ratingSchema = z.object({
  rating: z.number().min(1).max(5),
  comments: z.string().max(500).optional(),
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json()
    const { rating, comments } = ratingSchema.parse(body)

    const orderRating = await prisma.orderRating.create({
      data: {
        orderId: id,
        rating,
        comments,
      }
    })

    // Notify about new rating
    try {
      // Need propertyId, we can get it from order
      const order = await prisma.posOrder.findUnique({ where: { id: (await params).id } });
      if (order) {
        await createNotification({
          propertyId: order.propertyId,
          title: 'New Customer Rating',
          message: `Order #${order.orderNo} received a ${rating}-star rating.`,
          type: 'FEEDBACK',
          priority: rating <= 2 ? 'HIGH' : 'MEDIUM',
          metadata: {
            orderId: order.id,
            rating,
            link: '/reports/ratings'
          }
        });
      }
    } catch (e) {}

    return apiResponse(orderRating, 'Rating submitted successfully', 201)
  } catch (error) {
    return apiError(error)
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const rating = await prisma.orderRating.findUnique({
      where: { orderId: id }
    })

    if (!rating) return apiError(new Error('Rating not found'), 404)

    return apiResponse(rating, 'Rating fetched successfully')
  } catch (error) {
    return apiError(error)
  }
}
