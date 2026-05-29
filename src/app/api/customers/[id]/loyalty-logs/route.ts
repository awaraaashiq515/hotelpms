import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { id } = await params;

    const logs = await prisma.loyaltyLog.findMany({
      where: { guestId: id },
      orderBy: { createdAt: 'desc' },
    });

    return apiResponse(logs);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { id } = await params;
    const body = await request.json();
    const { points, reason } = body;

    if (!points || isNaN(Number(points))) {
      return apiError(new Error('Invalid points value'), 400);
    }

    const guest = await prisma.guest.findUnique({
      where: { id },
    });

    if (!guest) {
      return apiError(new Error('Guest not found'), 404);
    }

    const finalPoints = Number(points);
    const newBalance = Math.max(0, guest.loyaltyPoints + finalPoints);

    // Update guest loyalty points and log the transaction in a db transaction
    const result = await prisma.$transaction(async (tx: any) => {
      const updatedGuest = await tx.guest.update({
        where: { id },
        data: { loyaltyPoints: newBalance },
      });

      const log = await tx.loyaltyLog.create({
        data: {
          guestId: id,
          points: finalPoints,
          reason: reason || 'Points adjusted by Administrator',
        },
      });

      return { updatedGuest, log };
    });

    return apiResponse(result.updatedGuest, 'Loyalty points adjusted successfully');
  } catch (error) {
    return apiError(error);
  }
}
