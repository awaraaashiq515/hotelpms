import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

const secretKey = process.env.JWT_SECRET || 'super-secret-default-key-change-it-in-prod';
const key = new TextEncoder().encode(secretKey);

async function getSingerFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
    if (payload && payload.type === 'SINGER_PORTAL' && payload.singerId) {
      return await prisma.singer.findUnique({
        where: { id: payload.singerId as string }
      });
    }
  } catch (err) {
    return null;
  }
  return null;
}

// GET: List all posts of this singer
export async function GET(request: NextRequest) {
  try {
    const singer = await getSingerFromRequest(request);
    if (!singer) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const posts = await prisma.singerPost.findMany({
      where: { singerId: singer.id },
      include: {
        likes: true,
        comments: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, data: posts });
  } catch (error: any) {
    console.error('[Singer Posts GET Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}

// POST: Add a new post
export async function POST(request: NextRequest) {
  try {
    const singer = await getSingerFromRequest(request);
    if (!singer) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { title, content, imageUrl, tags } = await request.json();

    if (!title || !content) {
      return NextResponse.json({ success: false, message: 'Title and content are required.' }, { status: 400 });
    }

    const post = await prisma.singerPost.create({
      data: {
        singerId: singer.id,
        title,
        content,
        imageUrl: imageUrl || null,
        tags: tags || null
      }
    });

    return NextResponse.json({ success: true, message: 'Post created successfully.', data: post });
  } catch (error: any) {
    console.error('[Singer Posts POST Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}

// DELETE: Delete a post
export async function DELETE(request: NextRequest) {
  try {
    const singer = await getSingerFromRequest(request);
    if (!singer) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Post ID is required.' }, { status: 400 });
    }

    const post = await prisma.singerPost.findFirst({
      where: { id, singerId: singer.id }
    });

    if (!post) {
      return NextResponse.json({ success: false, message: 'Post not found or unauthorized.' }, { status: 404 });
    }

    await prisma.singerPost.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Post deleted successfully.' });
  } catch (error: any) {
    console.error('[Singer Posts DELETE Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
