import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { id } = await params;
    const body = await request.json();
    const { status, notes } = body;

    const waste = await prisma.waste.update({
      where: { 
        id, 
        propertyId: session.propertyId! 
      },
      data: {
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
      }
    });

    return apiResponse(waste, 'Waste record updated successfully');
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { id } = await params;

    await prisma.waste.delete({
      where: { 
        id, 
        propertyId: session.propertyId! 
      }
    });

    return apiResponse(null, 'Waste record deleted successfully');
  } catch (error) {
    return apiError(error);
  }
}
