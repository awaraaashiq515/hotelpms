import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

const secretKey = process.env.JWT_SECRET || 'super-secret-default-key-change-it-in-prod';
const key = new TextEncoder().encode(secretKey);

async function getSingerId(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
    if (payload?.type === 'SINGER_PORTAL' && payload.singerId) {
      return payload.singerId as string;
    }
  } catch {
    return null;
  }
  return null;
}

// PATCH /api/singer/profile — update photoUrl and/or coverPhotoUrl
export async function PATCH(req: NextRequest) {
  const singerId = await getSingerId(req);
  if (!singerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { photoUrl, coverPhotoUrl } = body;

    const updateData: Record<string, string> = {};
    if (typeof photoUrl === 'string' && photoUrl) updateData.photoUrl = photoUrl;
    if (typeof coverPhotoUrl === 'string' && coverPhotoUrl) updateData.coverPhotoUrl = coverPhotoUrl;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const updated = await prisma.singer.update({
      where: { id: singerId },
      data: updateData,
      select: { id: true, photoUrl: true, coverPhotoUrl: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    console.error('[Singer Profile PATCH Error]:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
