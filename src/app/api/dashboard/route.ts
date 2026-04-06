import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError, apiResponse } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')

    if (!propertyId) {
      return apiError(new Error('propertyId is required'), 400)
    }

    // Calculate dates for "Today"
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    // 1. Today's Revenue (from Invoices created today)
    const todaysInvoices = await prisma.invoice.aggregate({
      where: {
        propertyId,
        invoiceDate: { gte: todayStart, lte: todayEnd },
      },
      _sum: { totalAmount: true },
      _count: { id: true }
    })

    // 2. Open Orders (Not invoiced / Unsettled)
    const openOrdersCount = await prisma.posOrder.count({
      where: {
        propertyId,
        status: 'PENDING'
      }
    })

    // 3. Low Stock Alerts (Items hitting reorder level)
    const lowStockItemsCount = await prisma.stockItem.count({
      where: {
        propertyId,
        // Prisma can't easily do WHERE running_balance < minimum_stock without raw SQL,
        // so for MVP we just pull items where someone has set minimumStock > 0
        minimumStock: { gt: 0 }
      }
    })

    // 4. Receivables (Unpaid Invoices)
    const unpaidInvoices = await prisma.invoice.aggregate({
      where: {
        propertyId,
        paymentStatus: { in: ['UNPAID', 'PARTIAL'] }
      },
      _sum: { totalAmount: true } // Technically should be Due Amount, keeping simple for MVP
    })


    const analytics = {
      todayRevenue: todaysInvoices._sum.totalAmount || 0,
      todayInvoiceCount: todaysInvoices._count.id || 0,
      openOrders: openOrdersCount,
      lowStockAlerts: lowStockItemsCount,
      totalReceivables: unpaidInvoices._sum.totalAmount || 0,
    }

    return apiResponse(analytics, 'Dashboard stats fetched successfully')
  } catch (error) {
    return apiError(error)
  }
}
