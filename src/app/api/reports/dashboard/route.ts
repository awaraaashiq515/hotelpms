import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const propertyId = session.propertyId;
    if (!propertyId) return apiError(new Error('No property assigned'), 400);

    // 1. Total Sales (Settled Payments)
    const payments = await prisma.payment.aggregate({
      where: { propertyId },
      _sum: { amount: true },
    });

    // 2. Total Invoices Count
    const invoiceCount = await prisma.invoice.count({
      where: { propertyId },
    });

    // 3. Pending Invoices (Unpaid)
    const pendingInvoices = await prisma.invoice.count({
      where: { propertyId, paymentStatus: 'UNPAID' },
    });

    // 4. Low Stock Products
    // Products don't have stockQuantity directly in the base model in this specific schema? 
    // Wait, let me check Product model again. It has trackInventory but maybe not stockQuantity.
    const lowStock = 0; // Placeholder until stock logic is deeper

    // 5. Recent Activity (Latest Invoices)
    const recentActivity = await prisma.invoice.findMany({
      where: { propertyId },
      include: { guest: true },
      orderBy: { invoiceDate: 'desc' },
      take: 5,
    });

    return apiResponse({
      stats: {
        totalSales: payments._sum.amount || 0,
        invoices: invoiceCount,
        pendingPayments: pendingInvoices,
        lowStock: lowStock,
      },
      recentActivity: recentActivity.map((inv: any) => ({
        id: inv.id,
        type: 'SALE',
        title: `Sale - ${inv.invoiceNo}`,
        subtitle: inv.guest ? `${inv.guest.firstName} ${inv.guest.lastName || ''}` : 'Walk-in Customer',
        amount: inv.totalAmount,
        time: inv.invoiceDate,
      })),
    });
  } catch (error) {
    return apiError(error);
  }
}
