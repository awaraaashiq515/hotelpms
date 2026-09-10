import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

const CONFIG_KEY_PREFIX = 'SMART_HOTEL_GATEWAY_';

// GET: Retrieve Gateway and IoT pairing configuration for hotel property
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.propertyId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const propertyId = session.propertyId;

    const settingKey = `${CONFIG_KEY_PREFIX}${propertyId}`;
    const setting = await prisma.systemSetting.findUnique({
      where: { key: settingKey },
    });

    let config = null;
    if (setting?.value) {
      try {
        config = JSON.parse(setting.value);
      } catch {}
    }

    // Default template if not yet configured
    if (!config) {
      config = {
        gatewayType: 'TTLOCK', // TTLOCK | TUYA | MQTT
        status: 'DISCONNECTED', // CONNECTED | DISCONNECTED | SCANNING
        lastSync: null,
        ttlock: {
          clientId: '',
          clientSecret: '',
          gatewayId: '',
          gatewayName: 'Corridor G2 Gateway',
        },
        tuya: {
          accessId: '',
          accessSecret: '',
          endpoint: 'https://openapi.tuyaeu.com',
        },
        mqtt: {
          brokerUrl: 'mqtt://192.168.1.100:1883',
          username: '',
          password: '',
          topicPrefix: 'hotel/rooms',
        },
        devices: [],
      };
    }

    // Also fetch actual hotel rooms to allow seamless mapping
    const rooms = await prisma.room.findMany({
      where: { propertyId },
      select: { id: true, roomNumber: true, floor: true, status: true },
      orderBy: { roomNumber: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: {
        config,
        rooms,
      },
    });
  } catch (error: any) {
    console.error('[Smart Hotel API Error]:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch gateway config' }, { status: 500 });
  }
}

// POST: Save Gateway configuration and paired devices
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.propertyId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const propertyId = session.propertyId;
    const body = await request.json();

    const settingKey = `${CONFIG_KEY_PREFIX}${propertyId}`;
    const updated = await prisma.systemSetting.upsert({
      where: { key: settingKey },
      create: {
        key: settingKey,
        value: JSON.stringify(body),
      },
      update: {
        value: JSON.stringify(body),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Hardware Gateway & Device Configuration saved successfully.',
      data: JSON.parse(updated.value),
    });
  } catch (error: any) {
    console.error('[Smart Hotel Save Error]:', error);
    return NextResponse.json({ success: false, message: 'Failed to save gateway config' }, { status: 500 });
  }
}
