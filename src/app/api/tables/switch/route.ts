import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const body = await request.json();
    const { sourceTableId, targetTableId, tabletId } = body;

    let isAuthenticated = !!session;
    
    if (!session && tabletId) {
      const tablet = await prisma.tablet.findUnique({ where: { id: tabletId } });
      if (tablet) {
        isAuthenticated = true;
      }
    }

    if (!isAuthenticated) return apiError(new Error('Unauthorized'), 401);

    if (!sourceTableId || !targetTableId) {
      return apiError(new Error('Source and target table IDs are required'), 400);
    }

    if (sourceTableId === targetTableId) {
      return apiError(new Error('Source and target tables cannot be the same'), 400);
    }

    const result = await prisma.$transaction(async (tx: any) => {
      // Find source table and its active order
      const sourceTable = await tx.table.findUnique({
        where: { id: sourceTableId },
        include: {
          posOrders: {
            where: { status: { in: ['OPEN', 'PENDING'] } },
            take: 1
          }
        }
      });

      if (!sourceTable) throw new Error('Source table not found');
      if (sourceTable.status === 'VACANT') throw new Error('Source table is vacant');
      
      const activeOrder = sourceTable.posOrders[0];
      if (!activeOrder) throw new Error('No active order found on source table');

      // Find target table
      const targetTable = await tx.table.findUnique({
        where: { id: targetTableId }
      });

      if (!targetTable) throw new Error('Target table not found');
      if (targetTable.status !== 'VACANT') throw new Error('Target table is not vacant');

      // Update the order with new table info
      await tx.posOrder.update({
        where: { id: activeOrder.id },
        data: {
          restaurantTableId: targetTableId,
          tableNo: targetTable.name
        }
      });

      // Update all KOT tickets for this order
      await tx.kotTicket.updateMany({
        where: { orderId: activeOrder.id },
        data: {
          restaurantTableId: targetTableId,
          tableNo: targetTable.name
        }
      });

      // Update source table to VACANT
      await tx.table.update({
        where: { id: sourceTableId },
        data: { status: 'VACANT' }
      });

      // Update target table to source table's former status
      await tx.table.update({
        where: { id: targetTableId },
        data: { status: sourceTable.status }
      });

      return { 
        success: true, 
        orderId: activeOrder.id,
        sourceTableId,
        targetTableId,
        targetTableName: targetTable.name
      };
    });

    return apiResponse(result, 'Table switched successfully', 200);
  } catch (error: any) {
    console.error('Switch Table Error:', error);
    return apiError(error);
  }
}
