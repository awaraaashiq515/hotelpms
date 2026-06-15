import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, getMultiTenantWhere } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId') || session.propertyId;

    if (!propertyId) return apiError(new Error('propertyId required'), 400);

    const zones = await (prisma as any).deliveryZone.findMany({
      where: { propertyId, isActive: true },
      orderBy: { createdAt: 'asc' }
    });

    return apiResponse(zones, 'Zones fetched');
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const { id, ...data } = body;

    const propertyId = data.propertyId || session.propertyId;
    if (!propertyId) return apiError(new Error('propertyId required'), 400);

    if (id) {
      // UPDATE existing zone
      const updated = await (prisma as any).deliveryZone.update({
        where: { id },
        data: {
          ...data,
          propertyId,
          pincodes: data.pincodes ? JSON.stringify(data.pincodes) : null,
          blackoutDates: data.blackoutDates ? JSON.stringify(data.blackoutDates) : null,
        }
      });
      return apiResponse(updated, 'Zone updated');
    }

    // CREATE new zone
    const zone = await (prisma as any).deliveryZone.create({
      data: {
        propertyId,
        name: data.name,
        type: data.type || 'RADIUS',
        radiusKm: data.radiusKm ? parseFloat(data.radiusKm) : null,
        pincodes: data.pincodes ? JSON.stringify(data.pincodes) : null,
        deliveryFee: parseFloat(data.deliveryFee) || 0,
        minOrderValue: parseFloat(data.minOrderValue) || 0,
        etaMinutes: parseInt(data.etaMinutes) || 30,
        freeDeliveryThreshold: data.freeDeliveryThreshold ? parseFloat(data.freeDeliveryThreshold) : null,
        peakSurchargePercent: parseFloat(data.peakSurchargePercent) || 0,
        peakHoursStart: data.peakHoursStart || null,
        peakHoursEnd: data.peakHoursEnd || null,
        isRainOverride: !!data.isRainOverride,
        rainSurchargePercent: parseFloat(data.rainSurchargePercent) || 0,
        deliveryHoursStart: data.deliveryHoursStart || null,
        deliveryHoursEnd: data.deliveryHoursEnd || null,
        blackoutDates: data.blackoutDates ? JSON.stringify(data.blackoutDates) : null,
        corporateDiscount: parseFloat(data.corporateDiscount) || 0,
        isActive: true,
      }
    });

    return apiResponse(zone, 'Zone created', 201);
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const { id, ...data } = body;
    if (!id) return apiError(new Error('Zone id required'), 400);

    // Handle rain override toggle specifically
    const updateData: any = { ...data };
    if (data.pincodes !== undefined) updateData.pincodes = JSON.stringify(data.pincodes);
    if (data.blackoutDates !== undefined) updateData.blackoutDates = JSON.stringify(data.blackoutDates);

    const updated = await (prisma as any).deliveryZone.update({
      where: { id },
      data: updateData
    });

    return apiResponse(updated, 'Zone updated');
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return apiError(new Error('Zone id required'), 400);

    // Soft delete
    await (prisma as any).deliveryZone.update({
      where: { id },
      data: { isActive: false }
    });

    return apiResponse({ deleted: true }, 'Zone deleted');
  } catch (error) {
    return apiError(error);
  }
}
