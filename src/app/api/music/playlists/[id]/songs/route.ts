import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

// GET songs in a playlist
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  const propertyId = session.propertyId;
  if (!propertyId) return NextResponse.json({ success: false, message: 'No property' }, { status: 400 });

  const { id: playlistId } = await params;
  const playlist = await (prisma as any).musicPlaylist.findFirst({
    where: { id: playlistId, propertyId },
    include: { items: { orderBy: { addedAt: 'asc' } } },
  });
  if (!playlist) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

  return NextResponse.json({ success: true, data: playlist.items });
}

// POST add a song to a playlist
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  const propertyId = session.propertyId;
  if (!propertyId) return NextResponse.json({ success: false, message: 'No property' }, { status: 400 });

  const { id: playlistId } = await params;

  // Verify ownership
  const playlist = await (prisma as any).musicPlaylist.findFirst({ where: { id: playlistId, propertyId } });
  if (!playlist) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

  const body = await req.json();
  const { youtubeId, title, artist, thumbnail, duration } = body;
  if (!youtubeId || !title) return NextResponse.json({ success: false, message: 'youtubeId and title required' }, { status: 400 });

  // Prevent duplicate in the same playlist
  const existing = await (prisma as any).musicPlaylistItem.findFirst({ where: { playlistId, youtubeId } });
  if (existing) return NextResponse.json({ success: true, data: existing, duplicate: true });

  const item = await (prisma as any).musicPlaylistItem.create({
    data: { playlistId, youtubeId, title, artist: artist || null, thumbnail: thumbnail || null, duration: duration || null },
  });
  return NextResponse.json({ success: true, data: item });
}
