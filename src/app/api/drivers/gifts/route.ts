import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.propertyId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get('driverId');

    if (!driverId) {
      return NextResponse.json({ success: false, message: 'Driver ID is required' }, { status: 400 });
    }

    const gifts = await (prisma as any).driverGift.findMany({
      where: { driverId },
      include: { rule: true },
      orderBy: { issuedAt: 'desc' }
    });

    return NextResponse.json({ success: true, data: gifts });
  } catch (error) {
    console.error('Error fetching gifts:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.propertyId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { driverId, ruleId, giftName, remarks } = body;

    if (!driverId || !giftName) {
      return NextResponse.json({ success: false, message: 'Required fields missing' }, { status: 400 });
    }

    const newGift = await (prisma as any).driverGift.create({
      data: {
        driverId,
        ruleId: ruleId || null,
        giftName,
        status: 'CLAIMED',
        remarks: remarks || ''
      }
    });

    return NextResponse.json({ success: true, data: newGift });
  } catch (error) {
    console.error('Error issuing gift:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
