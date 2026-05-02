import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { apiError, apiResponse, getMultiTenantWhere } from '@/lib/api-utils'
import { getSession } from '@/lib/session'

const settlementSchema = z.object({
  propertyId: z.string().optional(),
  sourceType: z.enum(['INVOICE', 'FOLIO']),
  sourceId: z.string().min(1, 'Source ID (Invoice or Folio) is required'),
  grossAmount: z.number().optional(),
  paidAmount: z.number().min(0, 'Paid amount must be >= 0'),
  accountId: z.string().min(1, 'Receiving Account (e.g. Cash Ledger) is required'),
  paymentModeId: z.string().min(1, 'Payment Mode ID is required'),
  referenceNo: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.propertyId) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const body = await request.json()
    const parsedData = settlementSchema.parse(body)

    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Fetch Invoice to verify amounts
      const invoice = await tx.invoice.findUnique({
        where: { id: parsedData.sourceId },
        include: { guest: true }
      });

      if (!invoice) throw new Error('Invoice not found');

      // 2. Sum existing settlements
      const existingSettlements = await tx.settlement.findMany({
        where: { sourceId: invoice.id, sourceType: 'INVOICE' }
      });
      const alreadyPaid = existingSettlements.reduce((sum: any, s: any) => sum + s.paidAmount, 0);
      
      const totalAmount = invoice.totalAmount;
      const remainingBeforeThis = totalAmount - alreadyPaid;
      
      if (parsedData.paidAmount > remainingBeforeThis + 0.01) {
        throw new Error(`Payment amount (₹${parsedData.paidAmount}) exceeds remaining balance (₹${remainingBeforeThis.toFixed(2)})`);
      }

      const balanceAfter = Math.max(0, remainingBeforeThis - parsedData.paidAmount);
      const status = balanceAfter <= 0 ? 'SETTLED' : 'PARTIAL';

      // 3. Create Settlement
      const settlement = await tx.settlement.create({
        data: {
          settlementNo: `STL-${Date.now()}`,
          propertyId: session.propertyId!,
          sourceType: 'INVOICE',
          sourceId: invoice.id,
          grossAmount: totalAmount,
          paidAmount: parsedData.paidAmount,
          balanceAmount: balanceAfter,
          status: status,
          settlementDate: new Date(),
        }
      });

      // 4. Create Accounting Receipt
      await tx.receipt.create({
        data: {
          propertyId: session.propertyId!,
          receiptNo: `REC-${Date.now()}`,
          receivedFromAccountId: parsedData.accountId,
          amount: parsedData.paidAmount,
          paymentModeId: parsedData.paymentModeId,
          referenceNo: parsedData.referenceNo,
          sourceModule: 'INVOICE',
          sourceRefId: invoice.id,
        }
      });

      // 5. Update Invoice Payment Status
      await tx.invoice.update({
        where: { id: invoice.id },
        data: { 
          paymentStatus: balanceAfter <= 0 ? 'PAID' : 'PARTIAL'
        }
      });

      return settlement;
    });

    return apiResponse(result, 'Payment recorded successfully', 201)
  } catch (error: any) {
    return apiError(error)
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const { searchParams } = new URL(request.url)
    const propertyIdParam = searchParams.get('propertyId')
    const sourceId = searchParams.get('sourceId')

    const settlements = await prisma.settlement.findMany({
      where: {
        ...getMultiTenantWhere(session, propertyIdParam),
        ...(sourceId ? { sourceId } : {})
      },
      include: {
        property: { select: { name: true, city: true } }
      },
      orderBy: { settlementDate: 'desc' },
      take: 100
    })

    // Enhance with Invoice and Guest info
    const enhancedSettlements = await Promise.all(settlements.map(async (s: any) => {
      if (s.sourceType === 'INVOICE') {
        const invoice = await prisma.invoice.findUnique({
          where: { id: s.sourceId },
          select: { 
            invoiceNo: true, 
            guest: { select: { firstName: true, lastName: true } } 
          }
        });
        return {
          ...s,
          invoiceNo: invoice?.invoiceNo,
          guestName: invoice?.guest ? `${invoice.guest.firstName} ${invoice.guest.lastName || ''}` : 'Walk-in'
        }
      }
      return s;
    }));

    return apiResponse(enhancedSettlements, 'Settlements fetched successfully')
  } catch (error) {
    return apiError(error)
  }
}
