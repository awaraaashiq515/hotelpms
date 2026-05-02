import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { apiError, getMultiTenantWhere } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const lastSeenId = searchParams.get('lastSeenId');

    let where = getMultiTenantWhere(session);
    
    // Fetch orders that are either paymentRequested: true OR settled recently
    const threshold = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours

    const notifications = await prisma.posOrder.findMany({
      where: {
        ...where,
        updatedAt: { gte: threshold },
        OR: [
          { paymentRequested: true },
          { status: 'SETTLED' }
        ]
      },
      include: {
        table: { select: { name: true } },
        guest: { select: { firstName: true, lastName: true } }
      },
      orderBy: { updatedAt: 'desc' },
      take: 20
    });

    // Map to a cleaner notification format
    const formatted = notifications.map((o: any) => ({
      id: o.id,
      type: o.status === 'SETTLED' ? 'PAYMENT_RECEIVED' : 'PAYMENT_REQUESTED',
      title: o.status === 'SETTLED' ? 'Payment Received' : 'Payment Requested',
      message: `${o.status === 'SETTLED' ? 'Received ₹' : 'Requested ₹'}${o.grandTotal} from ${o.table?.name || 'Table ' + o.tableNo}`,
      amount: o.grandTotal,
      tableName: o.table?.name || o.tableNo,
      timestamp: o.updatedAt,
      orderNo: o.orderNo
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    return apiError(error);
  }
}
