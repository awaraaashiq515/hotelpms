import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const guests = await prisma.guest.findMany({
      where: {
        organization: { properties: { some: { id: session.propertyId! } } }
      },
      include: {
        _count: { select: { folios: true, checkIns: true, posOrders: true } },
        folios: { select: { totalCharges: true } },
        invoices: { select: { totalAmount: true } },
        posOrders: { 
          where: { status: 'SETTLED' },
          select: { grandTotal: true } 
        }
      },
      orderBy: { firstName: 'asc' }
    });

    const enriched = guests.map((g: any) => {
      const folioSpend = g.folios.reduce((s: number, f: any) => s + (f.totalCharges || 0), 0);
      const invoiceSpend = g.invoices.reduce((s: number, i: any) => s + (i.totalAmount || 0), 0);
      const posSpend = g.posOrders.reduce((s: number, p: any) => s + (p.grandTotal || 0), 0);
      
      const totalSpend = folioSpend + invoiceSpend + posSpend;
      const totalVisits = (g._count.checkIns || 0) + (g._count.posOrders || 0);

      return {
        id: g.id,
        name: `${g.firstName} ${g.lastName || ''}`,
        mobile: g.mobile,
        email: g.email,
        totalVisits,
        totalSpend
      };
    }).sort((a, b) => b.totalSpend - a.totalSpend);

    return apiResponse(enriched);
  } catch (error) {
    return apiError(error);
  }
}
