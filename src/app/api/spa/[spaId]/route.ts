import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// GET /api/spa/[spaId] — Get spa details
export async function GET(req: NextRequest, { params }: { params: Promise<{ spaId: string }> }) {
  try {
    const { spaId } = await params;

    const spa = await prisma.spa.findUnique({
      where: { id: spaId },
      include: {
        services: { where: { isActive: true }, orderBy: { category: 'asc' } },
        therapists: { where: { isActive: true }, orderBy: { name: 'asc' } },
        _count: { select: { bookings: true, services: true, therapists: true } },
      },
    });

    if (!spa) {
      return NextResponse.json({ error: 'Spa not found' }, { status: 404 });
    }

    return NextResponse.json({ spa });
  } catch (error) {
    console.error('[GET /api/spa/[spaId]]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH /api/spa/[spaId] — Update spa details
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ spaId: string }> }) {
  try {
    const { spaId } = await params;
    const body = await req.json();

    const passwordHash = body.password ? await bcrypt.hash(String(body.password).trim(), 10) : undefined;
    const ownerEmail = body.ownerEmail ? String(body.ownerEmail).trim().toLowerCase() : undefined;

    const spa = await prisma.spa.update({
      where: { id: spaId },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.email !== undefined && { email: body.email }),
        ...(body.address !== undefined && { address: body.address }),
        ...(body.openTime !== undefined && { openTime: body.openTime }),
        ...(body.closeTime !== undefined && { closeTime: body.closeTime }),
        ...(body.commissionPct !== undefined && { commissionPct: parseFloat(body.commissionPct) }),
        ...(body.gstNumber !== undefined && { gstNumber: body.gstNumber }),
        ...(body.ownerName !== undefined && { ownerName: body.ownerName }),
        ...(body.ownerPhone !== undefined && { ownerPhone: body.ownerPhone }),
        ...(ownerEmail !== undefined && { ownerEmail }),
        ...(passwordHash !== undefined && { passwordHash }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.logoUrl !== undefined && { logoUrl: body.logoUrl }),
      },
    });

    return NextResponse.json({ spa });
  } catch (error) {
    console.error('[PATCH /api/spa/[spaId]]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/spa/[spaId] — Delete spa
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ spaId: string }> }) {
  try {
    const { spaId } = await params;

    await prisma.spa.delete({ where: { id: spaId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/spa/[spaId]]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
