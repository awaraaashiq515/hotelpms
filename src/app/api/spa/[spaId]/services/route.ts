import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/spa/[spaId]/services — List services for a spa
export async function GET(req: NextRequest, { params }: { params: Promise<{ spaId: string }> }) {
  try {
    const { spaId } = await params;
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const services = await prisma.spaService.findMany({
      where: {
        spaId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json({ services });
  } catch (error) {
    console.error('[GET /api/spa/[spaId]/services]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/spa/[spaId]/services — Add a new service
export async function POST(req: NextRequest, { params }: { params: Promise<{ spaId: string }> }) {
  try {
    const { spaId } = await params;
    const body = await req.json();
    const { name, category, description, duration, price, gstRate, image } = body;

    if (!name || !duration || price === undefined) {
      return NextResponse.json({ error: 'name, duration, and price are required' }, { status: 400 });
    }

    // Verify spa exists and get propertyId
    const spa = await prisma.spa.findUnique({ where: { id: spaId } });
    if (!spa) return NextResponse.json({ error: 'Spa not found' }, { status: 404 });

    const service = await prisma.spaService.create({
      data: {
        spaId,
        propertyId: spa.propertyId,
        name,
        category: category || 'General',
        description,
        duration: parseInt(duration),
        price: parseFloat(price),
        gstRate: gstRate !== undefined ? parseFloat(gstRate) : 18,
        image,
        isActive: true,
      },
    });

    return NextResponse.json({ service }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/spa/[spaId]/services]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
