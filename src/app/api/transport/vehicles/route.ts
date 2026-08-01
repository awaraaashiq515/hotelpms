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

// GET /api/transport/vehicles — Get all vehicles for driver
export async function GET(request: NextRequest) {
  const driverId = await getDriverId(request);
  if (!driverId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  try {
    const vehicles = await prisma.transportVehicle.findMany({
      where: { driverId },
      include: { schedules: true },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ success: true, vehicles });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST /api/transport/vehicles — Add a new vehicle
export async function POST(request: NextRequest) {
  const driverId = await getDriverId(request);
  if (!driverId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { type, plateNumber, model, color, capacity, perKmRate, baseFare, photoUrl } = body;

    if (!plateNumber) {
      return NextResponse.json({ success: false, message: 'Plate number is required.' }, { status: 400 });
    }

    const vehicle = await prisma.transportVehicle.create({
      data: {
        driverId,
        type: type || 'CAR',
        plateNumber: plateNumber.trim().toUpperCase(),
        model: model?.trim() || null,
        color: color?.trim() || null,
        capacity: Number(capacity) || 4,
        perKmRate: perKmRate ? Number(perKmRate) : 15.0,
        baseFare: baseFare ? Number(baseFare) : 50.0,
        photoUrl: photoUrl || null,
      }
    });

    return NextResponse.json({ success: true, vehicle });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// DELETE /api/transport/vehicles?vehicleId=xxx — Remove a vehicle
export async function DELETE(request: NextRequest) {
  const driverId = await getDriverId(request);
  if (!driverId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const vehicleId = request.nextUrl.searchParams.get('vehicleId');
  if (!vehicleId) return NextResponse.json({ success: false, message: 'Vehicle ID required.' }, { status: 400 });

  try {
    const vehicle = await prisma.transportVehicle.findFirst({ where: { id: vehicleId, driverId } });
    if (!vehicle) return NextResponse.json({ success: false, message: 'Vehicle not found.' }, { status: 404 });

    await prisma.transportVehicle.delete({ where: { id: vehicleId } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
