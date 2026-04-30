import React from 'react';
import Link from 'next/link';
import { Calendar, User, ArrowRight, Search } from 'lucide-react';
import { WebsiteHeader } from '@/components/website/Header';
import { PremiumFooter } from '@/components/website/PremiumFooter';
import { prisma } from '@/lib/prisma';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'OrderMint Blog | Insights & Strategies for Restaurant Success',
  description: 'Discover the latest product updates, industry insights, and strategies to scale your restaurant business with OrderMint POS.',
  openGraph: {
    title: 'OrderMint Blog | Restaurant Management Insights',
    description: 'Expert advice on POS systems, inventory management, and restaurant growth.',
    images: ['/hero-pos.png'],
  },
};

export default async function BlogListingPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const searchTerm = typeof params.search === 'string' ? params.search : '';
  const category = typeof params.category === 'string' ? params.category : '';

  // Fetch blogs from database
  let blogs: any[] = [];
  try {
    blogs = await prisma.websiteBlog.findMany({
      where: {
        isActive: true,
        OR: [
          { title: { contains: searchTerm } },
          { category: { contains: category === 'All' ? '' : category } },
        ],
      },
      orderBy: { publishedAt: 'desc' },
    });
  } catch (error) {
    console.error('Failed to fetch blogs from database, using empty array for build.', error);
  }

  const categories = ['All', 'Product Updates', 'Industry Insights', 'Customer Stories', 'Guides'];

  return (
    <main className="bg-slate-50 min-h-screen flex flex-col">
      <WebsiteHeader />
      
      {/* Hero Header */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-24 flex items-center justify-center overflow-hidden bg-white border-b border-slate-100">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#fae5e8]/30 rounded-full blur-[100px] pointer-events-none z-0" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center space-y-4">
          <span className="text-pos-primary font-bold tracking-widest uppercase text-xs block">
            Insights & Updates
          </span>
          <h1 className="text-5xl lg:text-7xl font-semibold text-slate-900 tracking-tight leading-tight">
            The OrderMint <span className="text-pos-primary">Blog</span>
          </h1>
          <p className="text-lg text-slate-600 font-medium max-w-2xl mx-auto mt-4">
            Discover the latest product updates, industry insights, and strategies to scale your restaurant.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 max-w-7xl mx-auto px-6 lg:px-12">
        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-8 pb-12 border-b border-gray-100">
          <div className="flex flex-wrap gap-3">
            {categories.map(cat => (
              <Link 
                key={cat}
                href={`/blog?category=${cat === 'All' ? '' : cat}`}
                className={`px-6 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
                  (category === cat || (cat === 'All' && !category)) 
                    ? 'bg-slate-900 text-white shadow-md' 
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat}
              </Link>
            ))}
          </div>
          <div className="relative w-full md:w-80">
            <form action="/blog" method="GET">
              <input 
                type="text" 
                name="search"
                placeholder="Search stories..."
                defaultValue={searchTerm}
                className="w-full pl-12 pr-6 py-3 bg-gray-50 rounded-full border-none focus:ring-2 focus:ring-pos-primary outline-none transition-all text-sm font-medium"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            </form>
          </div>
        </div>

        {blogs.length === 0 ? (
          <div className="py-32 text-center bg-[#fafafa] rounded-[40px] border border-dashed border-gray-200">
            <h3 className="text-xl font-bold text-gray-400 uppercase tracking-widest">No Stories Found</h3>
            <p className="text-gray-400 text-sm mt-2">Try searching for something else or check back later!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-16">
            {blogs.map((blog: any) => (
              <Link 
                key={blog.id} 
                href={`/blog/${blog.slug}`}
                className="group flex flex-col h-full bg-white rounded-[40px] overflow-hidden hover:shadow-2xl transition-all duration-500 border border-transparent hover:border-gray-100"
              >
                <div className="aspect-[4/3] overflow-hidden relative">
                  <img 
                    src={blog.imageUrl || 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&q=80&w=1000'} 
                    alt={blog.title} 
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-1000"
                  />
                  <div className="absolute top-6 left-6">
                     <span className="px-4 py-2 bg-white/95 backdrop-blur-md rounded-full text-[9px] font-bold uppercase tracking-widest text-gray-900 border border-gray-100 shadow-sm">
                      {blog.category}
                    </span>
                  </div>
                </div>
                
                <div className="p-10 flex flex-col flex-1">
                  <div className="flex items-center gap-4 text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-6">
                    <span className="flex items-center gap-1.5"><Calendar size={14} className="text-pos-primary" /> {new Date(blog.publishedAt).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1.5"><User size={14} className="text-pos-primary" /> {blog.author}</span>
                  </div>
                  
                  <h3 className="text-2xl font-semibold text-slate-900 mb-4 tracking-tight leading-tight group-hover:text-pos-primary transition-colors">
                    {blog.title}
                  </h3>
                  
                  <p className="text-slate-600 text-sm font-medium leading-relaxed line-clamp-3 mb-8">
                    {blog.excerpt || 'Discover the latest updates, tips, and strategies to scale your restaurant business with OrderMint.'}
                  </p>
                  
                  <div className="mt-auto pt-8 border-t border-gray-100 flex items-center justify-between group-hover:border-pos-primary/20 transition-colors">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-900 group-hover:text-pos-primary transition-colors">Explore Article</span>
                    <div className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center group-hover:bg-pos-primary group-hover:text-white group-hover:border-pos-primary transition-all duration-500 shadow-sm">
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
      <PremiumFooter />
    </main>
  );
}

