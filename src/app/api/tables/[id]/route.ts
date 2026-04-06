import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { status, x, y, width, height, name, capacity } = body;

    // Verify ownership
    const existing = await (prisma as any).table.findFirst({
      where: { id, propertyId: session.propertyId! }
    });
    if (!existing) return NextResponse.json({ success: false, message: 'Table not found' }, { status: 404 });

    const table = await (prisma as any).table.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(x !== undefined && { x }),
        ...(y !== undefined && { y }),
        ...(width !== undefined && { width }),
        ...(height !== undefined && { height }),
        ...(name && { name }),
        ...(capacity !== undefined && { capacity }),
      },
    });

    return NextResponse.json({ success: true, data: table });
  } catch (error) {
    console.error('Error updating table:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    // Verify ownership
    const existing = await (prisma as any).table.findFirst({
      where: { id, propertyId: session.propertyId! }
    });
    if (!existing) return NextResponse.json({ success: false, message: 'Table not found' }, { status: 404 });

    // Check if table has active orders
    const activeOrders = await (prisma as any).posOrder.findFirst({
      where: { restaurantTableId: id, status: { notIn: ['SETTLED', 'CANCELLED'] } }
    });
    if (activeOrders) {
      return NextResponse.json({ success: false, message: 'Cannot delete table with active order' }, { status: 400 });
    }

    await (prisma as any).table.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Table deleted successfully' });
  } catch (error) {
    console.error('Error deleting table:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
