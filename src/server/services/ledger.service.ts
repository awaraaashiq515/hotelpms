/**
 * src/server/services/ledger.service.ts
 * WP-0.5: Double-entry accounting ledger engine.
 * Records balanced journal entries for all money movements.
 */

import { prisma } from '@/lib/prisma';
import { roundHalfUp } from '@/lib/money';

export interface JournalLineInput {
  accountId: string;
  accountName?: string;
  debit: number;
  credit: number;
  description?: string;
}

export interface PostJournalEntryParams {
  propertyId: string;
  source: 'FOLIO' | 'POS' | 'EXPENSE' | 'PAYROLL' | 'MANUAL';
  refId?: string;
  description?: string;
  date?: Date;
  lines: JournalLineInput[];
}

/**
 * Creates a balanced double-entry journal entry.
 * Throws an error if sum(debit) !== sum(credit).
 */
export async function createJournalEntry({
  propertyId,
  source,
  refId,
  description,
  date = new Date(),
  lines,
}: PostJournalEntryParams) {
  const totalDebit = roundHalfUp(lines.reduce((s, l) => s + (l.debit || 0), 0) * 100) / 100;
  const totalCredit = roundHalfUp(lines.reduce((s, l) => s + (l.credit || 0), 0) * 100) / 100;

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new Error(
      `Ledger unbalance error: Total Debit (${totalDebit}) does not equal Total Credit (${totalCredit})`
    );
  }

  const count = await prisma.journalEntry.count({ where: { propertyId } });
  const entryNumber = `JE-${String(count + 1).padStart(6, '0')}`;

  return await prisma.journalEntry.create({
    data: {
      propertyId,
      entryNumber,
      source,
      refId,
      description,
      date,
      isBalanced: true,
      lines: {
        create: lines.map((l) => ({
          accountId: l.accountId,
          accountName: l.accountName,
          debit: l.debit || 0,
          credit: l.credit || 0,
          description: l.description,
        })),
      },
    },
    include: { lines: true },
  });
}

/**
 * Records a payment in the double-entry ledger.
 * Debit: Cash/Bank/UPI (Asset)
 * Credit: Guest Ledger / Folio (Receivable)
 */
export async function postPaymentToLedger({
  propertyId,
  folioId,
  amount,
  paymentMethod,
}: {
  propertyId: string;
  folioId: string;
  amount: number;
  paymentMethod: string;
}) {
  const assetAccount = paymentMethod.toUpperCase().includes('CASH') ? '1001-CASH' : '1002-BANK';
  const guestLedgerAccount = '1100-GUEST-LEDGER';

  return createJournalEntry({
    propertyId,
    source: 'FOLIO',
    refId: folioId,
    description: `Payment received via ${paymentMethod} for Folio ${folioId}`,
    lines: [
      {
        accountId: assetAccount,
        accountName: assetAccount,
        debit: amount,
        credit: 0,
        description: `Payment received (${paymentMethod})`,
      },
      {
        accountId: guestLedgerAccount,
        accountName: 'Guest Ledger',
        debit: 0,
        credit: amount,
        description: `Settlement against folio ${folioId}`,
      },
    ],
  });
}
