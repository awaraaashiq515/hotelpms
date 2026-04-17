'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, User, ChevronLeft, Loader2, Clock, Share2, Facebook, Instagram, Twitter } from 'lucide-react';
import Link from 'next/link';

interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  publishedAt: string;
  author: string;
  category: string;
}

export default function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = React.use(params);
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const res = await fetch(`/api/website/blog?slug=${slug}`);
        const json = await res.json();
        if (json.success) setBlog(json.data);
      } catch (err) {
        console.error('Failed to fetch blog', err);
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchBlog();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-pos-primary" size={48} />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4 uppercase tracking-tighter">Story Not Found</h1>
        <p className="text-gray-500 mb-8 max-w-md">The story you are looking for might have been moved or deleted.</p>
        <Link href="/blog" className="px-8 py-3 bg-pos-primary text-white rounded-full font-bold uppercase tracking-widest hover:bg-black transition-all">Back to Blog</Link>
      </div>
    );
  }

  return (
    <main className="bg-white min-h-screen pb-32 pt-20">
      {/* Hero Header */}
      <section className="relative h-[60vh] min-h-[500px] flex items-end overflow-hidden">
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
                <span className="block text-white/60 text-[10px] uppercase tracking-widest font-bold">Resort Expert</span>
             </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-6 lg:px-0 pt-20">
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
                {['Travel', 'Adventure', blog.category].map(tag => (
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
                   <img src="https://images.unsplash.com/photo-1548574505-5e239809ee19?auto=format&fit=crop&q=80&w=1000" alt="Book Now" className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-1000" />
                   <div className="absolute inset-0 bg-pos-primary/60 flex flex-col items-center justify-center p-8 text-center text-white">
                      <h4 className="text-2xl font-bold uppercase tracking-tighter mb-4">Experience Luxury</h4>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-8 opacity-80">Book your luxury stay today</p>
                      <Link href="/contact" className="px-6 py-3 bg-white text-gray-900 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all">Enquire Now</Link>
                   </div>
                </div>
             </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
