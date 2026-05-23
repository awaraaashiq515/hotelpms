import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const { checkInId, paymentAmount = 0, paymentMode = 'CASH' } = body;

    if (!checkInId) {
      return apiError(new Error('Check-In ID is required.'), 400);
    }

    // Get the CheckIn details
    const checkIn = await prisma.checkIn.findUnique({
      where: { id: checkInId },
      include: {
        reservation: {
          include: {
            folios: {
              where: { status: 'OPEN' }
            }
          }
        },
        room: true,
      }
    });

    if (!checkIn) {
      return apiError(new Error('Active check-in record not found.'), 404);
    }

    const folio = checkIn.reservation?.folios?.[0];
    if (!folio) {
      return apiError(new Error('No open folio found for this check-in.'), 404);
    }

    const finalAmountPaid = Number(paymentAmount);

    // If a payment was made during checkout, add a CREDIT transaction to folio
    if (finalAmountPaid > 0) {
      await prisma.folioTransaction.create({
        data: {
          folioId: folio.id,
          txnType: 'CREDIT',
          sourceModule: 'HMS',
          description: `Checkout Settlement via ${paymentMode}`,
          debitAmount: 0,
          creditAmount: finalAmountPaid,
          netAmount: -finalAmountPaid,
        }
      });
    }

    // Recalculate folio balances before closing
    const freshFolio = await prisma.folio.findUnique({
      where: { id: folio.id },
      include: { transactions: true }
    });

    const totalCharges = freshFolio?.transactions.reduce((sum: number, t: any) => sum + t.debitAmount, 0) || 0;
    const totalPayments = freshFolio?.transactions.reduce((sum: number, t: any) => sum + t.creditAmount, 0) || 0;
    const closingBalance = totalCharges - totalPayments;

    // 1. Close the Folio
    await prisma.folio.update({
      where: { id: folio.id },
      data: {
        totalCharges,
        totalPayments,
        closingBalance,
        status: 'CLOSED',
      }
    });

    // 2. Create the Checkout record
    const checkOut = await prisma.checkOut.create({
      data: {
        checkInId,
        checkedOutAt: new Date(),
        finalBillAmount: totalCharges,
        settlementStatus: closingBalance <= 0 ? 'SETTLED' : 'DUE',
      }
    });

    // 3. Update Check-In Status to COMPLETED
    await prisma.checkIn.update({
      where: { id: checkInId },
      data: {
        status: 'COMPLETED'
      }
    });

    // 4. Update Reservation Status to CHECKED_OUT
    await prisma.reservation.update({
      where: { id: checkIn.reservationId },
      data: {
        status: 'CHECKED_OUT',
        dueAmount: closingBalance,
      }
    });

    // 5. Release the Room, mark it as Dirty
    await prisma.room.update({
      where: { id: checkIn.roomId },
      data: {
        status: 'AVAILABLE',
        housekeepingStatus: 'DIRTY', // Housekeeping needs to clean it now
      }
    });

    return apiResponse({ checkOut, closingBalance }, 'Guest checked out successfully');
  } catch (error) {
    return apiError(error);
  }
}
