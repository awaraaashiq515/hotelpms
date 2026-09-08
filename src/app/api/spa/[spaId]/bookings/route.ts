import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/spa/[spaId]/bookings
export async function GET(req: NextRequest, { params }: { params: Promise<{ spaId: string }> }) {
  try {
    const { spaId } = await params;
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date'); // YYYY-MM-DD filter
    const status = searchParams.get('status');

    const startOfDay = date ? new Date(`${date}T00:00:00.000Z`) : undefined;
    const endOfDay = date ? new Date(`${date}T23:59:59.999Z`) : undefined;

    const bookings = await prisma.spaBooking.findMany({
      where: {
        spaId,
        ...(status ? { status } : {}),
        ...(startOfDay && endOfDay
          ? { scheduledAt: { gte: startOfDay, lte: endOfDay } }
          : {}),
      },
      include: {
        service: true,
        therapist: true,
      },
      orderBy: { scheduledAt: 'asc' },
    });

    // Today's stats
    const today = new Date();
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const todayEnd = new Date(today.setHours(23, 59, 59, 999));

    const todayBookings = await prisma.spaBooking.findMany({
      where: {
        spaId,
        scheduledAt: { gte: todayStart, lte: todayEnd },
      },
    });

    const todayRevenue = todayBookings
      .filter((b) => b.status === 'COMPLETED')
      .reduce((sum, b) => sum + b.totalAmount, 0);

    return NextResponse.json({
      bookings,
      stats: {
        todayTotal: todayBookings.length,
        todayRevenue,
        todayCompleted: todayBookings.filter((b) => b.status === 'COMPLETED').length,
        todayScheduled: todayBookings.filter((b) => b.status === 'SCHEDULED').length,
      },
    });
  } catch (error) {
    console.error('[GET /api/spa/[spaId]/bookings]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/spa/[spaId]/bookings — Create a new booking
export async function POST(req: NextRequest, { params }: { params: Promise<{ spaId: string }> }) {
  try {
    const { spaId } = await params;
    const body = await req.json();
    const {
      serviceId,
      therapistId,
      guestId,
      guestName,
      guestPhone,
      reservationId,
      folioId,
      scheduledAt,
      paymentMode,
      notes,
    } = body;

    if (!serviceId || !scheduledAt || (!guestId && !guestName)) {
      return NextResponse.json(
        { error: 'serviceId, scheduledAt and guest info required' },
        { status: 400 }
      );
    }

    // Get service details for pricing
    const service = await prisma.spaService.findUnique({ where: { id: serviceId } });
    if (!service) return NextResponse.json({ error: 'Service not found' }, { status: 404 });

    const taxAmount = (service.price * service.gstRate) / 100;
    const totalAmount = service.price + taxAmount;

    // Generate unique booking number
    const count = await prisma.spaBooking.count({ where: { spaId } });
    const bookingNo = `SPA-${Date.now()}-${String(count + 1).padStart(4, '0')}`;

    const booking = await prisma.spaBooking.create({
      data: {
        spaId,
        serviceId,
        therapistId: therapistId || null,
        guestId: guestId || null,
        guestName: guestName || null,
        guestPhone: guestPhone || null,
        reservationId: reservationId || null,
        folioId: folioId || null,
        bookingNo,
        scheduledAt: new Date(scheduledAt),
        duration: service.duration,
        amount: service.price,
        taxAmount,
        totalAmount,
        status: 'SCHEDULED',
        paymentStatus: paymentMode === 'ROOM_CHARGE' ? 'ROOM_CHARGE' : 'PENDING',
        paymentMode: paymentMode || null,
        notes: notes || null,
      },
      include: {
        service: true,
        therapist: true,
      },
    });

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/spa/[spaId]/bookings]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
