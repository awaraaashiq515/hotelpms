import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ordermint.com';

  // Get all active blog posts
  const blogs = await prisma.websiteBlog.findMany({
    where: { isActive: true },
    select: { slug: true, updatedAt: true },
  });

  const blogEntries = blogs.map((blog) => ({
    url: `${baseUrl}/blog/${blog.slug}`,
    lastModified: blog.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

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
