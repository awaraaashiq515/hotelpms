import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://guestflow.com';

  let blogEntries: any[] = [];
  try {
    const blogs = await prisma.websiteBlog.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    });

    blogEntries = blogs.map((blog: any) => ({
      url: `${baseUrl}/blog/${blog.slug}`,
      lastModified: blog.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.error('Sitemap: Failed to fetch blogs from database, skipping blog entries.', error);
  }

  const staticPages = [
    '',
    '/about',
    '/features',
    '/pricing',
    '/contact',
    '/blog',
    '/benefits',
  ].map((page) => ({
    url: `${baseUrl}${page}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: page === '' ? 1 : 0.8,
  }));

  return [...staticPages, ...blogEntries];
}
