import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.propertyId) return apiError(new Error('Unauthorized'), 401);

    const coupons = await prisma.coupon.findMany({
      where: { propertyId: session.propertyId },
      include: {
        assignedGuest: {
          select: { id: true, firstName: true, lastName: true, mobile: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return apiResponse(coupons);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.propertyId) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const { code, discountType, discountValue, minOrderValue, maxDiscount, expiryDate, assignedGuestId } = body;

    if (!code || !discountType || !discountValue || !expiryDate) {
      return apiError(new Error('Missing required fields: code, discountType, discountValue, expiryDate'), 400);
    }

    // Check if code is unique
    const existing = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (existing) {
      return apiError(new Error('Coupon code already exists'), 409);
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        discountType,
        discountValue: Number(discountValue),
        minOrderValue: minOrderValue ? Number(minOrderValue) : 0,
        maxDiscount: maxDiscount ? Number(maxDiscount) : null,
        expiryDate: new Date(expiryDate),
        propertyId: session.propertyId,
        assignedGuestId: assignedGuestId || null,
      },
    });

    return apiResponse(coupon, 'Coupon created successfully', 201);
  } catch (error) {
    return apiError(error);
  }
}
