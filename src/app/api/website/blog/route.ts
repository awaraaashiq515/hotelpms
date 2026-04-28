import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const isAdmin = searchParams.get('admin') === 'true';
    const slug = searchParams.get('slug');

    if (slug) {
      const blog = await prisma.websiteBlog.findUnique({
        where: { slug, isActive: isAdmin ? undefined : true },
      });
      if (!blog) return apiError('Blog post not found', 404);
      return apiResponse(blog);
    }

    const blogs = await prisma.websiteBlog.findMany({
      where: isAdmin ? {} : { isActive: true },
      orderBy: { publishedAt: 'desc' },
    });
    return apiResponse(blogs);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Basic slug generation if not provided
    const slug = body.slug || body.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

    const blog = await prisma.websiteBlog.create({
      data: {
        title: body.title,
        slug,
        excerpt: body.excerpt,
        content: body.content,
        imageUrl: body.imageUrl,
        author: body.author || 'OrderMint Solutions',
        category: body.category || 'Local Attractions',
        metaTitle: body.metaTitle,
        metaDescription: body.metaDescription,
        keywords: body.keywords,
        isActive: body.isActive !== undefined ? body.isActive : true,
        publishedAt: body.publishedAt ? new Date(body.publishedAt) : new Date(),
      },
    });
    return apiResponse(blog, 'Blog post created successfully', 201);
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) return apiError('ID is required', 400);

    const blog = await prisma.websiteBlog.update({
      where: { id: body.id },
      data: {
        title: body.title,
        slug: body.slug,
        excerpt: body.excerpt,
        content: body.content,
        imageUrl: body.imageUrl,
        author: body.author,
        category: body.category,
        metaTitle: body.metaTitle,
        metaDescription: body.metaDescription,
        keywords: body.keywords,
        isActive: body.isActive,
        publishedAt: body.publishedAt ? new Date(body.publishedAt) : undefined,
      },
    });
    return apiResponse(blog, 'Blog post updated successfully');
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return apiError('ID is required', 400);

    await prisma.websiteBlog.delete({
      where: { id },
    });
    return apiResponse(null, 'Blog post deleted successfully');
  } catch (error) {
    return apiError(error);
  }
}
