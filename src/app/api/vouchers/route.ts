import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { apiError, apiResponse } from '@/lib/api-utils'
import { getSession } from '@/lib/session'
import { createNotification } from '@/lib/notificationService'

const voucherEntrySchema = z.object({
  accountId: z.string().min(1, 'Account ID is required'),
  debitAmount: z.number().default(0),
  creditAmount: z.number().default(0),
  description: z.string().optional(),
})

const voucherSchema = z.object({
  propertyId: z.string().optional(),
  voucherType: z.enum(['RECEIPT', 'PAYMENT', 'JOURNAL', 'CONTRA']),
  voucherDate: z.string().optional(),
  referenceNo: z.string().optional(),
  narration: z.string().optional(),
  entries: z.array(voucherEntrySchema).min(2, 'A voucher must have at least 2 entries (Double Entry System)'),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || !session.propertyId) return apiError(new Error('Unauthorized'), 401)
    const body = await request.json()
    const { entries, ...voucherData } = voucherSchema.parse(body)
    voucherData.propertyId = voucherData.propertyId || session.propertyId

    let totalDebit = 0
    let totalCredit = 0

    // Validate Double Entry Accounting Principle
    entries.forEach(entry => {
      totalDebit += entry.debitAmount
      totalCredit += entry.creditAmount
    })

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return apiError(new Error(`Total Debit (${totalDebit}) must equal Total Credit (${totalCredit})`), 400)
    }

    const propertyId = (voucherData.propertyId || session.propertyId) as string
    const savedVoucher = await prisma.$transaction(async (tx: any) => {
      const voucher = await tx.voucher.create({
        data: {
          propertyId,
          voucherType: voucherData.voucherType,
          referenceNo: voucherData.referenceNo,
          narration: voucherData.narration,
          voucherDate: voucherData.voucherDate ? new Date(voucherData.voucherDate) : new Date(),
          voucherNo: `VCH-${Date.now()}`,
          totalDebit,
          totalCredit,
          status: 'POSTED'
        }
      })

      await tx.voucherEntry.createMany({
        data: entries.map(entry => ({ ...entry, voucherId: voucher.id }))
      })

      // We should ideally update Ledger/Account balances here
      // tx.account.update({ where: { id: entry.accountId }, data: { ... } })

      return await tx.voucher.findUnique({
        where: { id: voucher.id },
        include: { entries: { include: { account: { select: { name: true } } } } }
      })
    })

    // Notify about new voucher
    try {
      await createNotification({
        propertyId,
        title: `Accounting: ${savedVoucher.voucherType} Posted`,
        message: `${savedVoucher.voucherType} voucher ${savedVoucher.voucherNo} posted for ₹${savedVoucher.totalDebit}.`,
        type: 'ACCOUNTING',
        priority: savedVoucher.totalDebit > 10000 ? 'HIGH' : 'MEDIUM',
        metadata: {
          voucherId: savedVoucher.id,
          voucherNo: savedVoucher.voucherNo,
          amount: savedVoucher.totalDebit,
          link: '/accounts'
        }
      });
    } catch (e) {}

    return apiResponse(savedVoucher, 'Voucher posted successfully', 201)
  } catch (error) {
    return apiError(error)
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || !session.propertyId) return apiError(new Error('Unauthorized'), 401)
    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId') || session.propertyId
    const type = searchParams.get('type')

    const vouchers = await prisma.voucher.findMany({
      where: {
        propertyId,
        ...(type ? { voucherType: type } : {})
      },
      include: {
        entries: {
          include: { account: { select: { name: true } } }
        }
      },
      orderBy: { voucherDate: 'desc' },
      take: 100
    })

    return apiResponse(vouchers, 'Vouchers fetched successfully')
  } catch (error) {
    return apiError(error)
  }
}
