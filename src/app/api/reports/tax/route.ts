import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return apiError(new Error('Start and End dates are required (YYYY-MM-DD)'), 400);
    }

    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T23:59:59.999');

    // 1. Fetch settled POS orders
    const settledOrders = await prisma.posOrder.findMany({
      where: {
        propertyId: session.propertyId!,
        status: 'SETTLED',
        createdAt: { gte: start, lte: end },
      },
      select: {
        orderNo: true,
        subtotal: true,
        taxAmount: true,
        grandTotal: true,
        createdAt: true,
      }
    });

    // 2. Fetch settled Invoices (from Room Service / PM)
    const settledInvoices = await prisma.invoice.findMany({
      where: {
        propertyId: session.propertyId!,
        paymentStatus: 'PAID',
        invoiceDate: { gte: start, lte: end },
        posOrderId: null, // Exclude invoices linked to POS orders to avoid double counting
      },
      select: {
        invoiceNo: true,
        subtotal: true,
        taxAmount: true,
        totalAmount: true,
        invoiceDate: true,
      }
    });

    const totalTax = settledOrders.reduce((s: any, o: any) => s + o.taxAmount, 0) + 
                     settledInvoices.reduce((s: any, i: any) => s + i.taxAmount, 0);
    
    const totalTaxable = settledOrders.reduce((s: any, o: any) => s + o.subtotal, 0) + 
                        settledInvoices.reduce((s: any, i: any) => s + i.subtotal, 0);

    return apiResponse({
      summary: {
        totalTaxable,
        totalTax,
        combinedTotal: totalTaxable + totalTax,
      },
      posOrders: settledOrders,
      invoices: settledInvoices
    });
  } catch (error) {
    return apiError(error);
  }
}
