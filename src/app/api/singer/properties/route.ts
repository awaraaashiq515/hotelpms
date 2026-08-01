import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const properties = await prisma.property.findMany({
      select: {
        id: true,
        name: true,
        city: true,
        code: true
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ success: true, data: properties });
  } catch (error: any) {
    console.error('[Singer Properties GET Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
