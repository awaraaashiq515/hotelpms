import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// POST /api/spa/auth — Email & Password login for Spa Owner
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Find active spa by ownerEmail or spa contact email
    const spa = await prisma.spa.findFirst({
      where: {
        OR: [
          { ownerEmail: normalizedEmail },
          { email: normalizedEmail },
        ],
        isActive: true,
      },
      include: {
        property: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    if (!spa || !spa.passwordHash) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, spa.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate random token for session storage
    const token = crypto.randomBytes(32).toString('hex');

    return NextResponse.json({
      success: true,
      token,
      spa: {
        id: spa.id,
        name: spa.name,
        ownerName: spa.ownerName,
        ownerEmail: spa.ownerEmail || spa.email,
        ownerPhone: spa.ownerPhone || spa.phone,
        propertyId: spa.propertyId,
        propertyName: spa.property?.name,
        commissionPct: spa.commissionPct,
      },
    });
  } catch (error) {
    console.error('[POST /api/spa/auth]', error);
    return NextResponse.json(
      { success: false, message: 'Authentication error' },
      { status: 500 }
    );
  }
}
