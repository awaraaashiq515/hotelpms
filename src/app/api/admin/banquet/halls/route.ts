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

    let halls = await prisma.banquetHall.findMany({
      orderBy: { capacity: 'desc' }
    });

    // Seed default halls if DB is empty
    if (halls.length === 0) {
      const defaultHalls = [
        { name: 'Grand Ballroom', code: 'GB-01', capacity: 400, minCapacity: 100, baseRate: 75000, hourlyRate: 10000, amenities: 'AC, Stage, LED Screen, Sound System, Grand Chandelier', description: 'Our premier luxury venue for weddings and large conventions.' },
        { name: 'Conference Hall A', code: 'CONF-A', capacity: 100, minCapacity: 25, baseRate: 25000, hourlyRate: 3500, amenities: 'AC, Projector, Mic System, Whiteboard, High-Speed WiFi', description: 'Ideal for corporate seminars and board meetings.' },
        { name: 'Conference Hall B', code: 'CONF-B', capacity: 80, minCapacity: 15, baseRate: 20000, hourlyRate: 3000, amenities: 'AC, Smart TV, Podiums, Audio System', description: 'Perfect for executive workshops and medium gatherings.' },
        { name: 'Pool Terrace Lawn', code: 'POOL-L', capacity: 150, minCapacity: 30, baseRate: 45000, hourlyRate: 6000, amenities: 'Open Air, Poolside Bar, Ambient Lighting, Live Grill Station', description: 'Scenic poolside venue for cocktail parties and evening bashes.' },
        { name: 'Rooftop Lounge', code: 'ROOF-01', capacity: 60, minCapacity: 10, baseRate: 35000, hourlyRate: 4500, amenities: 'Panoramic View, Private Bar, Lounge Sofa, Ambient Sound', description: 'Intimate rooftop venue for anniversaries and private parties.' },
      ];

      for (const h of defaultHalls) {
        await prisma.banquetHall.create({
          data: h
        });
      }

      halls = await prisma.banquetHall.findMany({
        orderBy: { capacity: 'desc' }
      });
    }

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
