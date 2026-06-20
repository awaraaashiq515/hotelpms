import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken, spotifyFetch } from '@/lib/spotify';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const token = await getAccessToken();
  if (!token) {
    return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
  }

  const q = req.nextUrl.searchParams.get('q') || '';
  if (!q.trim()) {
    return NextResponse.json({ success: false, message: 'Query required' }, { status: 400 });
  }

  const data = await spotifyFetch(
    `/search?q=${encodeURIComponent(q)}&type=track&limit=20&market=IN`,
    token
  );

  if (!data) {
    return NextResponse.json({ success: false, message: 'Spotify search failed' }, { status: 500 });
  }

  const tracks = (data.tracks?.items ?? []).map((t: any) => {
    const mins = Math.floor((t.duration_ms ?? 0) / 60000);
    const secs = Math.floor(((t.duration_ms ?? 0) % 60000) / 1000);
    return {
      id: t.id,
      title: t.name,
      artist: t.artists?.map((a: any) => a.name).join(', ') ?? '',
      album: t.album?.name ?? '',
      thumbnail: t.album?.images?.[0]?.url ?? null,
      duration: `${mins}:${secs < 10 ? '0' : ''}${secs}`,
    };
  });

  return NextResponse.json({ success: true, data: tracks });
}
