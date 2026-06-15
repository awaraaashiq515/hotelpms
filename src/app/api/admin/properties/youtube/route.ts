import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

// GET the global youtube api key (Super Admin only)
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const setting = await prisma.systemSetting.findUnique({
    where: { key: 'YOUTUBE_API_KEY' },
  });

  return NextResponse.json({ success: true, youtubeApiKey: setting?.value || '' });
}

// PUT to save the global youtube api key (Super Admin only)
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { youtubeApiKey } = await req.json();

  await prisma.systemSetting.upsert({
    where: { key: 'YOUTUBE_API_KEY' },
    update: { value: youtubeApiKey },
    create: { key: 'YOUTUBE_API_KEY', value: youtubeApiKey },
  });

  return NextResponse.json({ success: true, message: 'Global YouTube API Key updated successfully' });
}
