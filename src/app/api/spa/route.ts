import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// GET /api/spa?propertyId=xxx — List all spas for a property
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get('propertyId');

    if (!propertyId) {
      return NextResponse.json({ error: 'propertyId required' }, { status: 400 });
    }

    const spas = await prisma.spa.findMany({
      where: { propertyId },
      include: {
        _count: {
          select: {
            services: true,
            therapists: true,
            bookings: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ spas });
  } catch (error) {
    console.error('[GET /api/spa]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/spa — Create a new spa
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      propertyId,
      name,
      description,
      phone,
      email,
      address,
      openTime,
      closeTime,
      commissionPct,
      gstNumber,
      ownerName,
      ownerPhone,
      ownerEmail,
      password,
    } = body;

    if (!propertyId || !name) {
      return NextResponse.json({ error: 'propertyId and name required' }, { status: 400 });
    }

    const normalizedEmail = ownerEmail ? String(ownerEmail).trim().toLowerCase() : (email ? String(email).trim().toLowerCase() : null);
    const passwordHash = password ? await bcrypt.hash(String(password).trim(), 10) : null;

    // Enable spa on property
    await prisma.property.update({
      where: { id: propertyId },
      data: { spaEnabled: true },
    });

    const spa = await prisma.spa.create({
      data: {
        propertyId,
        name,
        description,
        phone,
        email,
        address,
        openTime: openTime || '09:00',
        closeTime: closeTime || '21:00',
        commissionPct: commissionPct ? parseFloat(commissionPct) : 0,
        gstNumber,
        ownerName,
        ownerPhone,
        ownerEmail: normalizedEmail,
        passwordHash,
        isActive: true,
      },
    });

    return NextResponse.json({ spa }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/spa]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
