import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

// GET the global Spotify config (Super Admin only)
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const settings = await prisma.systemSetting.findMany({
    where: {
      key: {
        in: ['SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET', 'SPOTIFY_REDIRECT_URI']
      }
    }
  });

  const clientId = settings.find((s: { key: string }) => s.key === 'SPOTIFY_CLIENT_ID')?.value || '';
  const clientSecret = settings.find((s: { key: string }) => s.key === 'SPOTIFY_CLIENT_SECRET')?.value || '';
  const redirectUri = settings.find((s: { key: string }) => s.key === 'SPOTIFY_REDIRECT_URI')?.value || '';

  return NextResponse.json({
    success: true,
    clientId,
    clientSecret,
    redirectUri,
  });
}

// PUT to save the global Spotify config (Super Admin only)
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { clientId, clientSecret, redirectUri } = await req.json();
  const cleanClientId = (clientId || '').trim();
  const cleanClientSecret = (clientSecret || '').trim();
  const cleanRedirectUri = (redirectUri || '').trim();

  // Upsert all three keys in a transaction
  await prisma.$transaction([
    prisma.systemSetting.upsert({
      where: { key: 'SPOTIFY_CLIENT_ID' },
      update: { value: cleanClientId },
      create: { key: 'SPOTIFY_CLIENT_ID', value: cleanClientId },
    }),
    prisma.systemSetting.upsert({
      where: { key: 'SPOTIFY_CLIENT_SECRET' },
      update: { value: cleanClientSecret },
      create: { key: 'SPOTIFY_CLIENT_SECRET', value: cleanClientSecret },
    }),
    prisma.systemSetting.upsert({
      where: { key: 'SPOTIFY_REDIRECT_URI' },
      update: { value: cleanRedirectUri },
      create: { key: 'SPOTIFY_REDIRECT_URI', value: cleanRedirectUri },
    }),
  ]);

  return NextResponse.json({ success: true, message: 'Global Spotify Configuration updated successfully' });
}
