import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';
import type { Prisma } from '@prisma/client';

const updateSchema = z.object({
  categoryId: z.string().optional().nullable(),
  expenseDate: z.string().optional(),
  amount: z.number().positive().optional(),
  paymentMode: z.string().optional(),
  paidTo: z.string().optional().nullable(),
  createdBy: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  attachmentUrl: z.string().optional().nullable(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);
    const { id } = await params;
    const expense = await prisma.expense.findUnique({
      where: { id },
      include: { category: { select: { id: true, name: true } } },
    });
    if (!expense) return apiError(new Error('Expense not found'), 404);
    return apiResponse(expense, 'Expense fetched');
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !session.propertyId) return apiError(new Error('Unauthorized'), 401);
    const { id } = await params;
    const body = await request.json();
    const parsed = updateSchema.parse(body);

    const updateData: Prisma.ExpenseUncheckedUpdateInput = {
      paymentMode: parsed.paymentMode,
      paidTo: parsed.paidTo,
      createdBy: parsed.createdBy,
      description: parsed.description,
      attachmentUrl: parsed.attachmentUrl,
      categoryId: parsed.categoryId,
      expenseDate: parsed.expenseDate ? new Date(parsed.expenseDate) : undefined,
      ...(parsed.amount !== undefined ? { amount: parsed.amount } : {}),
    };

    const expense = await prisma.expense.update({
      where: { id },
      data: updateData,
      include: { category: { select: { id: true, name: true } } },
    });

    await prisma.auditLog.create({
      data: {
        propertyId: session.propertyId,
        userId: session.id,
        moduleName: 'EXPENSE',
        actionType: 'UPDATE',
        recordId: id,
        newData: JSON.stringify(parsed),
      },
    });

    return apiResponse(expense, 'Expense updated successfully');
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !session.propertyId) return apiError(new Error('Unauthorized'), 401);
    const { id } = await params;

    const expense = await prisma.expense.findUnique({ where: { id } });
    if (!expense) return apiError(new Error('Expense not found'), 404);

    await prisma.$transaction(async (tx: any) => {
      // Void the expense
      await tx.expense.update({ where: { id }, data: { status: 'VOID' } });

      // Post reversal voucher if linked voucher exists
      if (expense.voucherId) {
        const original = await tx.voucher.findUnique({
          where: { id: expense.voucherId },
          include: { entries: true },
        });
        if (original) {
          const reversalVoucher = await tx.voucher.create({
            data: {
              propertyId: expense.propertyId,
              voucherNo: `RV-${Date.now()}`,
              voucherType: 'JOURNAL',
              voucherDate: new Date(),
              narration: `Reversal of ${original.voucherNo}`,
              totalDebit: original.totalDebit,
              totalCredit: original.totalCredit,
              status: 'POSTED',
              referenceNo: original.voucherNo,
            },
          });
          await tx.voucherEntry.createMany({
            data: original.entries.map((e: any) => ({
              voucherId: reversalVoucher.id,
              accountId: e.accountId,
              debitAmount: e.creditAmount,
              creditAmount: e.debitAmount,
              description: `Reversal: ${e.description || ''}`,
            })),
          });
        }
      }

      // Audit log
      await tx.auditLog.create({
        data: {
          propertyId: session.propertyId!,
          userId: session.id,
          moduleName: 'EXPENSE',
          actionType: 'VOID',
          recordId: id,
          oldData: JSON.stringify({ expenseNo: expense.expenseNo, amount: expense.amount }),
        },
      });
    });

    return apiResponse(null, 'Expense voided and reversal voucher posted');
  } catch (error) {
    return apiError(error);
  }
}
