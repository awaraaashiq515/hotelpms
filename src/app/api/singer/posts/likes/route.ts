import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

const secretKey = process.env.JWT_SECRET || 'super-secret-default-key-change-it-in-prod';
const key = new TextEncoder().encode(secretKey);

async function authenticate(req: NextRequest) {
  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
    if (payload?.type === 'SINGER_PORTAL' && payload.singerId) {
      return { singerId: payload.singerId as string, guestId: null };
    }
    if (payload?.type === 'GUEST_PORTAL' && payload.guestId) {
      return { singerId: null, guestId: payload.guestId as string };
    }
  } catch {
    return null;
  }
  return null;
}

// POST /api/singer/posts/likes — toggle like state
export async function POST(req: NextRequest) {
  const user = await authenticate(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { postId } = await req.json();
    if (!postId) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    // Check if like already exists from this specific user
    const existing = await prisma.singerPostLike.findFirst({
      where: {
        postId,
        singerId: user.singerId,
        guestId: user.guestId,
      },
    });

    if (existing) {
      // Unlike
      await prisma.singerPostLike.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({ success: true, liked: false });
    } else {
      // Like
      await prisma.singerPostLike.create({
        data: {
          postId,
          singerId: user.singerId,
          guestId: user.guestId,
        },
      });
      return NextResponse.json({ success: true, liked: true });
    }
  } catch (err: any) {
    console.error('[Likes Toggle Error]:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
