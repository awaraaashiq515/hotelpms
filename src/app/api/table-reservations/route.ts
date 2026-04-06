import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { getMultiTenantWhere } from '@/lib/api-utils';
import { recordDriverActivity } from '@/lib/incentive-utils';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyIdParam = searchParams.get('propertyId');
    const where = getMultiTenantWhere(session, propertyIdParam);

    const reservations = await (prisma as any).tableReservation.findMany({
      where,
      include: {
        driver: true,
        table: { include: { floor: true } }
      },
      orderBy: [
        { date: 'asc' },
        { time: 'asc' }
      ]
    });

    return NextResponse.json({ success: true, data: reservations });
  } catch (error: any) {
    console.error('Error fetching table reservations:', error);
    return NextResponse.json({ success: false, message: 'Internal server error', error: error.message }, { status: 500 });
  }
}

// Force Next.js re-evaluation of updated Prisma client bundle
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { customerName, customerPhone, date, time, numberOfTables, guestCount, driverId, tableId, propertyId: bodyPropertyId } = body;
    
    const propertyId = session.propertyId || bodyPropertyId;
    if (!propertyId) {
      return NextResponse.json({ success: false, message: 'Property ID is required' }, { status: 400 });
    }

    if (!customerName || !date || !time) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    if (tableId) {
      const existing = await (prisma as any).tableReservation.findFirst({
        where: {
          tableId,
          date: new Date(date),
          time,
          status: { notIn: ['CANCELLED', 'COMPLETED'] }
        }
      });
      if (existing) {
        return NextResponse.json({ success: false, message: 'This table is already booked at the selected time.' }, { status: 400 });
      }
    }

    const newReservation = await (prisma as any).tableReservation.create({
      data: {
        propertyId,
        customerName,
        customerPhone,
        date: new Date(date),
        time,
        numberOfTables: Number(numberOfTables) || 1,
        guestCount: Number(guestCount) || 1,
        driverId: driverId || null,
        tableId: tableId || null,
        status: 'PENDING'
      }
    });

    // RECORD DRIVER ACTIVITY: If a driver is assigned, track this as a RIDE activity
    if (driverId && typeof driverId === 'string' && driverId.length > 5) {
      try {
        // We record as 'RIDE' because most driver goals are configured as 'RIDES' goals
        await recordDriverActivity(driverId, 'RIDE');
      } catch (incError) {
        console.error('[Table Reservation] Incentive Engine Error:', incError);
      }
    }

    return NextResponse.json({ success: true, data: newReservation });
  } catch (error: any) {
    console.error('Error creating table reservation:', error);
    return NextResponse.json({ success: false, message: 'Internal server error', error: error.message }, { status: 500 });
  }
}
