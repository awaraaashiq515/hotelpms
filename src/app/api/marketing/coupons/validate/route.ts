import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.propertyId) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const { code, guestId, orderTotal } = body;

    if (!code) {
      return apiError(new Error('Coupon code is required'), 400);
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon || coupon.propertyId !== session.propertyId) {
      return apiError(new Error('Invalid coupon code'), 404);
    }

    if (!coupon.isActive) {
      return apiError(new Error('Coupon is inactive'), 400);
    }

    const now = new Date();
    if (new Date(coupon.expiryDate) < now) {
      return apiError(new Error('Coupon has expired'), 400);
    }

    if (orderTotal < coupon.minOrderValue) {
      return apiError(new Error(`Minimum order amount of ₹${coupon.minOrderValue} required for this coupon`), 400);
    }

    if (coupon.assignedGuestId && coupon.assignedGuestId !== guestId) {
      return apiError(new Error('This coupon code is not applicable to your account'), 400);
    }

    return apiResponse(coupon, 'Coupon applied successfully!');
  } catch (error) {
    return apiError(error);
  }
}
