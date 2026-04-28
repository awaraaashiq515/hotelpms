import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { apiError, apiResponse, getMultiTenantWhere } from '@/lib/api-utils'
import { getSession } from '@/lib/session'

const invoiceItemSchema = z.object({
  productId: z.string().optional(),
  description: z.string().optional(),
  qty: z.number().min(1, 'Quantity must be > 0'),
  unitPrice: z.number().min(0),
  taxAmount: z.number().default(0),
})

const invoiceSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  guestId: z.string().optional(),
  folioId: z.string().optional(),
  paymentStatus: z.enum(['PAID', 'UNPAID', 'PARTIAL']).default('UNPAID'),
  items: z.array(invoiceItemSchema).min(1, 'Invoice must contain at least 1 item'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items, ...invoiceData } = invoiceSchema.parse(body)

    let subtotal = 0
    let taxAmount = 0
    let discountAmount = 0 // In full version, extracted from body if applied to invoice level

    const sanitizedItems = items.map((item: any) => {
      const lineTotal = (item.qty * item.unitPrice) + item.taxAmount
      subtotal += (item.qty * item.unitPrice)
      taxAmount += item.taxAmount

      return {
        productId: item.productId,
        description: item.description,
        qty: item.qty,
        unitPrice: item.unitPrice,
        taxAmount: item.taxAmount,
        totalAmount: lineTotal,
      }
    })

    const totalAmount = subtotal - discountAmount + taxAmount

    const newInvoice = await prisma.$transaction(async (tx: any) => {
      // Create Header
      const invoice = await tx.invoice.create({
        data: {
          ...invoiceData,
          invoiceNo: `INV-${Date.now()}`,
          invoiceStatus: 'ACTIVE',
          subtotal,
          taxAmount,
          discountAmount,
          totalAmount,
        }
      })

      // Create Lines
      await tx.invoiceItem.createMany({
        data: sanitizedItems.map((item: any) => ({ ...item, invoiceId: invoice.id }))
      })

      return await tx.invoice.findUnique({
        where: { id: invoice.id },
        include: { items: { include: { product: true } }, guest: true }
      })
    })

    return apiResponse(newInvoice, 'Invoice generated successfully', 201)
  } catch (error) {
    return apiError(error)
  }
}


// ... (schema stays same)

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const { searchParams } = new URL(request.url)
    const propertyIdParam = searchParams.get('propertyId')
    const guestId = searchParams.get('guestId')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = getMultiTenantWhere(session, propertyIdParam);

    if (guestId) where.guestId = guestId;
    if (status && status !== 'ALL' && status !== 'undefined' && status !== 'null') {
      where.paymentStatus = status;
    }

    // Role-based filtering for CANCELLED invoices
    if (session.role === 'POSSYSTEM') {
      where.invoiceStatus = { not: 'CANCELLED' };
    }

    if (startDate || endDate) {
      where.invoiceDate = {};
      if (startDate) where.invoiceDate.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.invoiceDate.lte = end;
      }
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        guest: { select: { firstName: true, lastName: true, mobile: true } },
        property: { select: { name: true, city: true } },
        _count: { select: { items: true } }
      },
      orderBy: { invoiceDate: 'desc' },
      take: 100
    })

    // Enhance with Paid/Due amounts from Settlements
    const enhancedInvoices = await Promise.all(invoices.map(async (inv) => {
      const settlements = await prisma.settlement.findMany({
        where: { sourceId: inv.id, sourceType: 'INVOICE' }
      });
      const paidAmount = settlements.reduce((sum, s) => sum + s.paidAmount, 0);
      return {
        ...inv,
        paidAmount,
        dueAmount: inv.totalAmount - paidAmount
      };
    }));

    return apiResponse(enhancedInvoices, 'Invoices fetched successfully')
  } catch (error) {
    return apiError(error)
  }
}
