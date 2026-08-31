import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-utils';
import bcrypt from 'bcryptjs';

// POST /api/agent-portal/auth
// Email + Password login for agent portal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const agent = await prisma.travelAgent.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        isActive: true,
      },
      include: {
        property: { select: { id: true, name: true, city: true, phone: true, logoUrl: true } },
        hotelRelations: {
          select: { propertyId: true, commissionRate: true, isBlocked: true },
        },
        bookings: {
          orderBy: { createdAt: 'desc' },
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
      },
    });

    if (!agent || !agent.passwordHash) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password. Please check your credentials.' },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, agent.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // Calculate stats
    const bookings = agent.bookings;
    const stats = {
      totalBookings: bookings.length,
      pendingBookings: bookings.filter(b => b.status === 'PENDING').length,
      confirmedBookings: bookings.filter(b => b.status === 'CONFIRMED').length,
      completedBookings: bookings.filter(b => b.status === 'COMPLETED').length,
      totalCommissionEarned: bookings.reduce((sum, b) => sum + b.commission, 0),
      commissionPaid: bookings.filter(b => b.commissionPaid).reduce((sum, b) => sum + b.commission, 0),
      commissionPending: bookings.filter(b => !b.commissionPaid).reduce((sum, b) => sum + b.commission, 0),
    };

    const { passwordHash, pinCode, ...safeAgent } = agent;

    return NextResponse.json({
      success: true,
      data: safeAgent,
      stats,
    });
  } catch (error) {
    return apiError(error);
  }
}

// GET /api/agent-portal/auth?agentId=... or ?email=...
// Real-time refresh of agent profile, bookings & commission stats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');
    const email = searchParams.get('email');

    if (!agentId && !email) {
      return NextResponse.json(
        { success: false, message: 'agentId or email is required' },
        { status: 400 }
      );
    }

    const where: any = { isActive: true };
    if (agentId) where.id = agentId;
    else if (email) where.email = email.toLowerCase().trim();

    const agent = await prisma.travelAgent.findFirst({
      where,
      include: {
        property: { select: { id: true, name: true, city: true, phone: true, logoUrl: true } },
        hotelRelations: {
          select: { propertyId: true, commissionRate: true, isBlocked: true },
        },
        bookings: {
          orderBy: { createdAt: 'desc' },
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
            includePoolAccess: true,
            includeSpaPackage: true,
            poolPassCount: true,
            spaServiceType: true,
            createdAt: true,
          },
        },
      },
    });

    if (!agent) {
      return NextResponse.json(
        { success: false, message: 'Agent not found' },
        { status: 404 }
      );
    }

    const bookings = agent.bookings;
    const stats = {
      totalBookings: bookings.length,
      pendingBookings: bookings.filter(b => b.status === 'PENDING').length,
      confirmedBookings: bookings.filter(b => b.status === 'CONFIRMED').length,
      completedBookings: bookings.filter(b => b.status === 'COMPLETED').length,
      totalCommissionEarned: bookings.reduce((sum, b) => sum + b.commission, 0),
      commissionPaid: bookings.filter(b => b.commissionPaid).reduce((sum, b) => sum + b.commission, 0),
      commissionPending: bookings.filter(b => !b.commissionPaid).reduce((sum, b) => sum + b.commission, 0),
    };

    const { passwordHash, pinCode, ...safeAgent } = agent;

    return NextResponse.json({
      success: true,
      data: safeAgent,
      stats,
    });
  } catch (error) {
    return apiError(error);
  }
}
