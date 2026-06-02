import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { apiError, apiResponse, getMultiTenantWhere } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const propertyIdParam = searchParams.get('propertyId') || session.propertyId;

    if (!propertyIdParam && session.role === 'POSSYSTEM') {
      return apiError(new Error('Property ID is required'), 400);
    }

    const where = getMultiTenantWhere(session, propertyIdParam);

    let [floors, allTables] = await Promise.all([
      (prisma as any).floor.findMany({
        where: where,
        orderBy: { order: 'asc' },
      }),
      (prisma as any).table.findMany({
        where: where,
        orderBy: { name: 'asc' },
      })
    ]);

    // Lazy initialization: Auto-create Ground Floor if missing
    if (floors.length === 0 && propertyIdParam) {
      const defaultOutlet = await (prisma as any).outlet.findFirst({
        where: { propertyId: propertyIdParam }
      });
      const newFloor = await (prisma as any).floor.create({
        data: {
          name: 'Ground Floor',
          order: 1,
          propertyId: propertyIdParam,
          outletId: defaultOutlet?.id || null,
        }
      });
      floors = [newFloor];
    }

    // Fetch active orders separately to link
    const openOrders = await (prisma as any).posOrder.findMany({
      where: { 
        ...where,
        status: { in: ['OPEN', 'PENDING', 'PLACED', 'IN_KITCHEN', 'READY', 'SERVED', 'BILL_PRINTED', 'KOT_RUNNING', 'HOLD', 'PAYMENT_AWAITING_APPROVAL'] }
      },
      include: {
        items: { 
          select: { 
            quantity: true, 
            productId: true, 
            portion: true, 
            variantName: true,
            product: { select: { name: true } }
          } 
        },
        kotTickets: { select: { id: true } },
        staffMember: { select: { id: true, name: true } }
      },
    });

    const formattedData = floors.map((floor: any) => ({
      ...floor,
      tables: (allTables || [])
        .filter((t: any) => t.floorId === floor.id)
        .map((table: any) => {
          let activeOrder = null;
          // Link the open orders for this table if it exists AND the table is not vacant
          const tableOrders = table.status !== 'VACANT' 
            ? openOrders.filter((o: any) => o.restaurantTableId === table.id)
            : [];
          
          if (tableOrders.length > 0) {
            // Use the most recent order for status and elapsed time
            const primaryOrder = tableOrders[0]; 
            const totalAmount = primaryOrder.grandTotal || 0;
            const totalSubtotal = primaryOrder.subtotal || 0;
            const totalTax = primaryOrder.taxAmount || 0;
            const totalItems = primaryOrder.items?.reduce((sum: number, i: any) => sum + (i.quantity || 0), 0) || 0;
            
            const elapsedTime = Math.round((Date.now() - new Date((primaryOrder as any).createdAt).getTime()) / 60000);
            
            let displayStatus = primaryOrder.status;
            let readyAt = null;

            if (tableOrders.some((o: any) => o.status === 'BILL_PRINTED')) displayStatus = 'BILL_PRINTED';
            else if (tableOrders.some((o: any) => o.status === 'IN_KITCHEN' || o.status === 'KOT_RUNNING')) displayStatus = 'KOT_RUNNING';
            else if (tableOrders.some((o: any) => o.status === 'READY')) {
              displayStatus = 'READY';
              readyAt = tableOrders.find((o: any) => o.status === 'READY')?.updatedAt || null;
            }
            else if (tableOrders.some((o: any) => o.status === 'SERVED')) displayStatus = 'SERVED';
            else if (tableOrders.some((o: any) => o.status === 'HOLD')) displayStatus = 'HOLD';

            activeOrder = {
              id: primaryOrder.id,
              orderIds: tableOrders.map((o: any) => o.id),
              amount: totalAmount,
              subtotal: totalSubtotal,
              taxAmount: totalTax,
              itemCount: totalItems,
              kotCount: tableOrders.reduce((sum: number, o: any) => sum + (o.kotTickets?.length || 0), 0),
              elapsedTime: Math.max(0, elapsedTime),
              status: displayStatus,
              orderCount: tableOrders.length,
              waiterName: primaryOrder.staffMember?.name || null,
              preparationTime: primaryOrder.preparationTime || 15,
              readyAt
            };
          }

          return {
            ...table,
            activeOrder,
          };
        }),
    }));

    return NextResponse.json({ success: true, data: formattedData });
  } catch (error) {
    console.error('Error fetching floors:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { name, order, outletId, menuType } = body;

    if (!name) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    const propertyId = session.propertyId || body.propertyId;
    if (!propertyId) {
      return NextResponse.json({ success: false, message: 'Property ID is required' }, { status: 400 });
    }

    const floor = await prisma.floor.create({
      data: {
        name,
        order: order || 0,
        propertyId: propertyId,
        outletId: outletId || null,
        menuType: menuType || 'RESTAURANT',
      },
    });
    
    return NextResponse.json({ success: true, data: floor });
  } catch (error) {
    console.error('Error creating floor:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
