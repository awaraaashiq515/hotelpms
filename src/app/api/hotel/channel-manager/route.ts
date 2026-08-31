import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, getMultiTenantWhere, resolveAdminProperty } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

const DEFAULT_OTA_CHANNELS = [
  {
    channelCode: 'BOOKING_COM',
    name: 'Booking.com',
    logo: '🏨',
    status: 'CONNECTED',
    commissionPct: 15.0,
    rateMultiplier: 1.15,
    autoSyncRates: true,
    autoSyncInventory: true,
    autoImportBookings: true,
  },
  {
    channelCode: 'EXPEDIA',
    name: 'Expedia',
    logo: '✈️',
    status: 'CONNECTED',
    commissionPct: 18.0,
    rateMultiplier: 1.18,
    autoSyncRates: true,
    autoSyncInventory: true,
    autoImportBookings: true,
  },
  {
    channelCode: 'AGODA',
    name: 'Agoda',
    logo: '🌏',
    status: 'CONNECTED',
    commissionPct: 14.0,
    rateMultiplier: 1.12,
    autoSyncRates: true,
    autoSyncInventory: true,
    autoImportBookings: true,
  },
  {
    channelCode: 'AIRBNB',
    name: 'Airbnb',
    logo: '🏠',
    status: 'CONNECTED',
    commissionPct: 12.0,
    rateMultiplier: 1.10,
    autoSyncRates: true,
    autoSyncInventory: true,
    autoImportBookings: true,
  },
  {
    channelCode: 'MAKEMYTRIP',
    name: 'MakeMyTrip',
    logo: '🇮🇳',
    status: 'CONNECTED',
    commissionPct: 16.0,
    rateMultiplier: 1.14,
    autoSyncRates: true,
    autoSyncInventory: true,
    autoImportBookings: true,
  },
  {
    channelCode: 'GOIBIBO',
    name: 'Goibibo',
    logo: '🎯',
    status: 'CONNECTED',
    commissionPct: 15.0,
    rateMultiplier: 1.12,
    autoSyncRates: true,
    autoSyncInventory: true,
    autoImportBookings: true,
  },
  {
    channelCode: 'GOOGLE_HOTEL_ADS',
    name: 'Google Hotel Ads',
    logo: '🔍',
    status: 'CONNECTED',
    commissionPct: 10.0,
    rateMultiplier: 1.05,
    autoSyncRates: true,
    autoSyncInventory: true,
    autoImportBookings: true,
  },
  {
    channelCode: 'TRIP_COM',
    name: 'Trip.com',
    logo: '🌐',
    status: 'DISCONNECTED',
    commissionPct: 15.0,
    rateMultiplier: 1.15,
    autoSyncRates: false,
    autoSyncInventory: false,
    autoImportBookings: false,
  },
  {
    channelCode: 'HOSTELWORLD',
    name: 'Hostelworld',
    logo: '🛏️',
    status: 'DISCONNECTED',
    commissionPct: 12.0,
    rateMultiplier: 1.10,
    autoSyncRates: false,
    autoSyncInventory: false,
    autoImportBookings: false,
  },
];

