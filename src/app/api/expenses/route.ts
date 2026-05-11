import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, getMultiTenantWhere } from '@/lib/api-utils';
import { getSession } from '@/lib/session';
import { createNotification } from '@/lib/notificationService';
import type { Prisma } from '@prisma/client';

const expenseSchema = z.object({
  categoryId: z.string().optional(),
  expenseDate: z.string().optional(),
  amount: z.number().positive('Amount must be positive'),
  paymentMode: z.string().min(1, 'Payment mode is required'),
  paidTo: z.string().optional(),
  createdBy: z.string().optional(),
  description: z.string().optional(),
  attachmentUrl: z.string().optional(),
});

// Helper: find account by name for a property
async function findAccount(propertyId: string, name: string) {
  return prisma.account.findFirst({ where: { propertyId, name } });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.propertyId) {
      return apiError(new Error('Unauthorized'), 401);
    }
    const propertyId = session.propertyId;
    const body = await request.json();
    const data = expenseSchema.parse(body);

    const expenseNo = `EXP-${Date.now()}`;
    const expenseDate = data.expenseDate ? new Date(data.expenseDate) : new Date();

    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Create the Expense record using unchecked input (scalar FKs)
      const createData: Prisma.ExpenseUncheckedCreateInput = {
        propertyId,
        expenseNo,
        expenseDate,
        amount: data.amount,
        paymentMode: data.paymentMode,
        paidTo: data.paidTo ?? null,
        createdBy: data.createdBy ?? null,
        description: data.description ?? null,
        attachmentUrl: data.attachmentUrl ?? null,
        status: 'ACTIVE',
        categoryId: data.categoryId ?? null,
      };
      const expense = await tx.expense.create({ data: createData });

      // 2. Auto-post a PAYMENT Voucher (DR: Expense A/C, CR: Cash/Bank A/C)
      const isBank = ['CARD', 'UPI', 'BANK', 'ONLINE'].includes(data.paymentMode.toUpperCase());
      const creditAccountName = isBank ? 'Bank Account' : 'Cash Account';
      const debitAccount = await findAccount(propertyId, 'Expense Account');
      const creditAccount = await findAccount(propertyId, creditAccountName);

      if (debitAccount && creditAccount) {
        const voucherNo = `PV-${Date.now()}`;
        const voucher = await tx.voucher.create({
          data: {
            propertyId,
            voucherNo,
            voucherType: 'PAYMENT',
            voucherDate: expenseDate,
            narration: `Expense: ${data.description || data.paidTo || expenseNo}`,
            totalDebit: data.amount,
            totalCredit: data.amount,
            status: 'POSTED',
            referenceNo: expenseNo,
          },
        });
        await tx.voucherEntry.createMany({
          data: [
            { voucherId: voucher.id, accountId: debitAccount.id, debitAmount: data.amount, creditAmount: 0, description: `Expense - ${data.description || ''}` },
            { voucherId: voucher.id, accountId: creditAccount.id, debitAmount: 0, creditAmount: data.amount, description: creditAccountName },
          ],
        });
        // Link voucher to expense
        await tx.expense.update({
          where: { id: expense.id },
          data: { voucherId: voucher.id },
        });
      }

      // 3. Write Audit Log
      await tx.auditLog.create({
        data: {
          propertyId,
          userId: session.id,
          moduleName: 'EXPENSE',
          actionType: 'CREATE',
          recordId: expense.id,
          newData: JSON.stringify({ expenseNo, amount: data.amount, paymentMode: data.paymentMode }),
        },
      });

      return tx.expense.findUnique({
        where: { id: expense.id },
        include: { category: { select: { id: true, name: true } } },
      });
    });

    // Notify about new expense
    try {
      await createNotification({
        propertyId,
        title: 'New Expense Recorded',
        message: `Expense of ₹${data.amount} recorded for ${data.paidTo || 'Others'}.`,
        type: 'EXPENSE',
        priority: data.amount > 5000 ? 'HIGH' : 'MEDIUM',
        metadata: {
          expenseId: (result as any).id,
          amount: data.amount,
          link: '/expenses'
        }
      });
    } catch (e) {}

    return apiResponse(result, 'Expense created successfully', 201);
  } catch (error) {
    return apiError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.propertyId) {
      return apiError(new Error('Unauthorized'), 401);
    }
    const { searchParams } = new URL(request.url);
    const propertyIdParam = searchParams.get('propertyId');
    const categoryId = searchParams.get('categoryId');
    const paymentMode = searchParams.get('paymentMode');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const where: Prisma.ExpenseWhereInput = getMultiTenantWhere(session, propertyIdParam);
    if (categoryId) where.categoryId = categoryId;
    if (paymentMode) where.paymentMode = paymentMode;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) where.expenseDate.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.expenseDate.lte = end;
      }
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: { category: { select: { id: true, name: true } } },
        orderBy: { expenseDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.expense.count({ where }),
    ]);

    return apiResponse({ expenses, total, page, limit, pages: Math.ceil(total / limit) }, 'Expenses fetched');
  } catch (error) {
    return apiError(error);
  }
}
