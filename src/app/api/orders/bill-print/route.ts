import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

/**
 * Marks a table as BILL_PRINTED for draft bill preview.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const { restaurantTableId } = body;

    if (!restaurantTableId) {
      return apiError(new Error('Table ID is required'), 400);
    }

    // Update table status to BILL_PRINTED
    const table = await (prisma as any).table.update({
      where: { id: restaurantTableId },
      data: { status: 'BILL_PRINTED' }
    });

    return apiResponse(table, 'Draft bill status updated successfully');
  } catch (error) {
    console.error('Bill Print Error:', error);
    return apiError(error);
  }
}
