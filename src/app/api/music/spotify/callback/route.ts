import { NextRequest, NextResponse } from 'next/server';
import {
  getSpotifyConfig,
  SP_ACCESS_COOKIE, SP_REFRESH_COOKIE, SP_STATE_COOKIE,
} from '@/lib/spotify';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code  = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // User denied access
  if (error) {
    return NextResponse.redirect(new URL('/api/music/spotify/callback?denied=1', req.url));
  }

  // Verify state to prevent CSRF
  const storedState = req.cookies.get(SP_STATE_COOKIE)?.value;
  if (!state || !storedState || state !== storedState) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Extract property code from state (format: "propertyCode:randomString")
  const propertyCode = state.split(':')[0] || '';

  const config = await getSpotifyConfig();
  const redirectUri = config.redirectUri || `${new URL(req.url).origin}/api/music/spotify/callback`;

  // Exchange code for tokens
  const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization:
        'Basic ' +
        Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64'),
    },
    body: new URLSearchParams({
      code: code!,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  const { access_token, refresh_token, expires_in } = await tokenRes.json();

  // Build redirect URL back to music page
  const redirectTarget = propertyCode
    ? `/${propertyCode}/music?sp=1`
    : '/';

  const res = NextResponse.redirect(new URL(redirectTarget, req.url));

  // Store tokens in httpOnly cookies
  res.cookies.set(SP_ACCESS_COOKIE, access_token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: expires_in ?? 3600,
    path: '/',
  });

  if (refresh_token) {
    res.cookies.set(SP_REFRESH_COOKIE, refresh_token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });
  }

  // Clear state cookie
  res.cookies.delete(SP_STATE_COOKIE);

  return res;
}
