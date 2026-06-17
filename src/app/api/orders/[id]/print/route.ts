import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const order = await prisma.posOrder.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: { product: true }
        },
        table: {
          include: { floor: true }
        },
        kotTickets: {
          include: { 
            items: true,
            table: {
              include: { floor: true }
            }
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error: any) {
    console.error('Error fetching order print details:', error);
    return NextResponse.json({ success: false, message: 'Internal server error', error: error.message || String(error) }, { status: 500 });
  }
}
