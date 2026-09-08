import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/hotel/spa/settings?propertyId=xxx
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get('propertyId');

    if (!propertyId) {
      return NextResponse.json({ error: 'propertyId required' }, { status: 400 });
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        name: true,
        spaEnabled: true,
        externalSpaEnabled: true,
        spas: {
          where: { isActive: true },
          select: { id: true, name: true, ownerName: true, ownerEmail: true, commissionPct: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    return NextResponse.json({
      spaEnabled: property.spaEnabled,
      externalSpaEnabled: property.externalSpaEnabled,
      activeSpas: property.spas,
      activeSpaCount: property.spas.length,
    });
  } catch (error) {
    console.error('[GET /api/hotel/spa/settings]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH /api/hotel/spa/settings
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { propertyId, externalSpaEnabled } = body;

    if (!propertyId || typeof externalSpaEnabled !== 'boolean') {
      return NextResponse.json({ error: 'propertyId and externalSpaEnabled boolean required' }, { status: 400 });
    }

    const property = await prisma.property.update({
      where: { id: propertyId },
      data: {
        externalSpaEnabled,
        spaEnabled: true,
      },
      select: {
        id: true,
        externalSpaEnabled: true,
        spaEnabled: true,
      },
    });

    return NextResponse.json({
      success: true,
      externalSpaEnabled: property.externalSpaEnabled,
    });
  } catch (error) {
    console.error('[PATCH /api/hotel/spa/settings]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
