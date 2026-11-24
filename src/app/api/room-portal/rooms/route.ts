import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const propertyId = url.searchParams.get('propertyId');
    const propertyCode = url.searchParams.get('propertyCode');
    const roomParam = url.searchParams.get('room') || url.searchParams.get('roomNumber');

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

    // Auto-detect property if none specified
    if (!targetPropertyId) {
      const activeRes = await prisma.reservation.findFirst({
        where: { status: { in: ['CHECKED_IN', 'CONFIRMED'] } },
        select: { propertyId: true },
        orderBy: { updatedAt: 'desc' },
      });
      if (activeRes?.propertyId) {
        targetPropertyId = activeRes.propertyId;
      } else {
        const firstProp = await prisma.property.findFirst({
          where: { type: 'HOTEL' },
          select: { id: true },
        });
        if (firstProp) targetPropertyId = firstProp.id;
      }
    }

    // Fetch property details
    const prop = targetPropertyId
      ? await prisma.property.findUnique({
          where: { id: targetPropertyId },
          select: { id: true, name: true, code: true, brandName: true, logoUrl: true },
        })
      : null;

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
        guest: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
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
    let roomCheckInfo: { hasCheckIn: boolean; guestHint?: string } = { hasCheckIn: false };

    for (const r of activeReservations) {
      const currentRooms: string[] = [];
      r.rooms?.forEach((rm: any) => {
        if (rm.room?.roomNumber) {
          roomNumbers.add(rm.room.roomNumber);
          currentRooms.push(rm.room.roomNumber);
        }
      });
      r.checkIns?.forEach((ci: any) => {
        if (ci.room?.roomNumber) {
          roomNumbers.add(ci.room.roomNumber);
          currentRooms.push(ci.room.roomNumber);
        }
      });

      if (roomParam && currentRooms.includes(roomParam.trim())) {
        const first = r.guest?.firstName || '';
        const lastInitial = r.guest?.lastName ? `${r.guest.lastName.charAt(0)}.` : '';
        roomCheckInfo = {
          hasCheckIn: true,
          guestHint: `${first} ${lastInitial}`.trim() || 'Checked-In Guest',
        };
      }
    }

    // H13: Privacy fix — Never expose list of occupied rooms or guest names publicly
    return NextResponse.json({
      success: true,
      property: prop,
      activeRooms: [],
    });
  } catch (error) {
    return NextResponse.json({ success: false, activeRooms: [], property: null });
  }
}
