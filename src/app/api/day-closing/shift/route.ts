import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, getMultiTenantWhere } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

// GET: fetch current open shift for this property
// POST: open a new shift
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const where = getMultiTenantWhere(session);
    (where as any).status = 'OPEN';

    const shift = await prisma.shift.findFirst({
      where,
      include: {
        withdrawals: { orderBy: { withdrawnAt: 'desc' } },
        topUps: { orderBy: { addedAt: 'desc' } },
      },
      orderBy: { openedAt: 'desc' },
    });

    return apiResponse(shift);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.propertyId)
      return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const { openingCash, cashierName, notes } = body;

    // Only one open shift per property
    const existing = await prisma.shift.findFirst({
      where: { propertyId: session.propertyId, status: 'OPEN' },
    });
    if (existing) {
      return apiError(new Error('A shift is already open. Close current shift before opening a new one.'), 409);
    }

    const count = await prisma.shift.count({ where: { propertyId: session.propertyId } });
    const shiftNo = `SFT-${(count + 1).toString().padStart(4, '0')}`;

    const shift = await prisma.shift.create({
      data: {
        propertyId: session.propertyId,
        cashierId: session.id,
        cashierName: cashierName || session.email,
        shiftNo,
        openingCash: Number(openingCash || 0),
        notes: notes || null,
        status: 'OPEN',
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        propertyId: session.propertyId,
        userId: session.id,
        moduleName: 'SHIFT',
        actionType: 'OPEN',
        recordId: shift.id,
        newData: JSON.stringify({ shiftNo, openingCash }),
      },
    });

    return apiResponse(shift, `Shift ${shiftNo} opened successfully`, 201);
  } catch (error) {
    return apiError(error);
  }
}
