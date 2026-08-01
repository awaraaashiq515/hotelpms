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
      const singer = await prisma.singer.findUnique({ where: { id: payload.singerId as string } });
      if (singer) return { singerId: singer.id, guestId: null, name: singer.name };
    }
    if (payload?.type === 'GUEST_PORTAL' && payload.guestId) {
      const guest = await prisma.guest.findUnique({ where: { id: payload.guestId as string } });
      if (guest) return { singerId: null, guestId: guest.id, name: `${guest.firstName} ${guest.lastName || ''}`.trim() };
    }
  } catch {
    return null;
  }
  return null;
}

// POST /api/singer/posts/comments — publish comment
export async function POST(req: NextRequest) {
  const user = await authenticate(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { postId, content } = await req.json();
    if (!postId || !content) {
      return NextResponse.json({ error: 'Post ID and comment content are required' }, { status: 400 });
    }

    const comment = await prisma.singerPostComment.create({
      data: {
        postId,
        content,
        singerId: user.singerId,
        guestId: user.guestId,
        authorName: user.name,
      },
    });

    return NextResponse.json({ success: true, data: comment });
  } catch (err: any) {
    console.error('[Add Comment Error]:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
