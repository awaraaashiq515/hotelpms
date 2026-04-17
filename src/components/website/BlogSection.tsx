'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, User, ArrowRight, Loader2 } from 'lucide-react';

interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  imageUrl: string;
  publishedAt: string;
  author: string;
  category: string;
}

export const BlogSection = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const res = await fetch('/api/website/blog');
        const json = await res.json();
        if (json.success) setBlogs(json.data.slice(0, 3)); // Only show top 3
      } catch (err) {
        console.error('Failed to fetch blogs', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  if (!loading && blogs.length === 0) return null;

  return (
    <section className="py-24 px-6 lg:px-12 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div className="space-y-4">
            <span className="text-pos-primary font-bold tracking-widest uppercase text-xs block">
              Latest Insights
            </span>
            <h2 className="text-4xl lg:text-5xl font-semibold text-slate-900 tracking-tight leading-tight">
              Product Updates & <span className="text-pos-primary">News</span>
            </h2>
          </div>
          <Link 
            href="/blog" 
            className="group flex items-center gap-2 text-gray-900 font-bold uppercase tracking-widest text-xs border-b-2 border-pos-primary pb-2 overflow-hidden"
          >
            <span className="relative z-10 transition-transform group-hover:-translate-y-full inline-block">View All Stories</span>
            <span className="absolute left-0 top-0 transition-transform translate-y-full group-hover:translate-y-0 text-pos-primary font-bold uppercase tracking-widest text-xs">Explore More</span>
            <ArrowRight size={16} className="text-pos-primary group-hover:translate-x-2 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="animate-spin text-pos-primary" size={48} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {blogs.map((blog) => (
              <Link 
                key={blog.id} 
                href={`/blog/${blog.slug}`}
                className="group flex flex-col h-full bg-[#fafafa] rounded-[40px] overflow-hidden hover:shadow-2xl transition-all duration-500"
              >
                <div className="aspect-[16/10] overflow-hidden relative">
                  <img 
                    src={blog.imageUrl || 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&q=80&w=1000'} 
                    alt={blog.title} 
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-1000"
                  />
                  <div className="absolute top-6 left-6">
                    <span className="px-4 py-2 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest text-gray-900">
                      {blog.category}
                    </span>
                  </div>
                </div>
                
                <div className="p-10 flex flex-col flex-1">
                  <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-6">
                    <span className="flex items-center gap-1.5"><Calendar size={14} className="text-pos-primary" /> {new Date(blog.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span className="flex items-center gap-1.5"><User size={14} className="text-pos-primary" /> {blog.author}</span>
                  </div>
                  
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4 tracking-tight leading-tight group-hover:text-pos-primary transition-colors">
                    {blog.title}
                  </h3>
                  
                  <p className="text-gray-500 text-sm font-medium leading-relaxed line-clamp-3 mb-8 opacity-80">
                    {blog.excerpt || 'Discover the latest updates, tips, and strategies to scale your restaurant business with OrderMint.'}
                  </p>
                  
                  <div className="mt-auto pt-8 border-t border-gray-100 flex items-center justify-between group-hover:border-pos-primary/20 transition-colors">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-900 group-hover:text-pos-primary transition-colors">Read Full Article</span>
                    <div className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center group-hover:bg-pos-primary group-hover:text-white group-hover:border-pos-primary transition-all duration-500">
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
