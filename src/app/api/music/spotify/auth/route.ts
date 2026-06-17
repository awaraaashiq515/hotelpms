import { NextRequest, NextResponse } from 'next/server';
import {
  getSpotifyConfig, SCOPES,
  SP_STATE_COOKIE, isSpotifyConfigured,
} from '@/lib/spotify';

export async function GET(req: NextRequest) {
  if (!(await isSpotifyConfigured())) {
    return NextResponse.json({ success: false, message: 'Spotify not configured. Please contact Super Admin.' }, { status: 503 });
  }

  const config = await getSpotifyConfig();
  const redirectUri = config.redirectUri || `${req.nextUrl.origin}/api/music/spotify/callback`;

  // Store which property page to return to after OAuth
  const propertyCode = req.nextUrl.searchParams.get('propertyCode') || '';

  // Generate random state
  const state = `${propertyCode}:${Math.random().toString(36).substring(2)}`;

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    scope: SCOPES,
    redirect_uri: redirectUri,
    state,
    show_dialog: 'false',
  });

  const res = NextResponse.redirect(`https://accounts.spotify.com/authorize?${params}`);

  // Store state in cookie for verification in callback
  res.cookies.set(SP_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  });

  return res;
}
