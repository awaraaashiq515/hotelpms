import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';
import bcrypt from 'bcryptjs';

function generateAgentCode(): string {
  const prefix = 'AGT';
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${random}`;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { agentCode: { contains: search } },
        { companyName: { contains: search } },
      ];
    }

    const agents = await prisma.travelAgent.findMany({
      where,
      include: {
        hotelRelations: {
          where: { propertyId: session.propertyId! },
        },
        bookings: {
          where: { propertyId: session.propertyId! },
          select: {
            id: true,
            status: true,
            totalAmount: true,
            commission: true,
            commissionPaid: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const enriched = agents.map(agent => {
      const rel = agent.hotelRelations[0];
      return {
        ...agent,
        commissionRate: rel ? rel.commissionRate : agent.commissionRate,
        isBlocked: rel ? rel.isBlocked : false,
        blockedReason: rel ? rel.blockedReason : null,
      };
    });

    const summary = {
      total: enriched.length,
      active: enriched.filter((a) => a.isActive && !a.isBlocked).length,
      totalCommissionEarned: enriched.reduce(
        (sum, a) => sum + a.bookings.reduce((s, b) => s + b.commission, 0),
        0
      ),
      totalCommissionPaid: enriched.reduce(
        (sum, a) =>
          sum +
          a.bookings
            .filter((b) => b.commissionPaid)
            .reduce((s, b) => s + b.commission, 0),
        0
      ),
    };

    return NextResponse.json({ success: true, data: enriched, summary });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const { name, phone, email, companyName, address, city, commissionRate = 10, pinCode = '1234', notes, portalPassword } = body;

    if (!name || !phone) {
      return NextResponse.json({ success: false, message: 'Agent name and phone are required.' }, { status: 400 });
    }

    // Check duplicate phone
    const existing = await prisma.travelAgent.findFirst({
      where: { phone },
    });
    if (existing) {
      // Upsert hotel relation if agent exists
      await prisma.agentHotelRelation.upsert({
        where: {
          agentId_propertyId: {
            agentId: existing.id,
            propertyId: session.propertyId!,
          },
        },
        create: {
          agentId: existing.id,
          propertyId: session.propertyId!,
          commissionRate: Number(commissionRate),
        },
        update: {
          commissionRate: Number(commissionRate),
        },
      });

      return NextResponse.json({
        success: true,
        data: existing,
        message: `Agent "${existing.name}" is already registered. Added to your property list with ${commissionRate}% commission!`,
      });
    }

    // Generate unique agent code
    let agentCode = generateAgentCode();
    let attempts = 0;
    while (await prisma.travelAgent.findUnique({ where: { agentCode } }) && attempts < 10) {
      agentCode = generateAgentCode();
      attempts++;
    }

    let passwordHash: string | null = null;
    if (portalPassword && portalPassword.length >= 6) {
      passwordHash = await bcrypt.hash(portalPassword, 10);
    }

    const agent = await prisma.travelAgent.create({
      data: {
        propertyId: session.propertyId!,
        name,
        agentCode,
        phone,
        email: email || null,
        companyName: companyName || null,
        address: address || null,
        city: city || null,
        commissionRate: Number(commissionRate),
        pinCode: String(pinCode || '1234'),
        passwordHash,
        notes: notes || null,
        hotelRelations: {
          create: {
            propertyId: session.propertyId!,
            commissionRate: Number(commissionRate),
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: agent, message: `Agent "${name}" registered! Code: ${agentCode}` });
  } catch (error: any) {
    return apiError(error);
  }
}
