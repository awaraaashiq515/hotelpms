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
    const { name, status, width, height, x, y } = body;

    const existing = await (prisma as any).parkingSlot.findFirst({
      where: { id, propertyId: session.propertyId! },
    });
    if (!existing) return NextResponse.json({ success: false, message: 'Parking slot not found' }, { status: 404 });

    const slot = await (prisma as any).parkingSlot.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(status && { status }),
        ...(width !== undefined && { width: parseInt(width) }),
        ...(height !== undefined && { height: parseInt(height) }),
        ...(x !== undefined && { x: parseFloat(x) }),
        ...(y !== undefined && { y: parseFloat(y) }),
      },
    });

    if (status === 'VACANT') {
      await (prisma as any).posOrder.updateMany({
        where: {
          parkingSlotId: id,
          status: { notIn: ['SETTLED', 'CANCELLED'] }
        },
        data: {
          parkingSlotId: null
        }
      });
    }

    return NextResponse.json({ success: true, data: slot });
  } catch (error) {
    console.error('Error updating parking slot:', error);
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

    const existing = await (prisma as any).parkingSlot.findFirst({
      where: { id, propertyId: session.propertyId! },
    });
    if (!existing) return NextResponse.json({ success: false, message: 'Parking slot not found' }, { status: 404 });

    // Check for active orders
    const activeOrder = await (prisma as any).posOrder.findFirst({
      where: { parkingSlotId: id, status: { notIn: ['SETTLED', 'CANCELLED'] } },
    });
    if (activeOrder) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete slot with active order' },
        { status: 400 }
      );
    }

    await (prisma as any).parkingSlot.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Parking slot deleted' });
  } catch (error) {
    console.error('Error deleting parking slot:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
