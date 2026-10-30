import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const agentId = searchParams.get('agentId') || '';
    const propertyIdParam = searchParams.get('propertyId') || '';

    const where: any = {};
    if (propertyIdParam && propertyIdParam !== 'all' && propertyIdParam !== 'null') {
      where.propertyId = propertyIdParam;
    } else if (session?.propertyId) {
      // If user is logged into a restaurant branch, find the hotel property in the same org
      const prop = await prisma.property.findUnique({
        where: { id: session.propertyId },
        select: { hmsEnabled: true, type: true, organizationId: true }
      });
      if (prop && !prop.hmsEnabled && prop.type !== 'HOTEL') {
        const hotelProp = await prisma.property.findFirst({
          where: {
            organizationId: prop.organizationId || session.organizationId,
            OR: [
              { hmsEnabled: true },
              { type: 'HOTEL' }
            ]
          },
          select: { id: true }
        });
        if (hotelProp) {
          where.propertyId = hotelProp.id;
        }
      } else {
        where.propertyId = session.propertyId;
      }
    }
    if (status && status !== 'ALL') where.status = status;
    if (agentId) where.agentId = agentId;

    let bookings = await prisma.agentBooking.findMany({
      where,
      include: {
        agent: { select: { id: true, name: true, agentCode: true, phone: true, commissionRate: true, companyName: true, city: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // If filtered by propertyId returned 0, fallback to finding all bookings matching status/agent
    // so dashboard never shows blank if bookings were assigned to another property or portal default
    if (bookings.length === 0 && where.propertyId) {
      const fallbackWhere: any = {};
      if (status && status !== 'ALL') fallbackWhere.status = status;
      if (agentId) fallbackWhere.agentId = agentId;
      const allBookings = await prisma.agentBooking.findMany({
        where: fallbackWhere,
        include: {
          agent: { select: { id: true, name: true, agentCode: true, phone: true, commissionRate: true, companyName: true, city: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      if (allBookings.length > 0) {
        bookings = allBookings;
      }
    }

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

    let targetPropertyId = propertyId || agent.propertyId;
    if (!targetPropertyId) {
      const defaultHotel = await prisma.property.findFirst({
        where: { OR: [{ type: 'HOTEL' }, { hmsEnabled: true }] }
      });
      targetPropertyId = defaultHotel?.id;
    }
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

    // Create Hotel In-App Notification
    await prisma.notification.create({
      data: {
        propertyId: targetPropertyId,
        title: `🔔 New Agent Booking: ${guestName}`,
        message: `${roomType} booked by ${agent.name} (${agent.agentCode}). Total: ₹${Number(totalAmount).toLocaleString()}`,
        type: 'AGENT_BOOKING',
        status: 'UNREAD',
        priority: 'HIGH',
        metadata: JSON.stringify({
          bookingId: booking.id,
          agentId,
          agentName: agent.name,
          agentCode: agent.agentCode,
          agentPhone: agent.phone,
          guestName,
          guestPhone: guestPhone || null,
          roomType,
          totalAmount: Number(totalAmount),
          commission,
          checkIn,
          checkOut,
          adults: Number(adults),
          children: Number(children),
          link: '/hotel/agent-bookings',
        }),
      },
    }).catch((err) => {
      console.error('[AgentBooking] Failed to create notification:', err);
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

    const body = await request.json();
    const {
      id,
      status,
      commissionPaid,
      totalAmount,
      notes,
      guestName,
      guestPhone,
      guestEmail,
      guestNationality,
      adults,
      children,
      checkIn,
      checkOut,
      roomType,
      specialRequests,
      includePoolAccess,
      includeSpaPackage,
      poolPassCount,
      spaServiceType,
      isAgentEdit,
      requireApproval,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Booking ID is required.' }, { status: 400 });
    }

    const booking = await prisma.agentBooking.findUnique({
      where: { id },
      include: { agent: true },
    });
    if (!booking) {
      return NextResponse.json({ success: false, message: 'Booking not found.' }, { status: 404 });
    }

    const updateData: any = {};
    if (guestName !== undefined) updateData.guestName = guestName;
    if (guestPhone !== undefined) updateData.guestPhone = guestPhone || null;
    if (guestEmail !== undefined) updateData.guestEmail = guestEmail || null;
    if (guestNationality !== undefined) updateData.guestNationality = guestNationality;
    if (adults !== undefined) updateData.adults = Number(adults);
    if (children !== undefined) updateData.children = Number(children);
    if (checkIn !== undefined) updateData.checkIn = new Date(checkIn);
    if (checkOut !== undefined) updateData.checkOut = new Date(checkOut);
    if (roomType !== undefined) updateData.roomType = roomType;
    if (specialRequests !== undefined) updateData.specialRequests = specialRequests || null;
    if (includePoolAccess !== undefined) updateData.includePoolAccess = Boolean(includePoolAccess);
    if (includeSpaPackage !== undefined) updateData.includeSpaPackage = Boolean(includeSpaPackage);
    if (poolPassCount !== undefined) updateData.poolPassCount = Number(poolPassCount) || 0;
    if (spaServiceType !== undefined) updateData.spaServiceType = spaServiceType || null;
    if (notes !== undefined) updateData.notes = notes;
    if (commissionPaid !== undefined) updateData.commissionPaid = Boolean(commissionPaid);

    // If agent edited the booking or requireApproval flag is on, always revert to PENDING
    const isEditResubmission = Boolean(isAgentEdit || requireApproval);
    if (isEditResubmission) {
      updateData.status = 'PENDING';
    } else if (status !== undefined) {
      updateData.status = status;
    }

    // Recalculate commission if totalAmount changes
    if (totalAmount !== undefined) {
      const parsedTotal = Number(totalAmount) || 0;
      updateData.totalAmount = parsedTotal;
      updateData.commission = (parsedTotal * (booking.agent.commissionRate || 10)) / 100;
    }

    const updated = await prisma.agentBooking.update({ where: { id }, data: updateData });

    // If marking commission paid, update agent total earnings
    if (commissionPaid === true && !booking.commissionPaid) {
      await prisma.travelAgent.update({
        where: { id: booking.agentId },
        data: { totalEarnings: { increment: booking.commission } },
      });
    }

    // If edited by agent, create in-app notification & sound alert for the hotel front office
    if (isEditResubmission) {
      await prisma.notification.create({
        data: {
          propertyId: booking.propertyId,
          title: `🔔 Agent Booking Edited: ${updateData.guestName || booking.guestName}`,
          message: `${updateData.roomType || booking.roomType} updated by ${booking.agent.name}. Total: ₹${Number(updateData.totalAmount || booking.totalAmount).toLocaleString()} (Commission: ₹${Number(updateData.commission || booking.commission).toLocaleString()}). Re-approval required.`,
          type: 'AGENT_BOOKING',
          status: 'UNREAD',
          priority: 'HIGH',
          metadata: JSON.stringify({
            bookingId: booking.id,
            agentId: booking.agentId,
            agentName: booking.agent.name,
            guestName: updateData.guestName || booking.guestName,
            roomType: updateData.roomType || booking.roomType,
            totalAmount: updateData.totalAmount || booking.totalAmount,
            commission: updateData.commission || booking.commission,
            link: '/hotel/agent-bookings',
            isEdit: true,
          }),
        },
      }).catch((err) => {
        console.error('[AgentBooking] Failed to notify on edit:', err);
      });
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: isEditResubmission
        ? 'Booking updated successfully! Sent to hotel front desk for approval.'
        : 'Booking updated.',
    });
  } catch (error: any) {
    return apiError(error);
  }
}
