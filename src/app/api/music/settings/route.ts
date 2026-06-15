import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

// GET youtube api key for the property
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const propertyId = session.propertyId;
  if (!propertyId) return NextResponse.json({ success: false, message: 'No property' }, { status: 400 });

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { youtubeApiKey: true },
  });

  let youtubeApiKey = property?.youtubeApiKey;
  let isGlobalFallback = false;

  if (!youtubeApiKey) {
    const globalSetting = await prisma.systemSetting.findUnique({
      where: { key: 'YOUTUBE_API_KEY' },
    });
    youtubeApiKey = globalSetting?.value || '';
    isGlobalFallback = !!youtubeApiKey;
  }

  return NextResponse.json({ 
    success: true, 
    data: { 
      youtubeApiKey: youtubeApiKey || '', 
      isGlobalFallback 
    } 
  });
}

// PUT to save youtube api key
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const propertyId = session.propertyId;
  if (!propertyId) return NextResponse.json({ success: false, message: 'No property' }, { status: 400 });

  const { youtubeApiKey } = await req.json();

  await prisma.property.update({
    where: { id: propertyId },
    data: { youtubeApiKey },
  });

  return NextResponse.json({ success: true });
}
