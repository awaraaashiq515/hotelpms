import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const propertyId = session.propertyId || searchParams.get('propertyId');

    if (!propertyId) {
      return NextResponse.json({ success: false, message: 'Property ID is required' }, { status: 400 });
    }

    const outlets = await prisma.outlet.findMany({
      where: { propertyId: propertyId },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, data: outlets });
  } catch (error) {
    console.error('Error fetching outlets:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
