import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

// DELETE a playlist
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  const propertyId = session.propertyId;
  if (!propertyId) return NextResponse.json({ success: false, message: 'No property' }, { status: 400 });

  const { id } = await params;

  // Verify ownership
  const existing = await (prisma as any).musicPlaylist.findFirst({ where: { id, propertyId } });
  if (!existing) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

  await (prisma as any).musicPlaylist.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
