import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Fetch all banquet halls
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');

    const where: any = {};
    if (propertyId) {
      where.propertyId = propertyId;
    }

    const halls = await prisma.banquetHall.findMany({
      where,
      orderBy: { capacity: 'desc' }
    });

    return NextResponse.json({ success: true, data: halls });
  } catch (error: any) {
    console.error('[Banquet Halls GET Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}

// POST: Create a new banquet hall
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, code, capacity, minCapacity, baseRate, hourlyRate, description, amenities, propertyId } = body;

    if (!name) {
      return NextResponse.json({ success: false, message: 'Hall name is required.' }, { status: 400 });
    }

    const newHall = await prisma.banquetHall.create({
      data: {
        name,
        code: code || `HALL-${Math.floor(100 + Math.random() * 900)}`,
        capacity: capacity ? parseInt(capacity) : 100,
        minCapacity: minCapacity ? parseInt(minCapacity) : 20,
        baseRate: baseRate ? parseFloat(baseRate) : 25000,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : 5000,
        description,
        amenities,
        propertyId
      }
    });

    return NextResponse.json({ success: true, data: newHall, message: 'Banquet hall created successfully!' });
  } catch (error: any) {
    console.error('[Banquet Halls POST Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}

// PUT: Edit hall details
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, capacity, minCapacity, baseRate, hourlyRate, description, amenities, isActive } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Hall ID is required.' }, { status: 400 });
    }

    const updatedHall = await prisma.banquetHall.update({
      where: { id },
      data: {
        name,
        capacity: capacity ? parseInt(capacity) : undefined,
        minCapacity: minCapacity ? parseInt(minCapacity) : undefined,
        baseRate: baseRate ? parseFloat(baseRate) : undefined,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
        description,
        amenities,
        isActive: isActive !== undefined ? isActive : undefined
      }
    });

    return NextResponse.json({ success: true, data: updatedHall, message: 'Banquet hall updated successfully!' });
  } catch (error: any) {
    console.error('[Banquet Halls PUT Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}

// DELETE: Delete a banquet hall
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Hall ID is required.' }, { status: 400 });
    }

    await prisma.banquetHall.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Banquet hall deleted successfully!' });
  } catch (error: any) {
    console.error('[Banquet Halls DELETE Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
