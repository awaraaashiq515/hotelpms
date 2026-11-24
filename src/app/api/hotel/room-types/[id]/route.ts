import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';
import { validatePositiveAmount } from '@/lib/validators/indian';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { id } = params;
    if (!id) return apiError(new Error('Room type ID is required'), 400);

    const body = await request.json();
    const { name, code, baseRate, maxOccupancy, baseOccupancy, extraAdultRate, extraChildRate } = body;

    if (baseRate !== undefined && !validatePositiveAmount(Number(baseRate))) {
      return apiError(new Error('Base rate must be a strictly positive number (> 0).'), 400);
    }

    const updated = await prisma.roomType.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(code ? { code } : {}),
        ...(baseRate !== undefined ? { baseRate: Number(baseRate) } : {}),
        ...(maxOccupancy !== undefined ? { maxOccupancy: Number(maxOccupancy) } : {}),
        ...(baseOccupancy !== undefined ? { baseOccupancy: Number(baseOccupancy) } : {}),
        ...(extraAdultRate !== undefined ? { extraAdultRate: Number(extraAdultRate) } : {}),
        ...(extraChildRate !== undefined ? { extraChildRate: Number(extraChildRate) } : {}),
      },
    });

    return apiResponse(updated, 'Room category updated successfully');
  } catch (error) {
    return apiError(error);
  }
}
