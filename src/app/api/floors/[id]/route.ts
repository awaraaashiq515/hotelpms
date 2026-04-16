import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { name, order } = body;

    const floor = await (prisma as any).floor.update({
      where: { id: id },
      data: {
        ...(name && { name }),
        ...(order !== undefined && { order }),
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
    const { id } = await params;
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    // Note: Tables have a relation with Floor. 
    // We should delete tables first if we want to cascade, or use Prisma cascade.
    // Let's manually delete tables first to be safe if no cascade is defined in schema.
    await (prisma as any).table.deleteMany({
      where: { floorId: id }
    });

    await (prisma as any).floor.delete({
      where: { id: id },
    });

    return NextResponse.json({ success: true, message: 'Floor deleted successfully' });
  } catch (error) {
    console.error('Error deleting floor:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
