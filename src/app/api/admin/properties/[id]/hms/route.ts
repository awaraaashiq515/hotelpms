import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { apiError } from '@/lib/api-utils';

// GET — Fetch HMS settings for a property
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { id } = await params;
    const property = await prisma.property.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        code: true,
        type: true,
        hmsEnabled: true,
        totalRooms: true,
        starRating: true,
        hotelCategory: true,
        checkInTime: true,
        checkOutTime: true,
        organizationId: true,
        organization: {
          include: {
            package: {
              include: { features: true }
            }
          }
        }
      }
    });

    if (!property) return apiError(new Error('Property not found'), 404);

    // Access control
    const isSuper = session.role === 'SUPER_ADMIN';
    const isAdmin = session.role === 'RESTAURANTS_ADMIN';
    if (!isSuper && !isAdmin && session.organizationId !== property.organizationId) {
      return apiError(new Error('Unauthorized'), 403);
    }

    // Check if HMS is in their package
    const packageFeatures = property.organization?.package?.features?.map((f: any) => f.feature) ?? [];
    const hmsAllowed = packageFeatures.includes('HMS');
    const hotelLimit = (property.organization?.package as any)?.allowedHotelCount ?? 0;

    return NextResponse.json({
      success: true,
      data: {
        id: property.id,
        name: property.name,
        code: property.code,
        type: property.type,
        hmsEnabled: property.hmsEnabled,
        totalRooms: property.totalRooms,
        starRating: property.starRating,
        hotelCategory: property.hotelCategory,
        checkInTime: property.checkInTime,
        checkOutTime: property.checkOutTime,
        hmsAllowedByPackage: hmsAllowed,
        hotelLimit,
      }
    });
  } catch (error) {
    return apiError(error);
  }
}

// PATCH — Update HMS settings for a property
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'RESTAURANTS_ADMIN')) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const { id } = await params;
    const body = await request.json();
    const { hmsEnabled, totalRooms, starRating, hotelCategory, checkInTime, checkOutTime } = body;

    // Verify property exists and belongs to their org
    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        organization: {
          include: {
            package: { include: { features: true } }
          }
        }
      }
    });

    if (!property) return apiError(new Error('Property not found'), 404);
    if (session.role !== 'SUPER_ADMIN' && session.organizationId !== property.organizationId) {
      return apiError(new Error('Unauthorized'), 403);
    }

    // If enabling HMS, check package allows it
    if (hmsEnabled === true) {
      const packageFeatures = property.organization?.package?.features?.map((f: any) => f.feature) ?? [];
      if (!packageFeatures.includes('HMS')) {
        return apiError(
          new Error('HMS feature is not included in your current package. Please upgrade to enable Hotel Management.'),
          400
        );
      }
    }

    // Update property
    const updated = await prisma.property.update({
      where: { id },
      data: {
        hmsEnabled: hmsEnabled !== undefined ? Boolean(hmsEnabled) : undefined,
        totalRooms: totalRooms !== undefined ? (totalRooms ? Number(totalRooms) : null) : undefined,
        starRating: starRating !== undefined ? (starRating ? Number(starRating) : null) : undefined,
        hotelCategory: hotelCategory !== undefined ? hotelCategory : undefined,
        checkInTime: checkInTime !== undefined ? checkInTime : undefined,
        checkOutTime: checkOutTime !== undefined ? checkOutTime : undefined,
      },
      select: {
        id: true,
        name: true,
        hmsEnabled: true,
        totalRooms: true,
        starRating: true,
        hotelCategory: true,
        checkInTime: true,
        checkOutTime: true,
      }
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: `HMS ${updated.hmsEnabled ? 'enabled' : 'disabled'} successfully for ${property.name}`
    });
  } catch (error) {
    return apiError(error);
  }
}
