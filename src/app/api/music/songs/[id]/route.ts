import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

// Note: Using Promise<{ id: string }> for params to ensure Next.js 15 compatibility
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const propertyId = session.propertyId;
  if (!propertyId) return NextResponse.json({ success: false, message: 'No property' }, { status: 400 });

  const { id } = await params;

  try {
    await (prisma as any).musicSong.deleteMany({
      where: { id, propertyId },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to delete' }, { status: 500 });
  }
}
