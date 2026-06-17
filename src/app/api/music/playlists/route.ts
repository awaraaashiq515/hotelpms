import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

// GET all playlists for property
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  const propertyId = session.propertyId;
  if (!propertyId) return NextResponse.json({ success: false, message: 'No property' }, { status: 400 });

  const playlists = await (prisma as any).musicPlaylist.findMany({
    where: { propertyId },
    include: { items: { orderBy: { addedAt: 'asc' } } },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json({ success: true, data: playlists });
}

// POST create a new playlist
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  const propertyId = session.propertyId;
  if (!propertyId) return NextResponse.json({ success: false, message: 'No property' }, { status: 400 });

  const body = await req.json();
  const { name, emoji } = body;
  if (!name?.trim()) return NextResponse.json({ success: false, message: 'name is required' }, { status: 400 });

  const playlist = await (prisma as any).musicPlaylist.create({
    data: { propertyId, name: name.trim(), emoji: emoji || null },
    include: { items: true },
  });

  return NextResponse.json({ success: true, data: playlist });
}
