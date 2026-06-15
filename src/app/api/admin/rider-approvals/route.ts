import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'SUPER_ADMIN') {
      return apiError(new Error('Unauthorized'), 401);
    }

    const riders = await prisma.user.findMany({
      where: {
        role: { name: 'DELIVERY_RIDER' }
      },
      include: {
        property: {
          select: { name: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formatted = riders.map((r: any) => ({
      id: r.id,
      name: r.fullName,
      phone: r.phone,
      email: r.email,
      vehicleNumber: r.vehicleNumber,
      vehicleType: r.vehicleType || 'BIKE',
      isActive: r.isActive,
      propertyId: r.propertyId,
      propertyName: r.property?.name || 'All Outlets (Multi-Restaurant)',
      createdAt: r.createdAt.toISOString()
    }));

    return apiResponse(formatted, 'Riders fetched successfully');
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'SUPER_ADMIN') {
      return apiError(new Error('Unauthorized'), 401);
    }

    const body = await request.json();
    const { riderId, action } = body;

    if (!riderId) {
      return apiError(new Error('riderId is required'), 400);
    }

    if (action === 'approve') {
      const updated = await prisma.user.update({
        where: { id: riderId },
        data: { isActive: true }
      });
      return apiResponse(updated, 'Rider account approved successfully');
    }

    if (action === 'deactivate') {
      const updated = await prisma.user.update({
        where: { id: riderId },
        data: { isActive: false }
      });
      return apiResponse(updated, 'Rider account deactivated successfully');
    }

    if (action === 'delete') {
      await prisma.user.delete({
        where: { id: riderId }
      });
      return apiResponse({ deleted: true }, 'Rider account deleted successfully');
    }

    return apiError(new Error('Invalid action'), 400);
  } catch (error) {
    return apiError(error);
  }
}
