'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Calendar, Tag, Search } from 'lucide-react';

const BG      = '#080d18';
const CARD_BG = '#0f172a';
const ROSE    = '#e8a0a0';
const INDIGO  = '#6366f1';

const FALLBACK_POSTS = [
  {
    id: '1',
    title: 'Top 10 Things to Do Near Our Hotel',
    excerpt: 'Discover the best local attractions, restaurants, and hidden gems within walking distance of our property.',
    category: 'Travel Tips',
    date: '2024-08-15',
    imageUrl: null,
    slug: null,
  },
  {
    id: '2',
    title: 'A Guide to Our Rooftop Dining Experience',
    excerpt: 'Our rooftop restaurant offers panoramic city views with a menu crafted by our award-winning executive chef.',
    category: 'Dining',
    date: '2024-07-28',
    imageUrl: null,
    slug: null,
  },
  {
    id: '3',
    title: 'Why Guests Keep Coming Back — The GuestFlow Difference',
    excerpt: 'We surveyed 500 returning guests to understand what makes them choose us again and again. The answers may surprise you.',
    category: 'Hospitality',
    date: '2024-07-10',
    imageUrl: null,
    slug: null,
  },
  {
    id: '4',
    title: 'Planning the Perfect Destination Wedding at Our Hotel',
    excerpt: 'From intimate ceremonies to grand banquets — our events team shares insider tips for your dream wedding.',
    category: 'Events',
    date: '2024-06-22',
    imageUrl: null,
    slug: null,
  },
  {
    id: '5',
    title: 'Seasonal Spa Treatments You Must Try This Monsoon',
    excerpt: 'Our wellness team has curated exclusive monsoon therapies to rejuvenate your mind, body and spirit.',
    category: 'Wellness',
    date: '2024-06-05',
    imageUrl: null,
    slug: null,
  },
  {
    id: '6',
    title: 'Business Traveller\'s Guide to Staying Productive',
    excerpt: 'Work-life balance at its finest — our hotel is designed to keep you productive and recharged simultaneously.',
    category: 'Business Travel',
    date: '2024-05-18',
    imageUrl: null,
    slug: null,
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  'Travel Tips':     'bg-sky-500/15 text-sky-400',
  'Dining':          'bg-rose-500/15 text-rose-400',
  'Hospitality':     'bg-violet-500/15 text-violet-400',
  'Events':          'bg-amber-500/15 text-amber-400',
  'Wellness':        'bg-emerald-500/15 text-emerald-400',
  'Business Travel': 'bg-indigo-500/15 text-indigo-400',
};

function getCategoryClass(cat: string) {
  return CATEGORY_COLORS[cat] || 'bg-slate-700/40 text-slate-400';
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function BlogPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetch('/api/website/blog')
      .then(r => r.json())
      .then(j => {
        if (j.success && Array.isArray(j.data) && j.data.length > 0) {
          setPosts(j.data);
        } else {
          setPosts(FALLBACK_POSTS);
        }
      })
      .catch(() => setPosts(FALLBACK_POSTS))
      .finally(() => setLoading(false));
  }, []);

  const filtered = posts.filter(p =>
    p.title.toLowerCase().includes(query.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(query.toLowerCase())
  );

  return (
    <main style={{ background: BG, color: '#fff', minHeight: '100vh' }}>

      {/* ══ HERO ══════════════════════════════════════════════════ */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full blur-[120px]"
            style={{ background: 'rgba(99,102,241,0.12)' }} />
        </div>
        <div className="container mx-auto px-6 max-w-3xl text-center relative z-10">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-[0.2em] mb-6 border"
            style={{ background: 'rgba(232,160,160,0.1)', borderColor: `${ROSE}30`, color: ROSE }}>
            Stories & Insights
          </span>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-tight mb-5">
            The{' '}
            <span style={{ background: `linear-gradient(135deg,${ROSE},#f0c8c8)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              GuestFlow
            </span>{' '}
            Blog
          </h1>
          <p className="text-lg mb-8" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Travel tips, dining guides, wellness stories and the latest news from our hotel.
          </p>
          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
            <input
              type="text"
              placeholder="Search posts..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full pl-11 pr-5 py-3.5 rounded-2xl text-sm text-white placeholder-slate-600 focus:outline-none transition-all"
              style={{ background: CARD_BG, border: '1px solid rgba(255,255,255,0.08)' }}
            />
          </div>
        </div>
      </section>

      {/* ══ POSTS GRID ════════════════════════════════════════════ */}
      <section className="pb-28">
        <div className="container mx-auto px-6 max-w-6xl">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1,2,3].map(i => (
                <div key={i} className="rounded-2xl overflow-hidden border border-slate-800 animate-pulse" style={{ background: CARD_BG }}>
                  <div className="aspect-[16/9] bg-slate-800/60" />
                  <div className="p-6 space-y-3">
                    <div className="h-3 bg-slate-800 rounded w-20" />
                    <div className="h-5 bg-slate-800 rounded" />
                    <div className="h-3 bg-slate-800 rounded w-4/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-semibold">No posts found for &quot;{query}&quot;</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((post, i) => (
                <div key={post.id || i}
                  className="group rounded-2xl overflow-hidden border border-slate-800 hover:border-slate-600 transition-all duration-300 flex flex-col"
                  style={{ background: CARD_BG }}>
                  {/* Image */}
                  {post.imageUrl ? (
                    <div className="aspect-[16/9] overflow-hidden">
                      <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  ) : (
                    <div className="aspect-[16/9] flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.06)' }}>
                      <span className="text-4xl opacity-30">📰</span>
                    </div>
                  )}

                  <div className="p-6 flex flex-col flex-1">
                    {/* Meta */}
                    <div className="flex items-center gap-3 mb-3">
                      {post.category && (
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg ${getCategoryClass(post.category)}`}>
                          {post.category}
                        </span>
                      )}
                      {post.date && (
                        <span className="flex items-center gap-1 text-[10px] text-slate-600">
                          <Calendar className="w-3 h-3" />
                          {formatDate(post.date)}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-white mb-2 leading-snug group-hover:text-slate-100 transition-colors flex-1">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-xs leading-relaxed mb-5 line-clamp-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {post.excerpt}
                      </p>
                    )}

                    {post.slug ? (
                      <Link href={`/blog/${post.slug}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold group-hover:gap-2.5 transition-all mt-auto"
                        style={{ color: ROSE }}>
                        Read More <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold mt-auto" style={{ color: 'rgba(255,255,255,0.25)' }}>
                        Coming Soon
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

    </main>
  );
}
