import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Public API — returns all active feature prices (used in signup custom plan builder)
export async function GET() {
  try {
    const features = await prisma.featurePricing.findMany({
      where: { isActive: true },
      orderBy: { feature: 'asc' },
    });

    return NextResponse.json({ success: true, data: features });
  } catch (error: any) {
    console.error('Failed to fetch feature pricing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch feature pricing' },
      { status: 500 }
    );
  }
}
