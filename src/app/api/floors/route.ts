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
        status: { in: ['OPEN', 'PENDING', 'PLACED', 'IN_KITCHEN', 'READY', 'BILL_PRINTED'] }
      },
      include: {
        items: true,
        kotTickets: true,
      },
    });

    const formattedData = floors.map((floor: any) => ({
      ...floor,
      tables: (allTables || [])
        .filter((t: any) => t.floorId === floor.id)
        .map((table: any) => {
          let activeOrder = null;
          // Link the open order for this table if it exists
          const openOrder = openOrders.find((o: any) => o.restaurantTableId === table.id);
          
          if (openOrder) {
            const elapsedTime = Math.round((Date.now() - new Date((openOrder as any).createdAt).getTime()) / 60000);
            activeOrder = {
              id: openOrder.id,
              amount: openOrder.grandTotal || 0,
              itemCount: openOrder.items.reduce((sum: number, item: any) => sum + item.quantity, 0),
              kotCount: openOrder.kotTickets.length,
              elapsedTime: Math.max(0, elapsedTime),
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
    const { name, order, outletId } = body;

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
        outletId,
      },
    });
    
    return NextResponse.json({ success: true, data: floor });
  } catch (error) {
    console.error('Error creating floor:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
