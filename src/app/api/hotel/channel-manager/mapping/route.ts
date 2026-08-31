import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, resolveAdminProperty } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

// GET /api/hotel/channel-manager/mapping?channelId=...
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channelId');

    if (!channelId) return apiError(new Error('Channel ID is required'), 400);

    const mappings = await prisma.channelRoomMapping.findMany({
      where: { channelId },
      include: { roomType: true },
    });

    return apiResponse(mappings);
  } catch (error) {
    return apiError(error);
  }
}

// POST /api/hotel/channel-manager/mapping - Upsert room mapping
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const {
      channelId,
      roomTypeId,
      otaRoomId = null,
      otaRoomName = null,
      ratePlanCode = 'STANDARD',
      allocatedRooms = 10,
      priceMarkupPct = 0,
      isAvailable = true,
      stopSell = false,
    } = body;

    if (!channelId || !roomTypeId) {
      return apiError(new Error('Channel ID and Room Type ID are required'), 400);
    }

    const mapping = await prisma.channelRoomMapping.upsert({
      where: {
        channelId_roomTypeId: {
          channelId,
          roomTypeId,
        },
      },
      update: {
        otaRoomId,
        otaRoomName,
        ratePlanCode,
        allocatedRooms: Number(allocatedRooms),
        priceMarkupPct: Number(priceMarkupPct),
        isAvailable: Boolean(isAvailable),
        stopSell: Boolean(stopSell),
      },
      create: {
        channelId,
        roomTypeId,
        otaRoomId,
        otaRoomName,
        ratePlanCode,
        allocatedRooms: Number(allocatedRooms),
        priceMarkupPct: Number(priceMarkupPct),
        isAvailable: Boolean(isAvailable),
        stopSell: Boolean(stopSell),
      },
    });

    // Also trigger log
    const channel = await prisma.channelConnection.findUnique({
      where: { id: channelId },
      select: { propertyId: true, name: true },
    });

    if (channel) {
      await prisma.channelSyncLog.create({
        data: {
          propertyId: channel.propertyId,
          channelId,
          actionType: stopSell ? 'STOP_SELL' : 'RATE_PUSH',
          status: 'SUCCESS',
          message: stopSell
            ? `Stop-sell activated on ${channel.name}`
            : `Updated room mapping and ${priceMarkupPct}% markup on ${channel.name}`,
        },
      });
    }

    return apiResponse(mapping, 'Room mapping saved successfully');
  } catch (error) {
    return apiError(error);
  }
}
