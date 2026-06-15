import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const propertyId = session.propertyId;
  if (!propertyId) return NextResponse.json({ success: false, message: 'No property' }, { status: 400 });

  const songs = await (prisma as any).musicSong.findMany({
    where: { propertyId },
    orderBy: { addedAt: 'asc' },
  });

  return NextResponse.json({ success: true, data: songs });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const propertyId = session.propertyId;
  if (!propertyId) return NextResponse.json({ success: false, message: 'No property' }, { status: 400 });

  const body = await req.json();
  const { title, artist, youtubeId, thumbnail, duration } = body;

  if (!title || !youtubeId) {
    return NextResponse.json({ success: false, message: 'title and youtubeId are required' }, { status: 400 });
  }

  const song = await (prisma as any).musicSong.create({
    data: { propertyId, title, artist, youtubeId, thumbnail, duration },
  });

  return NextResponse.json({ success: true, data: song });
}
