'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, User, ArrowRight, Loader2, Search } from 'lucide-react';

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

export default function BlogListingPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const res = await fetch('/api/website/blog');
        const json = await res.json();
        if (json.success) setBlogs(json.data);
      } catch (err) {
        console.error('Failed to fetch blogs', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  const filteredBlogs = blogs.filter(blog => 
    blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    blog.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="bg-white min-h-screen">
      {/* Hero Header */}
      <section className="relative h-[40vh] flex items-center justify-center overflow-hidden bg-slate-900 pt-20">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&q=80&w=2000" 
            alt="Manali Blog"
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-white" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center space-y-4">
          <span className="text-pos-primary font-bold tracking-[0.4em] uppercase text-xs block">
            The OrderMint Journal
          </span>
          <h1 className="text-4xl lg:text-6xl font-bold text-white tracking-tight uppercase leading-tight">
            Our Stories from <span className="text-pos-primary">Manali</span>
          </h1>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 max-w-7xl mx-auto px-6 lg:px-12">
        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-8 pb-12 border-b border-gray-100">
          <div className="flex gap-4">
            {['All', 'Local Attractions', 'Resort News', 'Travel Guide'].map(cat => (
              <button 
                key={cat}
                onClick={() => setSearchTerm(cat === 'All' ? '' : cat)}
                className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                  (searchTerm === cat || (cat === 'All' && searchTerm === '')) 
                    ? 'bg-pos-primary text-white' 
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-80">
            <input 
              type="text" 
              placeholder="Search stories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-3 bg-gray-50 rounded-full border-none focus:ring-2 focus:ring-pos-primary outline-none transition-all text-sm font-medium"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="animate-spin text-pos-primary" size={48} />
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="py-32 text-center bg-[#fafafa] rounded-[40px] border border-dashed border-gray-200">
            <h3 className="text-xl font-bold text-gray-400 uppercase tracking-widest">No Stories Found</h3>
            <p className="text-gray-400 text-sm mt-2">Try searching for something else or check back later!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-16">
            {filteredBlogs.map((blog) => (
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
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 tracking-tight leading-tight group-hover:text-pos-primary transition-colors">
                    {blog.title}
                  </h3>
                  
                  <p className="text-gray-500 text-sm font-normal leading-relaxed line-clamp-3 mb-8 opacity-80">
                    {blog.excerpt || 'Discover more about this wonderful story from the hills...'}
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
    </main>
  );
}