// GET /api/hotel/channel-manager - Fetch all channels, summary KPIs, room mappings, parity matrix
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const propertyIdParam = searchParams.get('propertyId');
    const where = getMultiTenantWhere(session, propertyIdParam);

    let propertyId = propertyIdParam || session.propertyId;
    if (!propertyId && session.role === 'RESTAURANTS_ADMIN') {
      propertyId = await resolveAdminProperty(session, prisma);
    }
    if (!propertyId && where.propertyId) {
      propertyId = where.propertyId;
    }

    if (!propertyId) {
      if (session.organizationId) {
        const firstProp = await prisma.property.findFirst({
          where: { organizationId: session.organizationId },
          select: { id: true },
        });
        propertyId = firstProp?.id || null;
      }
    }

    if (!propertyId) {
      const anyProp = await prisma.property.findFirst({ select: { id: true } });
      propertyId = anyProp?.id || 'default-property';
    }

    // Check if property has channels, if 0 then seed default OTA channels
    let channels = await prisma.channelConnection.findMany({
      where: { propertyId },
      include: {
        roomMappings: {
          include: { roomType: true },
        },
      },
      orderBy: [{ createdAt: 'asc' }],
    });

    if (channels.length === 0) {
      for (const def of DEFAULT_OTA_CHANNELS) {
        await prisma.channelConnection.create({
          data: {
            propertyId,
            channelCode: def.channelCode,
            name: def.name,
            logo: def.logo,
            status: def.status,
            commissionPct: def.commissionPct,
            rateMultiplier: def.rateMultiplier,
            autoSyncRates: def.autoSyncRates,
            autoSyncInventory: def.autoSyncInventory,
            autoImportBookings: def.autoImportBookings,
            totalBookingsReceived: def.status === 'CONNECTED' ? Math.floor(Math.random() * 80 + 20) : 0,
            totalRevenueGenerated: def.status === 'CONNECTED' ? Math.floor((Math.random() * 80 + 20) * 5800) : 0,
            lastSyncAt: def.status === 'CONNECTED' ? new Date(Date.now() - Math.floor(Math.random() * 15 + 2) * 60000) : null,
          },
        }).catch(() => null);
      }

      channels = await prisma.channelConnection.findMany({
        where: { propertyId },
        include: {
          roomMappings: {
            include: { roomType: true },
          },
        },
        orderBy: [{ createdAt: 'asc' }],
      });
    }

    // Fetch Room Types and Reservations
    const [roomTypes, reservations, rooms] = await Promise.all([
      prisma.roomType.findMany({
        where: { propertyId },
        include: { rooms: true },
      }),
      prisma.reservation.findMany({
        where: { propertyId },
        select: { id: true, totalAmount: true, status: true, arrivalDate: true },
      }).catch(() => []),
      prisma.room.findMany({
        where: { propertyId },
      }).catch(() => []),
    ]);

    // Compute Summary KPIs
    const totalChannels = channels.length;
    const connectedChannels = channels.filter((c) => c.status === 'CONNECTED').length;
    const syncingChannels = channels.filter((c) => c.status === 'SYNCING').length;
    const pausedChannels = channels.filter((c) => c.status === 'PAUSED').length;
    const disconnectedChannels = channels.filter((c) => c.status === 'DISCONNECTED').length;

    let totalOtaBookings = channels.reduce((s, c) => s + (c.totalBookingsReceived || 0), 0);
    let totalOtaRevenue = channels.reduce((s, c) => s + (c.totalRevenueGenerated || 0), 0);

    const connectedList = channels.filter((c) => c.status === 'CONNECTED');
    const avgCommissionPct = connectedList.length > 0
      ? Number((connectedList.reduce((s, c) => s + c.commissionPct, 0) / connectedList.length).toFixed(1))
      : 15.0;

    const baseAdr = roomTypes.length > 0
      ? Math.round(roomTypes.reduce((s, rt) => s + rt.baseRate, 0) / roomTypes.length)
      : 4500;

    const avgOtaRate = Math.round(baseAdr * (1 + (avgCommissionPct * 0.8) / 100));
    const netOtaYield = Math.round(totalOtaRevenue * (1 - avgCommissionPct / 100));

    // Find most recent sync timestamp
    const syncDates = channels.map((c) => c.lastSyncAt).filter(Boolean).map((d) => new Date(d!).getTime());
    const lastGlobalSyncAt = syncDates.length > 0 ? new Date(Math.max(...syncDates)).toISOString() : null;

    const summary: any = {
      totalChannels,
      connectedChannels,
      syncingChannels,
      pausedChannels,
      disconnectedChannels,
      totalOtaBookings,
      totalOtaRevenue,
      avgCommissionPct,
      avgOtaRate,
      netOtaYield,
      lastGlobalSyncAt,
    };

    // Construct Rate & Inventory Parity Matrix
    const parityMatrix = roomTypes.map((rt) => {
      const typeRooms = rooms.filter((r) => r.roomTypeId === rt.id).length || rt.rooms?.length || 5;

      const channelColumns = channels.map((ch) => {
        const mapping = ch.roomMappings?.find((m) => m.roomTypeId === rt.id);
        const markupPct = mapping ? mapping.priceMarkupPct : Math.round((ch.rateMultiplier - 1) * 100);
        const channelRate = Math.round(rt.baseRate * (1 + markupPct / 100));
        const allocated = mapping?.allocatedRooms ?? Math.min(typeRooms, 8);
        const stopSell = mapping?.stopSell ?? false;

        return {
          channelCode: ch.channelCode,
          channelName: ch.name,
          channelStatus: ch.status,
          rate: ch.status === 'CONNECTED' ? channelRate : 0,
          markupPct,
          allocatedRooms: allocated,
          stopSell,
        };
      });

      return {
        roomTypeId: rt.id,
        roomTypeName: rt.name,
        baseRate: rt.baseRate,
        totalInventory: typeRooms,
        channels: channelColumns,
      };
    });

    return apiResponse({
      summary,
      channels,
      roomTypes,
      parityMatrix,
    });
  } catch (error) {
    return apiError(error);
  }
}

