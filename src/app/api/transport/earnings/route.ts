import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

const secretKey = process.env.JWT_SECRET || 'super-secret-default-key-change-it-in-prod';
const key = new TextEncoder().encode(secretKey);

async function getDriverId(request: NextRequest): Promise<string | null> {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    const { payload } = await jwtVerify(auth.slice(7), key);
    return payload.driverId as string;
  } catch {
    return null;
  }
}

// GET /api/transport/earnings
export async function GET(request: NextRequest) {
  const driverId = await getDriverId(request);
  if (!driverId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  try {
    const allBookings = await prisma.transportBooking.findMany({
      where: { driverId, status: 'COMPLETED' },
      orderBy: { createdAt: 'desc' }
    });

    const totalEarnings = allBookings.reduce((sum: number, b: any) => sum + b.totalAmount, 0);
    const totalTrips = allBookings.length;

    // Group by date for chart
    const byDate: Record<string, number> = {};
    allBookings.forEach((b: any) => {
      const date = b.travelDate;
      byDate[date] = (byDate[date] || 0) + b.totalAmount;
    });

    // Last 7 days
    const last7Days = Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7)
      .map(([date, amount]) => ({ date, amount }));

    return NextResponse.json({
      success: true,
      totalEarnings,
      totalTrips,
      last7Days,
      recentBookings: allBookings.slice(0, 10)
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// PUT /api/transport/earnings — Toggle driver online/offline status
export async function PUT(request: NextRequest) {
  const driverId = await getDriverId(request);
  if (!driverId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  try {
    const { isOnline } = await request.json();
    const driver = await prisma.transportDriver.update({
      where: { id: driverId },
      data: { isOnline: !!isOnline },
      select: { id: true, isOnline: true, name: true }
    });
    return NextResponse.json({ success: true, driver });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
