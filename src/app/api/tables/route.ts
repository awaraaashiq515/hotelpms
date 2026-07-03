import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, apiResponse, getMultiTenantWhere } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const propertyIdParam = searchParams.get('propertyId');
    const floorId = searchParams.get('floorId');
    const showAll = searchParams.get('showAll') === 'true'; // bypass assignment filter for Take Order

    const isWaiter = session.role?.toLowerCase() === 'staff';
    let assignedTableIds: string[] | null = null;
    if (isWaiter && !showAll) {
      const assignments = await prisma.tableAssignment.findMany({
        where: { userId: session.id },
        select: { tableId: true }
      });
      assignedTableIds = assignments.map((a: { tableId: string }) => a.tableId);
    }

    const tables = await prisma.table.findMany({
      where: {
        ...getMultiTenantWhere(session, propertyIdParam),
        ...(floorId && floorId !== 'all' ? { floorId } : {}),
        ...(assignedTableIds !== null ? { id: { in: assignedTableIds } } : {}),
      },
      include: {
        floor: true,
        property: true,
        posOrders: {
          where: { status: { notIn: ['SETTLED', 'CANCELLED'] } },
          include: {
            items: {
              include: {
                product: true,
                kotItems: {
                  where: { status: { not: 'CANCELLED' } }
                }
              }
            },
            kotTickets: {
              include: { items: true }
            },
            staffMember: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { name: 'asc' },
    });

    // Calculate dynamic data for each table
    const enhancedTables = tables.map((table: any) => {
      const activeOrder = table.posOrders[0];
      
      if (!activeOrder) {
        return { ...table, activeOrder: null };
      }

      const totalQuantity = activeOrder.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
      const kotCount = activeOrder.kotTickets.length;
      
      // Calculate elapsed time from the first KOT or order creation
      let elapsedTime = 0;
      const firstKot = activeOrder.kotTickets.sort((a: any, b: any) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )[0];
      
      if (firstKot) {
        elapsedTime = Math.floor((new Date().getTime() - new Date(firstKot.createdAt).getTime()) / 60000);
      } else {
        elapsedTime = Math.floor((new Date().getTime() - new Date(activeOrder.createdAt).getTime()) / 60000);
      }

      return {
        ...table,
        activeOrder: {
          id: activeOrder.id,
          orderNo: activeOrder.orderNo,
          orderType: activeOrder.orderType,
          guestCount: activeOrder.guestCount,
          subtotal: activeOrder.subtotal,
          taxAmount: activeOrder.taxAmount,
          discountAmount: activeOrder.discountAmount,
          grandTotal: activeOrder.grandTotal,
          amount: activeOrder.grandTotal,
          itemCount: totalQuantity,
          kotCount,
          elapsedTime,
          createdAt: activeOrder.createdAt,
          staffMemberId: activeOrder.staffMemberId,
          staffMember: activeOrder.staffMember,
          kotTickets: activeOrder.kotTickets,
          status: activeOrder.status,
          items: activeOrder.items.map((pi: any) => ({
            ...pi,
            product: pi.product
          }))
        }
      };
    });


    return NextResponse.json({ success: true, data: enhancedTables });
  } catch (error) {


    console.error('Error fetching tables:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { name, floorId, capacity, x, y } = body;

    if (!name || !floorId) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    const table = await (prisma as any).table.create({
      data: {
        name,
        floorId,
        propertyId: session.propertyId!,
        capacity: capacity || 4,
        x: x || 0,
        y: y || 0,
        status: 'VACANT',
      },
    });

    return NextResponse.json({ success: true, data: table });
  } catch (error) {
    console.error('Error creating table:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
