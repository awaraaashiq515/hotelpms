import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/hotel/settings/tipping?propertyId=xxx
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const propertyId = searchParams.get('propertyId');

  if (!propertyId) {
    return NextResponse.json({ success: false, message: 'propertyId required' }, { status: 400 });
  }

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: {
      tippingEnabled: true,
      tippingStaffRoles: true,
      tippingPresets: true,
    },
  });

  if (!property) {
    return NextResponse.json({ success: false, message: 'Property not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, settings: property });
}

// PATCH /api/hotel/settings/tipping — Tipping settings update karo
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { propertyId, tippingEnabled, tippingStaffRoles, tippingPresets } = body;

  if (!propertyId) {
    return NextResponse.json({ success: false, message: 'propertyId required' }, { status: 400 });
  }

  const updated = await prisma.property.update({
    where: { id: propertyId },
    data: {
      ...(tippingEnabled !== undefined ? { tippingEnabled } : {}),
      ...(tippingStaffRoles !== undefined ? { tippingStaffRoles } : {}),
      ...(tippingPresets !== undefined ? { tippingPresets } : {}),
    },
    select: {
      tippingEnabled: true,
      tippingStaffRoles: true,
      tippingPresets: true,
    },
  });

  return NextResponse.json({ success: true, settings: updated });
}
