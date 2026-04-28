import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const { tableId, driverId } = body;

    if (!tableId) {
      return apiError(new Error('Table ID is required to open an order'), 400);
    }

    const result = await prisma.$transaction(async (tx: any) => {
      // Find the table
      const table = await (tx as any).table.findUnique({
        where: { id: tableId },
      });

      if (!table) throw new Error('Table not found');

      // Check if there is already an active order for this table
      const existingOrder = await (tx as any).posOrder.findFirst({
        where: {
          restaurantTableId: tableId,
          status: { in: ['OPEN', 'PENDING'] },
          orderType: 'DINE_IN'
        }
      });

      if (existingOrder) {
        // Table is already occupied, update the driver if provided now
        if (driverId) {
          await (tx as any).posOrder.update({
            where: { id: existingOrder.id },
            data: { driverId }
          });
          existingOrder.driverId = driverId;
        }
        return { order: existingOrder, newlyCreated: false };
      }

      // Find an outlet for the property
      let outlet = await tx.outlet.findFirst({
        where: { propertyId: session.propertyId! }
      });
      
      if (!outlet) {
        // Fallback: Create a default outlet if one is missing (Self-healing)
        outlet = await (tx as any).outlet.create({
          data: {
            name: 'Main Outlet',
            type: 'POS',
            propertyId: session.propertyId!,
          }
        });
      }

      if (!outlet) throw new Error('POS Outlet could not be initialized.');

      // Create a new OPEN order
      const newOrder = await (tx as any).posOrder.create({
        data: {
          propertyId: session.propertyId!,
          outletId: (outlet as any).id,
          orderNo: `POS-${Date.now()}`,
          orderType: 'DINE_IN',
          status: 'OPEN',
          restaurantTableId: tableId,
          tableNo: table.name,
          driverId: driverId || null
        }
      });

      // Update table status to OCCUPIED
      await (tx as any).table.update({
        where: { id: tableId },
        data: { status: 'OCCUPIED' }
      });

      return { order: newOrder, newlyCreated: true };
    });

    return apiResponse(result, 'Order opened successfully', 201);
  } catch (error) {
    console.error('Open Order Error:', error);
    return apiError(error);
  }
}
