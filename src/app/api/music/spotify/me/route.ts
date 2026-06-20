import { NextResponse } from 'next/server';
import { getAccessToken, spotifyFetch, isSpotifyConfigured } from '@/lib/spotify';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await isSpotifyConfigured())) {
    return NextResponse.json({ success: true, configured: false, loggedIn: false });
  }

  const token = await getAccessToken();
  if (!token) {
    return NextResponse.json({ success: true, configured: true, loggedIn: false });
  }

  const user = await spotifyFetch('/me', token);
  if (!user) {
    return NextResponse.json({ success: true, configured: true, loggedIn: false });
  }

  return NextResponse.json({
    success: true,
    configured: true,
    loggedIn: true,
    user: {
      id: user.id,
      displayName: user.display_name,
      email: user.email,
      image: user.images?.[0]?.url ?? null,
    },
  });
}
