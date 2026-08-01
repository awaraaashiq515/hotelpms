import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

// GET: List performances for the property
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = session.propertyId || searchParams.get('propertyId');

    if (!propertyId) {
      return NextResponse.json({ success: false, message: 'Property ID is required' }, { status: 400 });
    }

    const performances = await prisma.performance.findMany({
      where: { propertyId },
      include: {
        singer: {
          select: {
            id: true,
            name: true,
            genre: true,
            photoUrl: true,
            rating: true,
          }
        },
        feedback: true,
      },
      orderBy: { date: 'desc' }
    });

    return NextResponse.json({ success: true, data: performances });
  } catch (error: any) {
    console.error('[Admin Performances GET Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}

// POST: Schedule a new performance
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { singerId, venueName, date, startTime, endTime, status } = await request.json();

    const propertyId = session.propertyId;
    if (!propertyId) {
      return NextResponse.json({ success: false, message: 'Property ID is not set in session.' }, { status: 400 });
    }

    if (!singerId || !venueName || !date || !startTime || !endTime) {
      return NextResponse.json({ success: false, message: 'Missing required performance details.' }, { status: 400 });
    }

    const performance = await prisma.performance.create({
      data: {
        singerId,
        propertyId,
        venueName,
        date: new Date(date),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: status || 'SCHEDULED',
      },
      include: {
        singer: true
      }
    });

    return NextResponse.json({ success: true, message: 'Performance scheduled successfully.', data: performance });
  } catch (error: any) {
    console.error('[Admin Performances POST Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}

// PUT: Edit scheduled performance
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id, venueName, date, startTime, endTime, status } = await request.json();

    if (!id) {
      return NextResponse.json({ success: false, message: 'Performance ID is required.' }, { status: 400 });
    }

    const updateData: any = {};
    if (venueName) updateData.venueName = venueName;
    if (date) updateData.date = new Date(date);
    if (startTime) updateData.startTime = new Date(startTime);
    if (endTime) updateData.endTime = new Date(endTime);
    if (status) updateData.status = status;

    const performance = await prisma.performance.update({
      where: { id },
      data: updateData,
      include: {
        singer: true
      }
    });

    return NextResponse.json({ success: true, message: 'Performance updated successfully.', data: performance });
  } catch (error: any) {
    console.error('[Admin Performances PUT Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}

// DELETE: Delete a performance slot
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Performance ID is required.' }, { status: 400 });
    }

    await prisma.performance.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Performance deleted successfully.' });
  } catch (error: any) {
    console.error('[Admin Performances DELETE Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
