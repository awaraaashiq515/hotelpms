import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.propertyId) {
      return apiError(new Error('Unauthorized'), 401);
    }

    // 1. Fetch all customers who have invoices
    const guests = await prisma.guest.findMany({
      where: {
        organizationId: session.organizationId,
      },
      include: {
        invoices: {
          where: {
            propertyId: session.propertyId,
            paymentStatus: { in: ['UNPAID', 'PARTIAL'] },
            invoiceStatus: 'ACTIVE'
          }
        }
      }
    });

    // 2. For each guest, calculate total outstanding by checking settlements
    const outstandingData = await Promise.all(guests.map(async (guest: any) => {
      let guestTotalDue = 0;
      const invoiceSummaries = await Promise.all(guest.invoices.map(async (inv: any) => {
        const settlements = await prisma.settlement.findMany({
          where: { sourceId: inv.id, sourceType: 'INVOICE' }
        });
        const paid = settlements.reduce((sum: any, s: any) => sum + s.paidAmount, 0);
        const due = inv.totalAmount - paid;
        guestTotalDue += due;
        return {
          id: inv.id,
          invoiceNo: inv.invoiceNo,
          total: inv.totalAmount,
          paid,
          due
        };
      }));

      return {
        id: guest.id,
        firstName: guest.firstName,
        lastName: guest.lastName,
        mobile: guest.mobile,
        totalOutstanding: guestTotalDue,
        pendingInvoicesCount: guest.invoices.length,
        invoices: invoiceSummaries
      };
    }));

    // Filter only those with actual outstanding balance
    const filtered = outstandingData.filter(d => d.totalOutstanding > 0);

    return apiResponse(filtered, 'Outstanding dues fetched successfully');
  } catch (error) {
    return apiError(error);
  }
}
