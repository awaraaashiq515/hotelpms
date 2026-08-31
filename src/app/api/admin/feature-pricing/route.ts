import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

// GET — list all feature prices (SUPER_ADMIN only)
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const features = await prisma.featurePricing.findMany({
    orderBy: { feature: 'asc' },
  });

  return NextResponse.json({ success: true, data: features });
}

// PUT — upsert feature prices (SUPER_ADMIN only)
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { features } = body as {
    features: { feature: string; label: string; priceINR: number; priceUSD: number; isActive: boolean }[];
  };

  if (!features || !Array.isArray(features)) {
    return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
  }

  const results = await Promise.all(
    features.map((f) =>
      prisma.featurePricing.upsert({
        where: { feature: f.feature },
        update: {
          label: f.label,
          priceINR: f.priceINR,
          priceUSD: f.priceUSD,
          isActive: f.isActive,
        },
        create: {
          feature: f.feature,
          label: f.label,
          priceINR: f.priceINR,
          priceUSD: f.priceUSD,
          isActive: f.isActive ?? true,
        },
      })
    )
  );

  return NextResponse.json({ success: true, data: results, updated: results.length });
}
