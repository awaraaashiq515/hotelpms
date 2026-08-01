import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-utils';

// Public API — lists all properties that have hotel rooms (for agent portal front page)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');

    // Get blocked property IDs for this agent if agentId provided
    let blockedPropertyIds: string[] = [];
    let relationsMap: Record<string, { commissionRate: number; isBlocked: boolean }> = {};

    if (agentId) {
      const relations = await prisma.agentHotelRelation.findMany({
        where: { agentId },
      });
      relations.forEach(r => {
        relationsMap[r.propertyId] = { commissionRate: r.commissionRate, isBlocked: r.isBlocked };
        if (r.isBlocked) blockedPropertyIds.push(r.propertyId);
      });
    }

    // Get room counts per property
    const propertiesWithRooms = await prisma.room.groupBy({
      by: ['propertyId'],
      _count: { id: true },
    });

    const roomCountMap: Record<string, number> = {};
    propertiesWithRooms.forEach(p => { roomCountMap[p.propertyId] = p._count.id; });

    const properties = await prisma.property.findMany({
      where: blockedPropertyIds.length > 0 ? { id: { notIn: blockedPropertyIds } } : {},
      select: {
        id: true,
        name: true,
        city: true,
        state: true,
        country: true,
        type: true,
        phone: true,
        address: true,
        pinCode: true,
        starRating: true,
        hotelCategory: true,
        logoUrl: true,
        checkInTime: true,
        checkOutTime: true,
        breakfastTimings: true,
        poolTimings: true,
        gymTimings: true,
        checkoutPolicy: true,
        latitude: true,
        longitude: true,
      },
      orderBy: { name: 'asc' },
    });

    // Enrich with room stats and custom commission rates
    const enriched = await Promise.all(properties.map(async prop => {
      const roomStats = await prisma.room.groupBy({
        by: ['status'],
        where: { propertyId: prop.id },
        _count: { id: true },
      });

      const statsMap: Record<string, number> = {};
      roomStats.forEach(s => { statsMap[s.status] = s._count.id; });

      // Get room types
      const roomTypes = await prisma.roomType.findMany({
        where: { propertyId: prop.id },
        select: { name: true, baseRate: true, maxOccupancy: true, code: true },
      });

      const rel = relationsMap[prop.id];

      return {
        ...prop,
        totalRooms: roomCountMap[prop.id] || 0,
        availableRooms: statsMap['AVAILABLE'] || 0,
        occupiedRooms: statsMap['OCCUPIED'] || 0,
        commissionRate: rel ? rel.commissionRate : 10.0,
        roomTypes,
      };
    }));

    return NextResponse.json({ success: true, data: enriched });
  } catch (error) {
    return apiError(error);
  }
}
