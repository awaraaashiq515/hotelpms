import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { apiError, apiResponse } from '@/lib/api-utils';
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

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !session.organizationId) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const { id } = await params;
    const body = await request.json();
    const parsedData = staffSchema.parse(body);

    const staffMember = await (prisma as any).staffMember.update({
      where: { id },
      data: {
        name: parsedData.name,
        phone: parsedData.phone || null,
        designation: parsedData.designation || 'Waiter',
        salary: parsedData.salary || 0,
        address: parsedData.address || null,
        emergencyContact: parsedData.emergencyContact || null,
        joiningDate: parsedData.joiningDate ? new Date(parsedData.joiningDate) : undefined,
        isActive: parsedData.isActive !== undefined ? parsedData.isActive : true,
      },
    });

    return apiResponse(staffMember, 'Staff member updated successfully');
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !session.organizationId) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const { id } = await params;

    await (prisma as any).staffMember.delete({
      where: { id },
    });

    return apiResponse(null, 'Staff member deleted successfully');
  } catch (error) {
    return apiError(error);
  }
}
