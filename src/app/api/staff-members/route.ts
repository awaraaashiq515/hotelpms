import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { apiError, apiResponse, getMultiTenantWhere } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

const staffSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().optional(),
  designation: z.string().optional(),
  salary: z.number().min(0).optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  joiningDate: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.organizationId) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const { searchParams } = new URL(request.url);
    const propertyIdParam = searchParams.get('propertyId');

    const staffMembers = await (prisma as any).staffMember.findMany({
      where: getMultiTenantWhere(session, propertyIdParam),
      orderBy: { createdAt: 'desc' },
    });

    return apiResponse(staffMembers, 'Staff members fetched successfully');
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.organizationId) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const body = await request.json();
    const parsedData = staffSchema.parse(body);

    const staffMember = await (prisma as any).staffMember.create({
      data: {
        name: parsedData.name,
        phone: parsedData.phone || null,
        designation: parsedData.designation || 'Waiter',
        salary: parsedData.salary || 0,
        address: parsedData.address || null,
        emergencyContact: parsedData.emergencyContact || null,
        joiningDate: parsedData.joiningDate ? new Date(parsedData.joiningDate) : new Date(),
        isActive: parsedData.isActive !== undefined ? parsedData.isActive : true,
        propertyId: session.propertyId!,
      },
    });

    return apiResponse(staffMember, 'Staff member created successfully', 201);
  } catch (error) {
    return apiError(error);
  }
}
