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

// GET: List all videos of this singer
export async function GET(request: NextRequest) {
  try {
    const singer = await getSingerFromRequest(request);
    if (!singer) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const videos = await prisma.singerVideo.findMany({
      where: { singerId: singer.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, data: videos });
  } catch (error: any) {
    console.error('[Singer Videos GET Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}

// POST: Add a new video link
export async function POST(request: NextRequest) {
  try {
    const singer = await getSingerFromRequest(request);
    if (!singer) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { title, videoUrl, description } = await request.json();

    if (!title || !videoUrl) {
      return NextResponse.json({ success: false, message: 'Title and Video URL are required.' }, { status: 400 });
    }

    const video = await prisma.singerVideo.create({
      data: {
        singerId: singer.id,
        title,
        videoUrl,
        description: description || null
      }
    });

    return NextResponse.json({ success: true, message: 'Video added successfully.', data: video });
  } catch (error: any) {
    console.error('[Singer Videos POST Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}

// DELETE: Delete a video link
export async function DELETE(request: NextRequest) {
  try {
    const singer = await getSingerFromRequest(request);
    if (!singer) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Video ID is required.' }, { status: 400 });
    }

    const video = await prisma.singerVideo.findFirst({
      where: { id, singerId: singer.id }
    });

    if (!video) {
      return NextResponse.json({ success: false, message: 'Video not found or unauthorized.' }, { status: 404 });
    }

    await prisma.singerVideo.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Video deleted successfully.' });
  } catch (error: any) {
    console.error('[Singer Videos DELETE Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
