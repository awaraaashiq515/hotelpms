import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

const secretKey = process.env.JWT_SECRET || 'super-secret-default-key-change-it-in-prod';
const key = new TextEncoder().encode(secretKey);

async function getSingerFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
    if (payload && payload.type === 'SINGER_PORTAL' && payload.singerId) {
      return await prisma.singer.findUnique({
        where: { id: payload.singerId as string }
      });
    }
  } catch (err) {
    return null;
  }
  return null;
}

// GET: Retrieve song requests for a performance
export async function GET(request: NextRequest) {
  try {
    const singer = await getSingerFromRequest(request);
    if (!singer) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const performanceId = searchParams.get('performanceId');

    if (!performanceId) {
      return NextResponse.json({ success: false, message: 'Performance ID is required.' }, { status: 400 });
    }

    // Verify performance belongs to this singer
    const performance = await prisma.performance.findFirst({
      where: { id: performanceId, singerId: singer.id }
    });

    if (!performance) {
      return NextResponse.json({ success: false, message: 'Performance not found.' }, { status: 404 });
    }

    const requests = await prisma.songRequest.findMany({
      where: { performanceId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, data: requests });
  } catch (error: any) {
    console.error('[Singer Requests GET Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}

// PATCH: Update request status (ACCEPTED | PLAYED | DECLINED)
export async function PATCH(request: NextRequest) {
  try {
    const singer = await getSingerFromRequest(request);
    if (!singer) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { requestId, status } = await request.json();

    if (!requestId || !status) {
      return NextResponse.json({ success: false, message: 'Request ID and status are required.' }, { status: 400 });
    }

    // Check if the request exists and belongs to this singer's performance
    const songReq = await prisma.songRequest.findUnique({
      where: { id: requestId },
      include: {
        performance: true
      }
    });

    if (!songReq || songReq.performance.singerId !== singer.id) {
      return NextResponse.json({ success: false, message: 'Song request not found or unauthorized.' }, { status: 404 });
    }

    const updated = await prisma.songRequest.update({
      where: { id: requestId },
      data: { status }
    });

    return NextResponse.json({ success: true, message: `Status updated to ${status}`, data: updated });
  } catch (error: any) {
    console.error('[Singer Requests PATCH Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
