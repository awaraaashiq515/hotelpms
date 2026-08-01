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

// GET /api/transport/schedule — Get all schedules for driver's vehicles
export async function GET(request: NextRequest) {
  const driverId = await getDriverId(request);
  if (!driverId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  try {
    const vehicles = await prisma.transportVehicle.findMany({ where: { driverId }, select: { id: true } });
    const vehicleIds = vehicles.map((v: any) => v.id);

    const schedules = await prisma.transportSchedule.findMany({
      where: { vehicleId: { in: vehicleIds } },
      include: { vehicle: { select: { type: true, plateNumber: true } } },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, schedules });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST /api/transport/schedule — Add a new schedule
export async function POST(request: NextRequest) {
  const driverId = await getDriverId(request);
  if (!driverId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { vehicleId, routeName, fromLocation, toLocation, departureTime, arrivalTime, days, pricePerSeat, fullVehiclePrice, notes } = body;

    if (!vehicleId || !routeName || !fromLocation || !toLocation || !departureTime || !days) {
      return NextResponse.json({ success: false, message: 'Missing required fields.' }, { status: 400 });
    }

    // Verify vehicle belongs to this driver
    const vehicle = await prisma.transportVehicle.findFirst({ where: { id: vehicleId, driverId } });
    if (!vehicle) return NextResponse.json({ success: false, message: 'Vehicle not found.' }, { status: 404 });

    const schedule = await prisma.transportSchedule.create({
      data: {
        vehicleId,
        routeName: routeName.trim(),
        fromLocation: fromLocation.trim(),
        toLocation: toLocation.trim(),
        departureTime,
        arrivalTime: arrivalTime || null,
        days: Array.isArray(days) ? days.join(',') : days,
        pricePerSeat: Number(pricePerSeat) || 0,
        fullVehiclePrice: fullVehiclePrice ? Number(fullVehiclePrice) : null,
        notes: notes?.trim() || null,
      },
      include: { vehicle: { select: { type: true, plateNumber: true } } }
    });

    return NextResponse.json({ success: true, schedule });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// PUT /api/transport/schedule — Toggle schedule active status
export async function PUT(request: NextRequest) {
  const driverId = await getDriverId(request);
  if (!driverId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { scheduleId, isActive } = body;

    if (!scheduleId) return NextResponse.json({ success: false, message: 'Schedule ID required.' }, { status: 400 });

    const schedule = await prisma.transportSchedule.findFirst({
      where: { id: scheduleId, vehicle: { driverId } }
    });
    if (!schedule) return NextResponse.json({ success: false, message: 'Schedule not found.' }, { status: 404 });

    const updated = await prisma.transportSchedule.update({
      where: { id: scheduleId },
      data: { isActive: isActive ?? !schedule.isActive },
      include: { vehicle: { select: { type: true, plateNumber: true } } }
    });

    return NextResponse.json({ success: true, schedule: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// DELETE /api/transport/schedule?scheduleId=xxx
export async function DELETE(request: NextRequest) {
  const driverId = await getDriverId(request);
  if (!driverId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const scheduleId = request.nextUrl.searchParams.get('scheduleId');
  if (!scheduleId) return NextResponse.json({ success: false, message: 'Schedule ID required.' }, { status: 400 });

  try {
    const schedule = await prisma.transportSchedule.findFirst({
      where: { id: scheduleId, vehicle: { driverId } }
    });
    if (!schedule) return NextResponse.json({ success: false, message: 'Not found.' }, { status: 404 });

    await prisma.transportSchedule.delete({ where: { id: scheduleId } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
