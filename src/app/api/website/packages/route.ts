import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const packages = await prisma.package.findMany({
      where: {
        isActive: true,
      },
      include: {
        features: true,
        permissions: true,
      },
      orderBy: {
        priceINR: 'asc',
      },
    });

    return NextResponse.json({ success: true, data: packages });
  } catch (error: any) {
    console.error('Failed to fetch packages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch packages' },
      { status: 500 }
    );
  }
}
