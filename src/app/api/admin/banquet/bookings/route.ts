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

    let bookings = await prisma.banquetBooking.findMany({
      where,
      include: {
        hall: true
      },
      orderBy: { eventDate: 'asc' }
    });

    // Seed mock bookings if database is empty
    if (bookings.length === 0) {
      const halls = await prisma.banquetHall.findMany();
      if (halls.length > 0) {
        const h0 = halls[0].id;
        const h1 = halls[1] ? halls[1].id : h0;
        const h2 = halls[2] ? halls[2].id : h0;

        const defaultBookings = [
          {
            hallId: h0,
            eventName: 'Sharma Wedding Reception',
            eventType: 'Wedding',
            clientName: 'Raj Sharma',
            clientPhone: '+91 98765 00001',
            clientEmail: 'raj.sharma@example.com',
            eventDate: new Date('2026-07-29T00:00:00.000Z'),
            startTime: new Date('2026-07-29T19:00:00.000Z'),
            endTime: new Date('2026-07-29T23:30:00.000Z'),
            paxCount: 350,
            slotType: 'EVENING',
            seatingLayout: 'CLUSTER',
            cateringPackage: 'Diamond Wedding Feast',
            ratePerPlate: 1200,
            hallRent: 75000,
            extraCharges: 25000,
            totalAmount: 495000,
            advancePaid: 250000,
            dueAmount: 245000,
            status: 'CONFIRMED',
            paymentStatus: 'PARTIAL',
            specialInstructions: 'Floral entrance arch, DJ stage setup by 5 PM, Live Chaat counter.'
          },
          {
            hallId: h1,
            eventName: 'TechCorp Annual Leaders Summit',
            eventType: 'Corporate',
            clientName: 'HR Dept (TechCorp)',
            clientPhone: '+91 98765 00002',
            clientEmail: 'events@techcorp.io',
            eventDate: new Date('2026-07-30T00:00:00.000Z'),
            startTime: new Date('2026-07-30T09:00:00.000Z'),
            endTime: new Date('2026-07-30T17:00:00.000Z'),
            paxCount: 80,
            slotType: 'FULL_DAY',
            seatingLayout: 'U_SHAPE',
            cateringPackage: 'Corporate Executive Lunch',
            ratePerPlate: 850,
            hallRent: 25000,
            extraCharges: 10000,
            totalAmount: 103000,
            advancePaid: 103000,
            dueAmount: 0,
            status: 'CONFIRMED',
            paymentStatus: 'PAID',
            specialInstructions: 'Dual projectors, high-speed WiFi credentials on desk cards.'
          },
          {
            hallId: h2,
            eventName: 'Ananya 18th Birthday Bash',
            eventType: 'Birthday',
            clientName: 'Meera Kapoor',
            clientPhone: '+91 98765 00003',
            clientEmail: 'meera.k@example.com',
            eventDate: new Date('2026-07-31T00:00:00.000Z'),
            startTime: new Date('2026-07-31T18:30:00.000Z'),
            endTime: new Date('2026-07-31T22:30:00.000Z'),
            paxCount: 60,
            slotType: 'EVENING',
            seatingLayout: 'ROUND_TABLE',
            cateringPackage: 'Gold Party Menu',
            ratePerPlate: 950,
            hallRent: 20000,
            extraCharges: 8000,
            totalAmount: 85000,
            advancePaid: 30000,
            dueAmount: 55000,
            status: 'TENTATIVE',
            paymentStatus: 'PARTIAL',
            specialInstructions: 'Neon photo booth near pool, mocktail fountain station.'
          }
        ];

        for (const b of defaultBookings) {
          await prisma.banquetBooking.create({
            data: {
              ...b,
              propertyId: propertyId || undefined
            }
          });
        }

        bookings = await prisma.banquetBooking.findMany({
          where,
          include: { hall: true },
          orderBy: { eventDate: 'asc' }
        });
      }
    }

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
      cateringPackage, ratePerPlate, hallRent, extraCharges, advancePaid, specialInstructions, propertyId
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
