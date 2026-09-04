import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/property/by-code?code=HOTEL123
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ success: false, message: 'Property code required' }, { status: 400 });
  }

  const property = await prisma.property.findUnique({
    where: { code },
    select: {
      id: true,
      name: true,
      code: true,
      city: true,
      logoUrl: true,
      tippingEnabled: true,
    },
  });

  if (!property) {
    return NextResponse.json({ success: false, message: 'Property not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, property });
}
