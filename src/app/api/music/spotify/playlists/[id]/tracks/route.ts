import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken, spotifyFetch } from '@/lib/spotify';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getAccessToken();
  if (!token) {
    return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  const data = await spotifyFetch(`/playlists/${id}/tracks?limit=100&fields=items(track(id,name,artists,album,duration_ms))`, token);
  if (!data) {
    return NextResponse.json({ success: false, message: 'Failed to fetch tracks' }, { status: 500 });
  }

  const tracks = (data.items ?? [])
    .filter((item: any) => item?.track?.id)
    .map((item: any) => {
      const t = item.track;
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
