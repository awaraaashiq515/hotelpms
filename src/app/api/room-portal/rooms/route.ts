import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const propertyId = url.searchParams.get('propertyId');
    const propertyCode = url.searchParams.get('propertyCode');

    let targetPropertyId = propertyId || undefined;
    if (!targetPropertyId && propertyCode) {
      const p = await prisma.property.findFirst({
        where: {
          OR: [
            { code: propertyCode },
            { code: propertyCode.toUpperCase() },
            { code: propertyCode.toLowerCase() },
          ],
        },
        select: { id: true },
      });
      if (p) targetPropertyId = p.id;
    }

    // Find active checked-in reservations
    const activeReservations = await prisma.reservation.findMany({
      where: {
        status: { in: ['CHECKED_IN', 'CONFIRMED'] },
        ...(targetPropertyId ? { propertyId: targetPropertyId } : {}),
      },
      select: {
        id: true,
        bookingNo: true,
        status: true,
        rooms: {
          select: {
            room: { select: { roomNumber: true } },
          },
        },
        checkIns: {
          where: { status: 'ACTIVE' },
          select: {
            room: { select: { roomNumber: true } },
          },
        },
      },
    });

    const roomNumbers = new Set<string>();
    for (const r of activeReservations) {
      r.rooms?.forEach((rm: any) => {
        if (rm.room?.roomNumber) roomNumbers.add(rm.room.roomNumber);
      });
      r.checkIns?.forEach((ci: any) => {
        if (ci.room?.roomNumber) roomNumbers.add(ci.room.roomNumber);
      });
    }

    return NextResponse.json({
      success: true,
      activeRooms: Array.from(roomNumbers).sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true })
      ),
    });
  } catch (error) {
    return NextResponse.json({ success: false, activeRooms: [] });
  }
}
