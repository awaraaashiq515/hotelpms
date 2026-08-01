import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const agentId = searchParams.get('agentId') || '';

    const where: any = { propertyId: session.propertyId };
    if (status) where.status = status;
    if (agentId) where.agentId = agentId;

    const bookings = await prisma.agentBooking.findMany({
      where,
      include: {
        agent: { select: { id: true, name: true, agentCode: true, phone: true, commissionRate: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: bookings });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      agentId,
      propertyId,
      guestName,
      guestPhone,
      guestEmail,
      guestNationality = 'Indian',
      adults = 1,
      children = 0,
      checkIn,
      checkOut,
      roomType = 'Standard',
      totalAmount = 0,
      notes,
      specialRequests,
      includePoolAccess = false,
      includeSpaPackage = false,
      poolPassCount = 0,
      spaServiceType = null,
    } = body;

    if (!agentId || !guestName || !checkIn || !checkOut) {
      return NextResponse.json(
        { success: false, message: 'agentId, guestName, checkIn, and checkOut are required.' },
        { status: 400 }
      );
    }

    const agent = await prisma.travelAgent.findUnique({ where: { id: agentId } });
    if (!agent) {
      return NextResponse.json({ success: false, message: 'Agent not found.' }, { status: 404 });
    }

    const targetPropertyId = propertyId || agent.propertyId;
    if (!targetPropertyId) {
      return NextResponse.json({ success: false, message: 'propertyId is required.' }, { status: 400 });
    }

    // Check hotel-specific relation (block status & custom commission rate)
    const relation = await prisma.agentHotelRelation.findUnique({
      where: {
        agentId_propertyId: {
          agentId,
          propertyId: targetPropertyId,
        },
      },
    });

    if (relation?.isBlocked) {
      return NextResponse.json(
        { success: false, message: 'You are blocked from submitting bookings for this property.' },
        { status: 403 }
      );
    }

    const effectiveCommissionRate = relation ? relation.commissionRate : agent.commissionRate;
    const commission = (Number(totalAmount) * effectiveCommissionRate) / 100;

    const booking = await prisma.agentBooking.create({
      data: {
        propertyId: targetPropertyId,
        agentId,
        guestName,
        guestPhone: guestPhone || null,
        guestEmail: guestEmail || null,
        guestNationality,
        adults: Number(adults),
        children: Number(children),
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        roomType,
        totalAmount: Number(totalAmount),
        commission,
        notes: notes || null,
        specialRequests: specialRequests || null,
        includePoolAccess: Boolean(includePoolAccess),
        includeSpaPackage: Boolean(includeSpaPackage),
        poolPassCount: Number(poolPassCount) || 0,
        spaServiceType: spaServiceType || null,
      },
      include: { agent: true },
    });

    return NextResponse.json({
      success: true,
      data: booking,
      message: `Booking submitted! Commission: ₹${commission.toFixed(2)} @ ${effectiveCommissionRate}%`,
    });
  } catch (error: any) {
    return apiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const { id, status, commissionPaid, totalAmount, notes } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Booking ID is required.' }, { status: 400 });
    }

    const booking = await prisma.agentBooking.findFirst({
      where: { id, propertyId: session.propertyId! },
      include: { agent: true },
    });
    if (!booking) {
      return NextResponse.json({ success: false, message: 'Booking not found.' }, { status: 404 });
    }

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (commissionPaid !== undefined) updateData.commissionPaid = Boolean(commissionPaid);
    if (notes !== undefined) updateData.notes = notes;

    // Recalculate commission if totalAmount changes
    if (totalAmount !== undefined) {
      updateData.totalAmount = Number(totalAmount);
      updateData.commission = (Number(totalAmount) * booking.agent.commissionRate) / 100;
    }

    const updated = await prisma.agentBooking.update({ where: { id }, data: updateData });

    // If marking commission paid, update agent total earnings
    if (commissionPaid === true && !booking.commissionPaid) {
      await prisma.travelAgent.update({
        where: { id: booking.agentId },
        data: { totalEarnings: { increment: booking.commission } },
      });
    }

    return NextResponse.json({ success: true, data: updated, message: 'Booking updated.' });
  } catch (error: any) {
    return apiError(error);
  }
}
