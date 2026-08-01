import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-utils';
import bcrypt from 'bcryptjs';

// POST /api/agent-portal/register
// Self-registration by travel agent (email + password)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, phone, companyName, city, propertyId } = body;

    if (!name || !email || !password || !phone) {
      return NextResponse.json(
        { success: false, message: 'Name, email, password, and phone are required.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters.' },
        { status: 400 }
      );
    }

    // Check duplicate email
    const existing = await prisma.travelAgent.findFirst({
      where: { email: email.toLowerCase() },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'An account with this email already exists.' },
        { status: 409 }
      );
    }

    // Generate unique agent code
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    let agentCode = `AGT-${randomSuffix}`;
    // Make sure it's unique
    while (await prisma.travelAgent.findUnique({ where: { agentCode } })) {
      agentCode = `AGT-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const agent = await prisma.travelAgent.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        phone,
        companyName: companyName?.trim() || null,
        city: city?.trim() || null,
        agentCode,
        pinCode: String(Math.floor(1000 + Math.random() * 9000)), // legacy PIN
        ...(propertyId ? { propertyId } : {}),
        commissionRate: 10.0,
        agentStatus: 'ACTIVE',
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Registration successful! You can now log in.',
      data: {
        id: agent.id,
        name: agent.name,
        email: agent.email,
        agentCode: agent.agentCode,
        commissionRate: agent.commissionRate,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
