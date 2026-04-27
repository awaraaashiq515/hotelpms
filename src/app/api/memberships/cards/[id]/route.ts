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
    const { status, guestId, expiresAt } = body;

    const card = await prisma.membershipCard.update({
      where: { id },
      data: {
        status,
        guestId,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      },
    });

    return apiResponse(card, 'Membership Card updated');
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

    await prisma.membershipCard.delete({
      where: { id },
    });

    return apiResponse(null, 'Membership Card deleted');
  } catch (error) {
    return apiError(error);
  }
}
