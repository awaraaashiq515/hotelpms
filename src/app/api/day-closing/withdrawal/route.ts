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
    const { shiftId, amount, reason, approvedBy } = body;

    if (!shiftId || !amount || Number(amount) <= 0)
      return apiError(new Error('shiftId and amount > 0 required'), 400);

    const shift = await prisma.shift.findUnique({ where: { id: shiftId } });
    if (!shift || shift.status !== 'OPEN')
      return apiError(new Error('No open shift found'), 400);

    const withdrawal = await prisma.cashWithdrawal.create({
      data: {
        propertyId: session.propertyId,
        shiftId,
        amount: Number(amount),
        reason: reason || null,
        approvedBy: approvedBy || null,
      },
    });

    return apiResponse(withdrawal, 'Cash withdrawal recorded', 201);
  } catch (error) {
    return apiError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const shiftId = searchParams.get('shiftId');

    const withdrawals = await prisma.cashWithdrawal.findMany({
      where: {
        propertyId: session.propertyId!,
        ...(shiftId ? { shiftId } : {}),
      },
      orderBy: { withdrawnAt: 'desc' },
      take: 50,
    });

    return apiResponse(withdrawals);
  } catch (error) {
    return apiError(error);
  }
}