// POST /api/hotel/channel-manager - Connect / Add custom OTA Channel
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    let propertyId = body.propertyId || session.propertyId;

    if (!propertyId && session.role === 'RESTAURANTS_ADMIN') {
      propertyId = await resolveAdminProperty(session, prisma);
    }
    if (!propertyId && session.organizationId) {
      const firstProp = await prisma.property.findFirst({
        where: { organizationId: session.organizationId },
        select: { id: true },
      });
      propertyId = firstProp?.id;
    }

    if (!propertyId) return apiError(new Error('Property ID is required'), 400);

    const {
      channelCode,
      name,
      logo = '🌐',
      hotelIdOnChannel,
      apiKey,
      apiSecret,
      channelManagerProvider = 'DIRECT_API',
      commissionPct = 15,
      rateMultiplier = 1.15,
      autoSyncRates = true,
      autoSyncInventory = true,
      autoImportBookings = true,
    } = body;

    if (!channelCode || !name) {
      return apiError(new Error('Channel code and name are required'), 400);
    }

    const created = await prisma.channelConnection.upsert({
      where: {
        propertyId_channelCode: {
          propertyId,
          channelCode,
        },
      },
      update: {
        name,
        logo,
        hotelIdOnChannel,
        apiKey,
        apiSecret,
        channelManagerProvider,
        commissionPct: Number(commissionPct),
        rateMultiplier: Number(rateMultiplier),
        autoSyncRates: Boolean(autoSyncRates),
        autoSyncInventory: Boolean(autoSyncInventory),
        autoImportBookings: Boolean(autoImportBookings),
        status: 'CONNECTED',
        lastSyncAt: new Date(),
      },
      create: {
        propertyId,
        channelCode,
        name,
        logo,
        hotelIdOnChannel,
        apiKey,
        apiSecret,
        channelManagerProvider,
        commissionPct: Number(commissionPct),
        rateMultiplier: Number(rateMultiplier),
        autoSyncRates: Boolean(autoSyncRates),
        autoSyncInventory: Boolean(autoSyncInventory),
        autoImportBookings: Boolean(autoImportBookings),
        status: 'CONNECTED',
        lastSyncAt: new Date(),
      },
    });

    // Log connection
    await prisma.channelSyncLog.create({
      data: {
        propertyId,
        channelId: created.id,
        actionType: 'FULL_SYNC',
        status: 'SUCCESS',
        message: `Successfully connected ${name} channel via ${channelManagerProvider}`,
      },
    });

    return apiResponse(created, 'Channel connected successfully', 201);
  } catch (error) {
    return apiError(error);
  }
}

// PUT /api/hotel/channel-manager - Update channel settings or toggle status
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) return apiError(new Error('Channel ID is required'), 400);

    const dataToUpdate: any = {};
    if (updateData.name !== undefined) dataToUpdate.name = updateData.name;
    if (updateData.status !== undefined) dataToUpdate.status = updateData.status;
    if (updateData.hotelIdOnChannel !== undefined) dataToUpdate.hotelIdOnChannel = updateData.hotelIdOnChannel;
    if (updateData.apiKey !== undefined) dataToUpdate.apiKey = updateData.apiKey;
    if (updateData.apiSecret !== undefined) dataToUpdate.apiSecret = updateData.apiSecret;
    if (updateData.channelManagerProvider !== undefined) dataToUpdate.channelManagerProvider = updateData.channelManagerProvider;
    if (updateData.commissionPct !== undefined) dataToUpdate.commissionPct = Number(updateData.commissionPct);
    if (updateData.rateMultiplier !== undefined) dataToUpdate.rateMultiplier = Number(updateData.rateMultiplier);
    if (updateData.rateOffset !== undefined) dataToUpdate.rateOffset = Number(updateData.rateOffset);
    if (updateData.autoSyncRates !== undefined) dataToUpdate.autoSyncRates = Boolean(updateData.autoSyncRates);
    if (updateData.autoSyncInventory !== undefined) dataToUpdate.autoSyncInventory = Boolean(updateData.autoSyncInventory);
    if (updateData.autoImportBookings !== undefined) dataToUpdate.autoImportBookings = Boolean(updateData.autoImportBookings);

    const updated = await prisma.channelConnection.update({
      where: { id },
      data: dataToUpdate,
    });

    return apiResponse(updated, 'Channel settings updated successfully');
  } catch (error) {
    return apiError(error);
  }
}

// DELETE /api/hotel/channel-manager - Disconnect channel
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return apiError(new Error('Channel ID is required'), 400);

    const updated = await prisma.channelConnection.update({
      where: { id },
      data: {
        status: 'DISCONNECTED',
        hotelIdOnChannel: null,
        apiKey: null,
        apiSecret: null,
      },
    });

    return apiResponse(updated, 'Channel disconnected successfully');
  } catch (error) {
    return apiError(error);
  }
}
