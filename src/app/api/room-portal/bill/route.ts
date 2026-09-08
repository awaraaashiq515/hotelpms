import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

const secretKey = process.env.JWT_SECRET || 'super-secret-default-key-change-it-in-prod';
const key = new TextEncoder().encode(secretKey);

async function verifyRoomPortalToken(request: NextRequest) {
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
    if ((payload as any).type !== 'ROOM_PORTAL') return null;
    const session = await prisma.roomPortalSession.findFirst({ where: { token, isActive: true } });
    if (!session) return null;
    return payload as any;
  } catch {
    return null;
  }
}

// GET: Fetch current bill / folio for this reservation
export async function GET(request: NextRequest) {
  try {
    const payload = await verifyRoomPortalToken(request);
    if (!payload) {
      return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    }

    const { reservationId } = payload;

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      select: {
        id: true,
        bookingNo: true,
        arrivalDate: true,
        departureDate: true,
        totalAmount: true,
        advanceAmount: true,
        dueAmount: true,
        mealPlan: true,
        status: true,
        folios: {
          include: {
            transactions: {
              orderBy: { txnDate: 'asc' },
            },
          },
        },
      },
    });

    if (!reservation) {
      return NextResponse.json({ success: false, message: 'Reservation not found.' }, { status: 404 });
    }

    // Aggregate folio data
    const folio = reservation.folios[0] || null;
    const transactions = folio?.transactions || [];

    const charges = transactions
      .filter((t) => t.debitAmount > 0)
      .map((t) => ({
        date: t.txnDate,
        description: t.description || t.sourceModule,
        amount: t.debitAmount,
        type: t.txnType,
      }));

    const payments = transactions
      .filter((t) => t.creditAmount > 0)
      .map((t) => ({
        date: t.txnDate,
        description: t.description || 'Payment',
        amount: t.creditAmount,
        type: t.txnType,
      }));

    const totalChargesSum = charges.reduce((acc, c) => acc + c.amount, 0);
    const totalPaymentsSum = payments.reduce((acc, p) => acc + p.amount, 0);

    const calculatedTotal = totalChargesSum > 0 ? totalChargesSum : (folio?.totalCharges || reservation.totalAmount || 0);
    const calculatedPaid = totalPaymentsSum > 0 ? totalPaymentsSum : (folio?.totalPayments || reservation.advanceAmount || 0);
    const calculatedBalanceDue = Math.max(0, calculatedTotal - calculatedPaid);

    // Categorize charges for complete bill breakdown
    const roomCharges = charges.filter(c =>
      c.description.toLowerCase().includes('room rent') ||
      c.description.toLowerCase().includes('room stay') ||
      c.type === 'ROOM_CHARGES'
    );
    const roomChargesTotal = roomCharges.reduce((acc, c) => acc + c.amount, 0);

    const roomServiceCharges = charges.filter(c => !roomCharges.includes(c));
    const roomServiceTotal = roomServiceCharges.reduce((acc, c) => acc + c.amount, 0);

    // Ensure valid departure date for display
    let arrivalDate = reservation.arrivalDate;
    let departureDate = reservation.departureDate;
    if (new Date(departureDate) <= new Date(arrivalDate)) {
      const nextDay = new Date(arrivalDate);
      nextDay.setDate(nextDay.getDate() + 1);
      departureDate = nextDay;
    }

    // Sync reservation table with updated folio balances
    if (reservation.dueAmount !== calculatedBalanceDue || reservation.totalAmount !== calculatedTotal) {
      await prisma.reservation.update({
        where: { id: reservationId },
        data: {
          totalAmount: calculatedTotal,
          dueAmount: calculatedBalanceDue,
        },
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      data: {
        bookingNo: reservation.bookingNo,
        arrivalDate,
        departureDate,
        totalAmount: calculatedTotal,
        advanceAmount: calculatedPaid,
        dueAmount: calculatedBalanceDue,
        mealPlan: reservation.mealPlan || 'RO',
        status: reservation.status,
        charges,
        payments,
        roomChargesTotal,
        roomServiceTotal,
        roomServiceCount: roomServiceCharges.length,
        totalCharges: calculatedTotal,
        totalPayments: calculatedPaid,
        balanceDue: calculatedBalanceDue,
        folioBalance: folio?.closingBalance ?? calculatedBalanceDue,
      },
    });
  } catch (error: any) {
    console.error('[Room Portal Bill Error]:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch bill.' }, { status: 500 });
  }
}
