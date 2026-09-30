import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Fetch event bookings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const status = searchParams.get('status');

    const where: any = {};
    if (propertyId) where.propertyId = propertyId;
    if (status && status !== 'ALL') where.status = status;

    const bookings = await prisma.banquetBooking.findMany({
      where,
      include: {
        hall: true
      },
      orderBy: { eventDate: 'asc' }
    });

    return NextResponse.json({ success: true, data: bookings });
  } catch (error: any) {
    console.error('[Banquet Bookings GET Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}

// POST: Create a new banquet event booking
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      hallId, eventName, eventType, clientName, clientPhone, clientEmail, clientGst,
      eventDate, startTime, endTime, paxCount, slotType, seatingLayout,
      cateringPackage, ratePerPlate, hallRent, extraCharges, miscCharges, advancePaid, specialInstructions, propertyId
    } = body;

    if (!hallId || !eventName || !clientName || !clientPhone || !eventDate) {
      return NextResponse.json({ success: false, message: 'Please fill in all required fields (Hall, Event Name, Client Name, Phone, Date).' }, { status: 400 });
    }

    const pax = parseInt(paxCount) || 100;
    const perPlate = parseFloat(ratePerPlate) || 0;
    const rent = parseFloat(hallRent) || 0;
    const extra = parseFloat(extraCharges) || 0;
    const advance = parseFloat(advancePaid) || 0;

    const totalAmount = rent + (pax * perPlate) + extra;
    const dueAmount = Math.max(0, totalAmount - advance);
    const paymentStatus = advance >= totalAmount ? 'PAID' : advance > 0 ? 'PARTIAL' : 'PENDING';

    const startDT = new Date(startTime || eventDate);
    const endDT = new Date(endTime || eventDate);

    const booking = await prisma.banquetBooking.create({
      data: {
        hallId,
        eventName,
        eventType: eventType || 'Wedding',
        clientName,
        clientPhone,
        clientEmail,
        clientGst,
        eventDate: new Date(eventDate),
        startTime: startDT,
        endTime: endDT,
        paxCount: pax,
        slotType: slotType || 'FULL_DAY',
        seatingLayout: seatingLayout || 'THEATER',
        cateringPackage: cateringPackage || 'Silver',
        ratePerPlate: perPlate,
        hallRent: rent,
        extraCharges: extra,
        miscCharges: typeof miscCharges === 'string' ? miscCharges : miscCharges ? JSON.stringify(miscCharges) : null,
        totalAmount,
        advancePaid: advance,
        dueAmount,
        status: 'CONFIRMED',
        paymentStatus,
        specialInstructions,
        propertyId
      },
      include: {
        hall: true
      }
    });

    return NextResponse.json({ success: true, data: booking, message: 'Event booked successfully!' });
  } catch (error: any) {
    console.error('[Banquet Bookings POST Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}

// PATCH: Update event status or record payment
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, advancePaid, addPayment } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Booking ID is required.' }, { status: 400 });
    }

    const existing = await prisma.banquetBooking.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Booking not found.' }, { status: 404 });
    }

    let newAdvance = existing.advancePaid;
    if (addPayment) {
      newAdvance += parseFloat(addPayment);
    } else if (advancePaid !== undefined) {
      newAdvance = parseFloat(advancePaid);
    }

    const dueAmount = Math.max(0, existing.totalAmount - newAdvance);
    const paymentStatus = newAdvance >= existing.totalAmount ? 'PAID' : newAdvance > 0 ? 'PARTIAL' : 'PENDING';

    const updated = await prisma.banquetBooking.update({
      where: { id },
      data: {
        status: status || existing.status,
        advancePaid: newAdvance,
        dueAmount,
        paymentStatus
      },
      include: { hall: true }
    });

    return NextResponse.json({ success: true, data: updated, message: 'Event updated successfully!' });
  } catch (error: any) {
    console.error('[Banquet Bookings PATCH Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}

// DELETE: Delete booking
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Booking ID is required.' }, { status: 400 });
    }

    await prisma.banquetBooking.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Event booking deleted.' });
  } catch (error: any) {
    console.error('[Banquet Bookings DELETE Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
