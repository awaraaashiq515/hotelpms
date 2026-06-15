import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const propertyId = session.propertyId;
  if (!propertyId) return NextResponse.json({ success: false, message: 'No property' }, { status: 400 });

  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q') || 'latest hindi songs 2024';
  const pageToken = searchParams.get('pageToken') || '';

  // Get the youtube API key from property
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { youtubeApiKey: true },
  });

  let youtubeApiKey = property?.youtubeApiKey;

  if (!youtubeApiKey) {
    // Fallback to global API key
    const globalSetting = await prisma.systemSetting.findUnique({
      where: { key: 'YOUTUBE_API_KEY' },
    });
    youtubeApiKey = globalSetting?.value || '';
  }

  if (!youtubeApiKey) {
    return NextResponse.json({ success: false, message: 'YouTube API key not configured. Please contact administration.' }, { status: 400 });
  }

  const url = new URL('https://www.googleapis.com/youtube/v3/search');
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('q', query);
  url.searchParams.set('type', 'video');
  url.searchParams.set('videoCategoryId', '10'); // Music category
  url.searchParams.set('maxResults', '20');
  url.searchParams.set('key', youtubeApiKey);
  if (pageToken) url.searchParams.set('pageToken', pageToken);

  const res = await fetch(url.toString());
  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json({ success: false, message: data.error?.message || 'YouTube API error' }, { status: 400 });
  }

  const videos = (data.items || []).map((item: any) => ({
    youtubeId: item.id.videoId,
    title: item.snippet.title,
    artist: item.snippet.channelTitle,
    thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
  }));

  return NextResponse.json({ success: true, data: videos, nextPageToken: data.nextPageToken });
}
