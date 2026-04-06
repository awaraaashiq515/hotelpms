import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.propertyId)
      return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const { shiftId, amount, reason, source } = body;

    if (!shiftId || !amount || Number(amount) <= 0)
      return apiError(new Error('shiftId and amount > 0 required'), 400);

    const shift = await prisma.shift.findUnique({ where: { id: shiftId } });
    if (!shift || shift.status !== 'OPEN')
      return apiError(new Error('No open shift found'), 400);

    const topUp = await prisma.cashTopUp.create({
      data: {
        propertyId: session.propertyId,
        shiftId,
        amount: Number(amount),
        reason: reason || null,
        source: source || null,
        addedBy: session.email,
      },
    });

    return apiResponse(topUp, 'Cash top-up recorded', 201);
  } catch (error) {
    return apiError(error);
  }
}
