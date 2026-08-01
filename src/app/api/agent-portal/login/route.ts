import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, pinCode, agentCode } = body;

    if ((!phone && !agentCode) || !pinCode) {
      return NextResponse.json(
        { success: false, message: 'Phone/Agent Code and PIN are required.' },
        { status: 400 }
      );
    }

    const where: any = { pinCode: String(pinCode) };
    if (agentCode) where.agentCode = agentCode.toUpperCase();
    else if (phone) where.phone = phone;

    const agent = await prisma.travelAgent.findFirst({
      where,
      include: {
        bookings: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            guestName: true,
            guestPhone: true,
            checkIn: true,
            checkOut: true,
            roomType: true,
            totalAmount: true,
            commission: true,
            commissionPaid: true,
            status: true,
            adults: true,
            children: true,
            createdAt: true,
          },
        },
        property: {
          select: {
            name: true,
            code: true,
            phone: true,
            logoUrl: true,
            city: true,
          },
        },
      },
    });

    if (!agent) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials. Please check your Agent Code and PIN.' },
        { status: 401 }
      );
    }

    if (!agent.isActive) {
      return NextResponse.json(
        { success: false, message: 'Your agent account is deactivated. Contact the hotel.' },
        { status: 403 }
      );
    }

    const { pinCode: _pin, ...agentData } = agent;

    const stats = {
      totalBookings: agent.bookings.length,
      pendingBookings: agent.bookings.filter((b) => b.status === 'PENDING').length,
      confirmedBookings: agent.bookings.filter((b) => b.status === 'CONFIRMED').length,
      completedBookings: agent.bookings.filter((b) => b.status === 'COMPLETED').length,
      totalCommissionEarned: agent.bookings.reduce((s, b) => s + b.commission, 0),
      commissionPaid: agent.bookings.filter((b) => b.commissionPaid).reduce((s, b) => s + b.commission, 0),
      commissionPending: agent.bookings.filter((b) => !b.commissionPaid).reduce((s, b) => s + b.commission, 0),
    };

    return NextResponse.json({ success: true, data: agentData, stats });
  } catch (error: any) {
    return apiError(error);
  }
}
