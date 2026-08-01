import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-utils';

// Public API — no session required (used by agent portal)
// Returns room availability for a given property (by agentId or propertyId)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');
    const propertyId = searchParams.get('propertyId');

    let targetPropertyId = propertyId;

    // If agentId is passed, resolve property from agent
    if (agentId && !propertyId) {
      const agent = await prisma.travelAgent.findUnique({
        where: { id: agentId },
        select: { propertyId: true },
      });
      if (!agent) {
        return NextResponse.json({ success: false, message: 'Agent not found.' }, { status: 404 });
      }
      targetPropertyId = agent.propertyId;
    }

    if (!targetPropertyId) {
      return NextResponse.json({ success: false, message: 'propertyId or agentId is required.' }, { status: 400 });
    }

    const rooms = await prisma.room.findMany({
      where: { propertyId: targetPropertyId },
      include: {
        roomType: {
          select: { name: true, code: true, baseRate: true, maxOccupancy: true },
        },
      },
      orderBy: [{ floor: 'asc' }, { roomNumber: 'asc' }],
    });

    // Group by floor
    const byFloor: Record<string, typeof rooms> = {};
    for (const room of rooms) {
      const fl = room.floor || 'Ground';
      if (!byFloor[fl]) byFloor[fl] = [];
      byFloor[fl].push(room);
    }

    // Summary stats
    const summary = {
      total: rooms.length,
      available: rooms.filter(r => r.status === 'AVAILABLE').length,
      occupied: rooms.filter(r => r.status === 'OCCUPIED').length,
      maintenance: rooms.filter(r => r.status === 'MAINTENANCE').length,
      dirty: rooms.filter(r => r.housekeepingStatus === 'DIRTY').length,
    };

    // Room type summary
    const byType: Record<string, { name: string; code: string; baseRate: number; total: number; available: number }> = {};
    for (const room of rooms) {
      const t = room.roomType;
      if (!byType[t.name]) {
        byType[t.name] = { name: t.name, code: t.code, baseRate: t.baseRate, total: 0, available: 0 };
      }
      byType[t.name].total++;
      if (room.status === 'AVAILABLE') byType[t.name].available++;
    }

    return NextResponse.json({
      success: true,
      data: rooms,
      byFloor,
      summary,
      roomTypes: Object.values(byType),
    });
  } catch (error) {
    return apiError(error);
  }
}
