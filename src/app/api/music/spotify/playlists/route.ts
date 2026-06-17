import { NextResponse } from 'next/server';
import { getAccessToken, spotifyFetch } from '@/lib/spotify';

export async function GET() {
  const token = await getAccessToken();
  if (!token) {
    return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
  }

  // Fetch up to 50 playlists
  const data = await spotifyFetch('/me/playlists?limit=50', token);
  if (!data) {
    return NextResponse.json({ success: false, message: 'Failed to fetch playlists' }, { status: 500 });
  }

  const playlists = (data.items ?? []).map((pl: any) => ({
    id: pl.id,
    name: pl.name,
    description: pl.description,
    image: pl.images?.[0]?.url ?? null,
    total: pl.tracks?.total ?? 0,
    owner: pl.owner?.display_name ?? '',
  }));

  return NextResponse.json({ success: true, data: playlists });
}
