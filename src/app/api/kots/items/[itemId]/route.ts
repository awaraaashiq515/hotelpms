import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { itemId } = await params;
    const body = await request.json();
    const { status, remarks } = body;

    const oldKotItem = await (prisma as any).kotItem.findUnique({
      where: { id: itemId },
      include: { kot: true }
    });

    if (!oldKotItem) {
      return NextResponse.json({ success: false, error: 'KOT Item not found' }, { status: 404 });
    }

    const updatedItem = await prisma.$transaction(async (tx: any) => {
      // 1. Update the KotItem
      const item = await (tx as any).kotItem.update({
        where: { id: itemId },
        data: { status }
      });

      // 2. Add Audit Log
      await (tx as any).kotStatusLog.create({
        data: {
          kotId: item.kotId,
          oldStatus: oldKotItem.status,
          newStatus: status,
          remarks: remarks || `Item ${item.itemName} marked as ${status}`,
          changedBy: (session as any).user?.name || 'System',
        }
      });

      // 3. Check if all items in this KOT are now SERVED or CANCELLED
      const allItems = await (tx as any).kotItem.findMany({
        where: { kotId: item.kotId }
      });
      
      const allDone = allItems.every((i: any) => i.status === 'SERVED' || i.status === 'CANCELLED');
      if (allDone && oldKotItem.kot.status !== 'SERVED') {
        await (tx as any).kotTicket.update({
          where: { id: item.kotId },
          data: { status: 'SERVED' }
        });
      }

      return item;
    });

    return NextResponse.json({ success: true, data: updatedItem });
  } catch (error: any) {
    console.error('KOT Item Update Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
