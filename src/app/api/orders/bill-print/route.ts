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

    // 1. Find the active order for this table
    const activeOrder = await (prisma as any).posOrder.findFirst({
      where: { 
        restaurantTableId, 
        status: { in: ['OPEN', 'PENDING', 'PLACED', 'IN_KITCHEN', 'READY', 'SERVED', 'KOT_RUNNING', 'HOLD', 'PAYMENT_AWAITING_APPROVAL', 'BILL_PRINTED'] } 
      }
    });

    // 2. Update order status to BILL_PRINTED if it exists
    if (activeOrder) {
      await (prisma as any).posOrder.update({
        where: { id: activeOrder.id },
        data: { status: 'BILL_PRINTED' }
      });
    }

    // 3. Update table status to BILL_PRINTED
    const table = await (prisma as any).table.update({
      where: { id: restaurantTableId },
      data: { status: 'BILL_PRINTED' }
    });

    return apiResponse(table, 'Bill printed and table cleared successfully');
  } catch (error) {
    console.error('Bill Print Error:', error);
    return apiError(error);
  }
}
