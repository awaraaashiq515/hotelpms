import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

/**
 * GET /api/discounts/settings
 * Fetch discount control settings for the property.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const session = await getSession();
    const propertyCode = searchParams.get('propertyCode');
    const propertyId = searchParams.get('propertyId') || session?.propertyId;

    let property: any = null;
    if (propertyCode) {
      property = await prisma.property.findFirst({
        where: { code: propertyCode.toUpperCase() },
        select: {
          id: true,
          code: true,
          discountApprovalEnabled: true,
          maxStaffDiscountPercent: true,
          maxStaffDiscountAmount: true,
          managerDiscountPin: true,
        },
      });
    } else if (propertyId) {
      property = await prisma.property.findUnique({
        where: { id: propertyId },
        select: {
          id: true,
          code: true,
          discountApprovalEnabled: true,
          maxStaffDiscountPercent: true,
          maxStaffDiscountAmount: true,
          managerDiscountPin: true,
        },
      });
    }

    if (!property) {
      return apiError(new Error('Property not found'), 404);
    }

    return apiResponse(property, 'Discount settings fetched');
  } catch (error: any) {
    console.error('[Discount Settings GET Error]:', error);
    return apiError(error, 500, 'Failed to fetch discount settings');
  }
}

/**
 * PUT /api/discounts/settings
 * Update discount control settings for the property.
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    const body = await request.json();
    const {
      propertyCode,
      propertyId: propIdInput,
      discountApprovalEnabled,
      maxStaffDiscountPercent,
      maxStaffDiscountAmount,
      managerDiscountPin,
    } = body;

    let property: any = null;
    if (propertyCode) {
      property = await prisma.property.findFirst({
        where: { code: propertyCode.toUpperCase() },
      });
    } else if (propIdInput || session?.propertyId) {
      property = await prisma.property.findUnique({
        where: { id: propIdInput || session?.propertyId },
      });
    }

    if (!property) {
      return apiError(new Error('Property not found'), 404);
    }

    const updated = await prisma.property.update({
      where: { id: property.id },
      data: {
        discountApprovalEnabled:
          discountApprovalEnabled !== undefined ? Boolean(discountApprovalEnabled) : undefined,
        maxStaffDiscountPercent:
          maxStaffDiscountPercent !== undefined ? Math.max(0, Number(maxStaffDiscountPercent)) : undefined,
        maxStaffDiscountAmount:
          maxStaffDiscountAmount !== undefined ? Math.max(0, Number(maxStaffDiscountAmount)) : undefined,
        managerDiscountPin:
          managerDiscountPin !== undefined ? String(managerDiscountPin).trim() : undefined,
      },
      select: {
        id: true,
        code: true,
        discountApprovalEnabled: true,
        maxStaffDiscountPercent: true,
        maxStaffDiscountAmount: true,
        managerDiscountPin: true,
      },
    });

    return apiResponse(updated, 'Discount settings updated successfully');
  } catch (error: any) {
    console.error('[Discount Settings PUT Error]:', error);
    return apiError(error, 500, 'Failed to update discount settings');
  }
}
