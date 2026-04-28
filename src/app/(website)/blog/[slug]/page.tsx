import React from 'react';
import { Calendar, User, ChevronLeft, Clock, Share2, Facebook, Instagram, Twitter } from 'lucide-react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PremiumFooter } from '@/components/website/PremiumFooter';
import { WebsiteHeader } from '@/components/website/Header';

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}): Promise<Metadata> {
  const { slug } = await params;
  const blog = await prisma.websiteBlog.findUnique({
    where: { slug, isActive: true },
  });

  if (!blog) return { title: 'Post Not Found' };

  return {
    title: blog.metaTitle || `${blog.title} | OrderMint Blog`,
    description: blog.metaDescription || blog.excerpt || `Read more about ${blog.title} on the OrderMint blog.`,
    keywords: blog.keywords || 'POS, Restaurant Management, OrderMint',
    openGraph: {
      title: blog.metaTitle || blog.title,
      description: blog.metaDescription || blog.excerpt || '',
      images: [blog.imageUrl || '/hero-pos.png'],
      type: 'article',
      publishedTime: blog.publishedAt.toISOString(),
      authors: [blog.author || 'OrderMint Team'],
    },
    twitter: {
      card: 'summary_large_image',
      title: blog.metaTitle || blog.title,
      description: blog.metaDescription || blog.excerpt || '',
      images: [blog.imageUrl || '/hero-pos.png'],
    }
  };
}

export default async function BlogDetailPage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const { slug } = await params;
  const blog = await prisma.websiteBlog.findUnique({
    where: { slug, isActive: true },
  });

  if (!blog) {
    notFound();
  }

  return (
    <main className="bg-white min-h-screen">
      <WebsiteHeader />
      
      {/* Hero Header */}
      <section className="relative h-[60vh] min-h-[500px] flex items-end overflow-hidden pt-20">
        <div className="absolute inset-0 z-0">
          <img 
            src={blog.imageUrl || 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&q=80&w=2000'} 
            alt={blog.title} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-6 pb-20 w-full text-center lg:text-left">
          <Link href="/blog" className="inline-flex items-center gap-2 text-white/80 hover:text-pos-primary mb-8 text-[10px] font-bold uppercase tracking-widest transition-colors">
            <ChevronLeft size={16} /> Back to stories
          </Link>
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-[10px] font-bold uppercase tracking-widest text-pos-primary mb-6">
            <span className="bg-pos-primary text-white px-4 py-1.5 rounded-full">{blog.category}</span>
            <span className="flex items-center gap-2 text-white/90"><Calendar size={14} className="text-pos-primary" /> {new Date(blog.publishedAt).toLocaleDateString()}</span>
            <span className="flex items-center gap-2 text-white/90"><Clock size={14} className="text-pos-primary" /> 5 Min Read</span>
          </div>
          <h1 className="text-4xl lg:text-7xl font-bold text-white tracking-tight uppercase leading-tight mb-8">
            {blog.title}
          </h1>
          <div className="flex items-center justify-center lg:justify-start gap-4">
             <div className="w-12 h-12 rounded-full border-2 border-pos-primary overflow-hidden">
                <img src="/logo.png" alt="" className="w-full h-full object-cover bg-white" />
             </div>
             <div className="text-left">
                <span className="block text-white font-bold text-sm tracking-tight">{blog.author}</span>
                <span className="block text-white/60 text-[10px] uppercase tracking-widest font-bold">Industry Expert</span>
             </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-6 lg:px-0 pt-20 pb-32">
        <div className="flex flex-col lg:flex-row gap-16">
          {/* Main Article */}
          <article className="flex-1">
             <div 
               className="prose prose-lg lg:prose-xl prose-slate max-w-none 
                prose-headings:uppercase prose-headings:tracking-tighter prose-headings:font-bold prose-headings:text-gray-900
                prose-p:text-gray-600 prose-p:leading-relaxed prose-p:font-normal
                prose-img:rounded-[40px] prose-img:shadow-2xl
                prose-blockquote:border-l-pos-primary prose-blockquote:bg-gray-50 prose-blockquote:p-8 prose-blockquote:rounded-3xl prose-blockquote:italic prose-blockquote:font-medium
               "
               dangerouslySetInnerHTML={{ __html: blog.content }}
             />
             
             {/* Tags/Categories */}
             <div className="mt-20 pt-10 border-t border-gray-100 flex flex-wrap gap-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Tagged with:</span>
                {['Restaurant', 'POS', 'OrderMint', blog.category || ''].filter(Boolean).map(tag => (
                   <span key={tag} className="px-4 py-1.5 bg-gray-50 text-gray-500 rounded-full text-[9px] font-bold uppercase tracking-widest">#{tag}</span>
                ))}
             </div>
          </article>

          {/* Sidebar */}
          <aside className="lg:w-64 space-y-12">
             <div className="p-8 bg-gray-50 rounded-[40px] border border-gray-100">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-900 mb-6 flex items-center gap-2">
                   <Share2 size={14} className="text-pos-primary" /> Share Story
                </h4>
                <div className="flex flex-col gap-4">
                   <button className="flex items-center gap-3 text-sm font-bold text-gray-500 hover:text-pos-primary transition-colors">
                      <Facebook size={18} /> Facebook
                   </button>
                   <button className="flex items-center gap-3 text-sm font-bold text-gray-500 hover:text-pos-primary transition-colors">
                      <Instagram size={18} /> Instagram
                   </button>
                   <button className="flex items-center gap-3 text-sm font-bold text-gray-500 hover:text-pos-primary transition-colors">
                      <Twitter size={18} /> Twitter
                   </button>
                </div>
             </div>

             <div className="sticky top-32 group">
                <div className="relative aspect-[4/5] rounded-[40px] overflow-hidden">
                   <img src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=1000" alt="OrderMint POS" className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-1000" />
                   <div className="absolute inset-0 bg-pos-primary/60 flex flex-col items-center justify-center p-8 text-center text-white">
                      <h4 className="text-2xl font-bold uppercase tracking-tighter mb-4">OrderMint POS</h4>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-8 opacity-80">Streamline your restaurant operations</p>
                      <Link href="/contact" className="px-6 py-3 bg-white text-gray-900 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all">Enquire Now</Link>
                   </div>
                </div>
             </div>
          </aside>
        </div>
      </div>
      <PremiumFooter />
    </main>
  );
}

