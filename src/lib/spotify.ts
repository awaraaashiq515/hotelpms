import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export const SP_ACCESS_COOKIE  = 'sp_access_token';
export const SP_REFRESH_COOKIE = 'sp_refresh_token';
export const SP_STATE_COOKIE   = 'sp_oauth_state';

export const SCOPES = [
  'playlist-read-private',
  'playlist-read-collaborative',
  'user-library-read',
  'user-read-private',
  'user-read-email',
].join(' ');

/* ── Configuration Helper ────────────────────────────────────────────────── */
export async function getSpotifyConfig() {
  if (typeof window !== 'undefined') {
    return { clientId: '', clientSecret: '', redirectUri: '' };
  }
  const settings = await prisma.systemSetting.findMany({
    where: {
      key: {
        in: ['SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET', 'SPOTIFY_REDIRECT_URI']
      }
    }
  });

  const clientId = settings.find((s: { key: string }) => s.key === 'SPOTIFY_CLIENT_ID')?.value || process.env.SPOTIFY_CLIENT_ID || '';
  const clientSecret = settings.find((s: { key: string }) => s.key === 'SPOTIFY_CLIENT_SECRET')?.value || process.env.SPOTIFY_CLIENT_SECRET || '';
  const redirectUri = settings.find((s: { key: string }) => s.key === 'SPOTIFY_REDIRECT_URI')?.value || process.env.SPOTIFY_REDIRECT_URI || '';

  return { clientId, clientSecret, redirectUri };
}

/* ── Token Helpers ──────────────────────────────────────────────────────── */
export async function getAccessToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(SP_ACCESS_COOKIE)?.value ?? null;
}

export async function getRefreshToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(SP_REFRESH_COOKIE)?.value ?? null;
}

/** Exchange refresh token for a fresh access token. Returns new token or null. */
export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  const config = await getSpotifyConfig();
  if (!config.clientId || !config.clientSecret) return null;

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization:
        'Basic ' +
        Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64'),
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data.access_token ?? null;
}

/* ── Spotify API Fetch ──────────────────────────────────────────────────── */
/**
 * Call the Spotify Web API. Automatically retries once with a refreshed token on 401.
 * Returns parsed JSON or null on failure.
 */
export async function spotifyFetch(path: string, token: string): Promise<any | null> {
  const doFetch = (t: string) =>
    fetch(`https://api.spotify.com/v1${path}`, {
      headers: { Authorization: `Bearer ${t}` },
    });

  let res = await doFetch(token);

  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (!newToken) return null;
    res = await doFetch(newToken);
  }

  if (!res.ok) return null;
  return res.json();
}

/** Returns true if Spotify is configured in system settings. */
export async function isSpotifyConfigured(): Promise<boolean> {
  const config = await getSpotifyConfig();
  return !!config.clientId;
}

