import { NextRequest, NextResponse } from 'next/server';
import {
  getSpotifyConfig,
  SP_ACCESS_COOKIE, SP_REFRESH_COOKIE, SP_STATE_COOKIE,
  getRequestOrigin,
} from '@/lib/spotify';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const origin = getRequestOrigin(req);

  try {
    const { searchParams } = req.nextUrl;
    const code  = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // User denied access
    if (error) {
      return NextResponse.redirect(new URL('/api/music/spotify/callback?denied=1', origin));
    }

    // Verify state to prevent CSRF
    const storedState = req.cookies.get(SP_STATE_COOKIE)?.value;
    if (!state || !storedState || state !== storedState) {
      console.warn('Spotify auth callback state mismatch or cookie missing');
      return NextResponse.redirect(new URL('/', origin));
    }

    // Extract property code from state (format: "propertyCode:randomString")
    const propertyCode = state.split(':')[0] || '';

    const config = await getSpotifyConfig();
    const redirectUri = config.redirectUri || `${origin}/api/music/spotify/callback`;

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
      const errText = await tokenRes.text();
      console.error('Spotify token exchange failed:', errText);
      return NextResponse.redirect(new URL(propertyCode ? `/${propertyCode}/music?error=token_exchange_failed` : '/', origin));
    }

    const { access_token, refresh_token, expires_in } = await tokenRes.json();

    // Build redirect URL back to music page
    const redirectTarget = propertyCode
      ? `/${propertyCode}/music?sp=1`
      : '/';

    const res = NextResponse.redirect(new URL(redirectTarget, origin));

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
  } catch (err) {
    console.error('Spotify OAuth callback crashed:', err);
    return NextResponse.redirect(new URL('/', origin));
  }
}
