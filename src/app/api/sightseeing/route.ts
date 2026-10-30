import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const propertyId = searchParams.get('propertyId');

    const where: any = { isActive: true };
    if (category) where.category = category;
    if (propertyId) where.propertyId = propertyId;

    const spots = await prisma.sightseeingSpot.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: spots });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name, category = 'MONUMENT', distance = '2 km',
      timing = '9:00 AM – 6:00 PM', entryFee, rating = 4.7,
      description, photoUrl, tags, contactPhone, propertyId,
    } = body;

    if (!name || !description) {
      return NextResponse.json(
        { success: false, message: 'Spot name and description are required' },
        { status: 400 }
      );
    }

    const spot = await prisma.sightseeingSpot.create({
      data: {
        propertyId: propertyId || null,
        name: name.trim(),
        category,
        distance: distance.trim(),
        timing: timing.trim(),
        entryFee: entryFee?.trim() || null,
        rating: Number(rating) || 4.7,
        description: description.trim(),
        photoUrl: photoUrl || null,
        tags: tags || null,
        contactPhone: contactPhone?.trim() || null,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `${spot.name} added to sightseeing destinations!`,
      data: spot,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ success: false, message: 'Spot ID required' }, { status: 400 });

    await prisma.sightseeingSpot.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Sightseeing spot removed' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
