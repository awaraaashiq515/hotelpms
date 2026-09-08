import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/spa/[spaId]/therapists
export async function GET(req: NextRequest, { params }: { params: Promise<{ spaId: string }> }) {
  try {
    const { spaId } = await params;
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const therapists = await prisma.spaTherapist.findMany({
      where: {
        spaId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ therapists });
  } catch (error) {
    console.error('[GET /api/spa/[spaId]/therapists]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/spa/[spaId]/therapists — Add therapist
export async function POST(req: NextRequest, { params }: { params: Promise<{ spaId: string }> }) {
  try {
    const { spaId } = await params;
    const body = await req.json();
    const { name, gender, specialty, phone } = body;

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const spa = await prisma.spa.findUnique({ where: { id: spaId } });
    if (!spa) return NextResponse.json({ error: 'Spa not found' }, { status: 404 });

    const therapist = await prisma.spaTherapist.create({
      data: {
        spaId,
        propertyId: spa.propertyId,
        name,
        gender: gender || 'Female',
        specialty,
        phone,
        isActive: true,
      },
    });

    return NextResponse.json({ therapist }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/spa/[spaId]/therapists]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
