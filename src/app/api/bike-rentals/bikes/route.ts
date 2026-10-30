import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/bike-rentals/bikes
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawVendorId = searchParams.get('vendorId');
    const vendorId = (rawVendorId && rawVendorId !== 'undefined' && rawVendorId !== 'null') ? rawVendorId : null;
    const category = searchParams.get('category');
    const status = searchParams.get('status');

    const where: any = {};
    if (vendorId) where.vendorId = vendorId;
    if (category) where.category = category;
    if (status) where.status = status;

    const bikes = await prisma.rentalBike.findMany({
      where,
      include: {
        vendor: {
          select: { id: true, name: true, shopName: true, phone: true, city: true, rating: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: bikes });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST /api/bike-rentals/bikes (Add a new bike to fleet)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      vendorId, model, category = 'SCOOTER', plateNumber,
      hourlyRate, dailyRate = 500, securityDeposit = 1000,
      helmetsProvided = 1, fuelIncluded = false, photoUrl,
    } = body;

    if (!vendorId || !model || !plateNumber) {
      return NextResponse.json(
        { success: false, message: 'Vendor ID, model, and plate number are required' },
        { status: 400 }
      );
    }

    const cleanPlate = plateNumber.trim().toUpperCase();

    // Check unique plate number
    const existing = await prisma.rentalBike.findUnique({
      where: { plateNumber: cleanPlate },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, message: `Bike with plate ${cleanPlate} already registered` },
        { status: 409 }
      );
    }

    const bike = await prisma.rentalBike.create({
      data: {
        vendorId,
        model: model.trim(),
        category,
        plateNumber: cleanPlate,
        hourlyRate: hourlyRate ? Number(hourlyRate) : null,
        dailyRate: Number(dailyRate) || 500,
        securityDeposit: Number(securityDeposit) || 1000,
        helmetsProvided: Number(helmetsProvided) || 1,
        fuelIncluded: Boolean(fuelIncluded),
        photoUrl: photoUrl || null,
        status: 'AVAILABLE',
      },
      include: { vendor: true },
    });

    return NextResponse.json({
      success: true,
      message: `${bike.model} (${bike.plateNumber}) added to rental fleet!`,
      data: bike,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// PATCH /api/bike-rentals/bikes (Update bike details or status)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, dailyRate, hourlyRate, securityDeposit, photoUrl, model, category, helmetsProvided, fuelIncluded } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Bike ID is required' }, { status: 400 });
    }

    const data: any = {};
    if (status) data.status = status;
    if (dailyRate !== undefined) data.dailyRate = Number(dailyRate);
    if (hourlyRate !== undefined) data.hourlyRate = Number(hourlyRate);
    if (securityDeposit !== undefined) data.securityDeposit = Number(securityDeposit);
    if (photoUrl !== undefined) data.photoUrl = photoUrl || null;
    if (model) data.model = model.trim();
    if (category) data.category = category;
    if (helmetsProvided !== undefined) data.helmetsProvided = Number(helmetsProvided);
    if (fuelIncluded !== undefined) data.fuelIncluded = Boolean(fuelIncluded);

    const updated = await prisma.rentalBike.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, message: 'Vehicle details updated', data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// DELETE /api/bike-rentals/bikes
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Bike ID is required' }, { status: 400 });
    }

    await prisma.rentalBike.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Bike removed from fleet' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
