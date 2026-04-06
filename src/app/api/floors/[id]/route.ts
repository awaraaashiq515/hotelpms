import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.propertyId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, order, outletId } = body;

    const existing = await (prisma as any).floor.findFirst({
      where: { id, propertyId: session.propertyId },
    });
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Floor not found' }, { status: 404 });
    }

    const floor = await (prisma as any).floor.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(order !== undefined && { order }),
        ...(outletId !== undefined && { outletId }),
      },
    });

    return NextResponse.json({ success: true, data: floor });
  } catch (error) {
    console.error('Error updating floor:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.propertyId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const existing = await (prisma as any).floor.findFirst({
      where: { id, propertyId: session.propertyId },
    });
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Floor not found' }, { status: 404 });
    }

    // Check for tables
    const tableCount = await (prisma as any).table.count({ where: { floorId: id } });
    if (tableCount > 0) {
      return NextResponse.json(
        { success: false, message: `Cannot delete space with ${tableCount} table(s). Remove tables first.` },
        { status: 400 }
      );
    }

    await (prisma as any).floor.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Space deleted successfully' });
  } catch (error) {
    console.error('Error deleting floor:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
