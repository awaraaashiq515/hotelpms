import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

// Public API — lists properties that have hotel rooms for agent portal
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');
    const propertyId = searchParams.get('propertyId');

    // Get blocked property IDs and custom commission rates for this agent if agentId provided
    const blockedPropertyIds: string[] = [];
    const relationsMap: Record<string, { commissionRate: number; isBlocked: boolean }> = {};
    const allowedPartnerPropertyIds: string[] = [];
    let organizationId: string | null = null;

    if (agentId) {
      const agent = await prisma.travelAgent.findUnique({
        where: { id: agentId },
        include: {
          property: {
            select: { id: true, organizationId: true, type: true },
          },
          hotelRelations: {
            select: { propertyId: true, commissionRate: true, isBlocked: true },
          },
        },
      });

      if (agent) {
        if (agent.property?.organizationId) {
          organizationId = agent.property.organizationId;
        }
        agent.hotelRelations.forEach(r => {
          relationsMap[r.propertyId] = { commissionRate: r.commissionRate, isBlocked: r.isBlocked };
          if (r.isBlocked) {
            blockedPropertyIds.push(r.propertyId);
          } else {
            allowedPartnerPropertyIds.push(r.propertyId);
          }
        });
      }
    }

    if (!organizationId && propertyId) {
      const prop = await prisma.property.findUnique({
        where: { id: propertyId },
        select: { organizationId: true },
      });
      if (prop?.organizationId) {
        organizationId = prop.organizationId;
      }
    }

    if (!organizationId) {
      const session = await getSession();
      if (session?.organizationId) {
        organizationId = session.organizationId;
      }
    }

    // If still no organizationId and agent has no org, fallback to the latest active hotel's org
    if (!organizationId) {
      const fallbackHotel = await prisma.property.findFirst({
        where: { type: 'HOTEL' },
        orderBy: { createdAt: 'desc' },
        select: { organizationId: true },
      });
      if (fallbackHotel) {
        organizationId = fallbackHotel.organizationId;
      }
    }

    // Get room counts per property
    const propertiesWithRooms = await prisma.room.groupBy({
      by: ['propertyId'],
      _count: { id: true },
    });

    const roomCountMap: Record<string, number> = {};
    propertiesWithRooms.forEach(p => { roomCountMap[p.propertyId] = p._count.id; });

    // Build Prisma query condition:
    // 1. Must be hotel type (exclude restaurants, cafes, bars)
    // 2. Must belong to the agent's organization OR be an explicitly partnered hotel in hotelRelations
    // 3. Must not be blocked for this agent
    const whereConditions: Prisma.PropertyWhereInput[] = [
      {
        OR: [
          { type: 'HOTEL' },
          { type: null, code: { startsWith: 'HTL' } },
        ],
      },
      {
        type: { notIn: ['RESTAURANT', 'BAR', 'CAFE'] },
      },
    ];

    if (organizationId) {
      whereConditions.push({
        OR: [
          { organizationId },
          ...(allowedPartnerPropertyIds.length > 0 ? [{ id: { in: allowedPartnerPropertyIds } }] : []),
        ],
      });
    }

    if (blockedPropertyIds.length > 0) {
      whereConditions.push({
        id: { notIn: blockedPropertyIds },
      });
    }

    const properties = await prisma.property.findMany({
      where: {
        AND: whereConditions,
      },
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

    // Enrich with room stats and custom commission rates, only keep properties with rooms > 0
    const enriched = await Promise.all(properties.map(async prop => {
      const totalRooms = roomCountMap[prop.id] || 0;
      if (totalRooms === 0) return null;

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
        totalRooms,
        availableRooms: statsMap['AVAILABLE'] || 0,
        occupiedRooms: statsMap['OCCUPIED'] || 0,
        commissionRate: rel ? rel.commissionRate : 10.0,
        roomTypes,
      };
    }));

    const validHotels = enriched.filter(Boolean);

    return NextResponse.json({ success: true, data: validHotels });
  } catch (error) {
    return apiError(error);
  }
}

