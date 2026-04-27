import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const { name, description, discountType, discountValue, minOrderValue, validityDays, isActive } = body;

    const plan = await prisma.membershipPlan.update({
      where: { id },
      data: {
        name,
        description,
        discountType,
        discountValue: Number(discountValue),
        minOrderValue: Number(minOrderValue || 0),
        validityDays: Number(validityDays || 365),
        isActive: isActive !== false,
      },
    });

    return apiResponse(plan, 'Membership Plan updated');
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    await prisma.membershipPlan.delete({
      where: { id },
    });

    return apiResponse(null, 'Membership Plan deleted');
  } catch (error) {
    return apiError(error);
  }
}
