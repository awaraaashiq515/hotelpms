'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Star, Play, Sparkles, Flame, Rss, Video, Search, MapPin, Clock } from 'lucide-react';

const PINK = '#e8a0a0';
const BG = '#120a08';

interface Singer {
  id: string;
  name: string;
  bio: string | null;
  genre: string | null;
  photoUrl: string | null;
  rating: number;
  videos: Array<{ id: string; title: string; videoUrl: string; description: string | null }>;
  posts: Array<{ id: string; title: string; content: string; imageUrl: string | null; tags?: string | null; createdAt: string }>;
}

interface LivePerformance {
  id: string;
  venueName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  singer: {
    name: string;
    genre: string | null;
    photoUrl: string | null;
  };
}

const ReelCard = ({ vid, singer }: { vid: any; singer: any }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.defaultMuted = true;
    }
  }, []);

  const handleMouseEnter = () => {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    setIsPlaying(true);
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  const handleToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      if (videoRef.current.paused) {
        setIsPlaying(true);
        videoRef.current.play().catch(() => {});
      } else {
        setIsPlaying(false);
        videoRef.current.pause();
      }
    }
  };

  const isLocalVideo = vid.videoUrl.startsWith('/api/images/') || vid.videoUrl.match(/\.(mp4|webm|ogg|mov)$/i);
  const PINK = '#e8a0a0';

  return (
    <div 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleToggle}
      className="relative aspect-[9/16] rounded-3xl bg-slate-950 overflow-hidden border border-white/10 group shadow-lg flex flex-col justify-end cursor-pointer"
    >
      {isLocalVideo ? (
        <>
          <video 
            ref={videoRef}
            loop
            muted
            playsInline
            preload="metadata"
            className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
            src={vid.videoUrl}
          />
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-10 transition-opacity duration-300 pointer-events-none">
              <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                <Play className="text-white fill-white ml-0.5" size={18} />
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-black/90 p-4 text-center z-0">
          <Video className="text-white/20 mb-2 animate-pulse" size={28} />
          <span className="text-[9px] font-black uppercase text-indigo-400">YouTube Cover Clip</span>
          <a href={vid.videoUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-white/50 hover:text-white underline mt-2 block z-10" onClick={e => e.stopPropagation()}>Play Link ↗</a>
        </div>
      )}

      <div className="relative z-10 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent pt-12 text-left pointer-events-none">
        <h4 className="text-xs font-black text-white drop-shadow-md flex items-center gap-1.5"><Play size={11} fill="currentColor" style={{ color: PINK }} /> {vid.title}</h4>
        {vid.description && <p className="text-[10px] text-white/70 mt-1 drop-shadow">{vid.description}</p>}
      </div>
    </div>
  );
};

export default function LiveMusicPage() {
  const [singers, setSingers] = useState<Singer[]>([]);
  const [livePerformer, setLivePerformer] = useState<LivePerformance | null>(null);
  const [upcomingPerformances, setUpcomingPerformances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Accordion active singer state
  const [expandedSingerId, setExpandedSingerId] = useState<string | null>(null);
  const [portfolioTab, setPortfolioTab] = useState<'posts' | 'videos'>('posts');

  useEffect(() => {
    fetchSingers();
    fetchLivePerformer();
    fetchUpcomingPerformances();
  }, []);

  const fetchUpcomingPerformances = async () => {
    try {
      const res = await fetch('/api/guest-portal/performances');
      const data = await res.json();
      if (data.success) {
        setUpcomingPerformances(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSingers = async () => {
    try {
      const res = await fetch('/api/guest-portal/singers');
      const data = await res.json();
      if (data.success) {
        setSingers(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLivePerformer = async () => {
    try {
      const res = await fetch('/api/guest-portal/live-singer?propertyId=default-or-any');
      const data = await res.json();
      if (data.success && data.data) {
        setLivePerformer(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredSingers = singers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.genre && s.genre.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <main
      className="text-white overflow-x-hidden relative min-h-screen pt-24 pb-20"
      style={{ background: BG, fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Background radial elements */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[800px] h-[800px] rounded-full blur-[250px]"
          style={{ background: 'rgba(232,160,160,0.03)' }} />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full blur-[200px]"
          style={{ background: 'rgba(61,24,24,0.15)' }} />
      </div>

      <div className="container mx-auto px-6 relative z-10 max-w-5xl space-y-12">
        
        {/* ══ HERO HEADER ═══════════════════════════════════════ */}
        <section className="text-center py-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full"
              style={{ background: 'rgba(232,160,160,0.09)', border: '1px solid rgba(232,160,160,0.18)' }}>
              <Sparkles className="w-3 h-3" style={{ color: PINK }} />
              <span className="font-semibold text-[10px] uppercase tracking-[0.25em]" style={{ color: PINK }}>
                Live Entertainment
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none">
              Meet Our <span style={{
                background: `linear-gradient(135deg, ${PINK}, #f5c8c8)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>Performers</span>
            </h1>
            <p className="text-sm md:text-base text-white/50 max-w-xl mx-auto leading-relaxed">
              Experience the perfect blend of hospitality and fine live music. Browse our directory of top-tier singers, listen to their covers, and check out what's coming up next!
            </p>
          </motion.div>
        </section>

        {/* ══ LIVE SHOW BANNER ══════════════════════════════════ */}
        {livePerformer && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-md relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl pointer-events-none" 
              style={{ background: 'rgba(232,160,160,0.1)' }} />
            
            <div className="flex items-center gap-1.5 mb-4 text-xs font-bold uppercase tracking-wider" style={{ color: PINK }}>
              <Flame size={14} className="animate-pulse" />
              <span>{livePerformer.status === 'LIVE' ? 'LIVE NOW AT THE HOTEL' : 'PERFORMING TONIGHT'}</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 items-center justify-between">
              <div className="flex gap-4 items-center flex-wrap justify-center sm:justify-start">
                <img 
                  src={livePerformer.singer.photoUrl || 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=150&auto=format&fit=crop&q=60'} 
                  alt={livePerformer.singer.name}
                  className="w-16 h-16 rounded-2xl object-cover border border-white/10 shadow-lg"
                />
                <div className="text-center sm:text-left">
                  <h3 className="text-lg font-black text-white">{livePerformer.singer.name}</h3>
                  <p className="text-xs uppercase font-bold tracking-wider text-white/40 mt-0.5">{livePerformer.singer.genre || 'Live Show'}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-white/50 mt-2 flex-wrap justify-center">
                    <span className="flex items-center gap-1"><MapPin size={12} style={{ color: PINK }} /> {livePerformer.venueName}</span>
                    <span className="flex items-center gap-1"><Clock size={12} style={{ color: PINK }} /> {new Date(livePerformer.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} onwards</span>
                  </div>
                </div>
              </div>

              <div className="px-4 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider"
                style={{ borderColor: 'rgba(232,160,160,0.2)', color: PINK, background: 'rgba(232,160,160,0.05)' }}>
                {livePerformer.status}
              </div>
            </div>
          </motion.div>
        )}

        {/* ══ UPCOMING LINEUP SECTION ═══════════════════════════ */}
        {upcomingPerformances.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <Flame size={18} style={{ color: PINK }} className="animate-pulse" />
                <h2 className="text-2xl font-black">Upcoming Live Lineup</h2>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full border border-white/10 text-white/50">
                {upcomingPerformances.length} Scheduled Shows
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingPerformances.map((perf) => (
                <div 
                  key={perf.id}
                  className="p-5 rounded-3xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <img 
                        src={perf.singer.photoUrl || 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=150&auto=format&fit=crop&q=60'} 
                        alt={perf.singer.name}
                        className="w-12 h-12 rounded-2xl object-cover border border-white/10"
                      />
                      <div>
                        <h3 className="text-sm font-black text-white">{perf.singer.name}</h3>
                        <p className="text-[10px] uppercase font-bold tracking-wider mt-0.5" style={{ color: PINK }}>
                          {perf.singer.genre || 'Vocalist'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 border-t border-b border-white/5 py-3 text-xs text-white/70">
                      <div className="flex items-center gap-2">
                        <MapPin size={12} style={{ color: PINK }} />
                        <span>{perf.venueName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={12} style={{ color: PINK }} />
                        <span>{new Date(perf.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                      </div>
                      <div className="text-[11px] text-white/50 pl-5">
                        {new Date(perf.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(perf.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border border-white/10 text-white/60">
                      {perf.status}
                    </span>
                    <button 
                      onClick={() => {
                        setExpandedSingerId(expandedSingerId === perf.singer.id ? null : perf.singer.id);
                        setPortfolioTab('posts');
                      }}
                      className="text-xs font-bold hover:underline" style={{ color: PINK }}
                    >
                      View Artist →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ══ DIRECTORY SECTION ═════════════════════════════════ */}
        <section className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black">Artists Directory</h2>
            
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" size={14} />
              <input 
                type="text"
                placeholder="Search by name, genre..."
                className="w-full bg-white/[0.03] border border-white/15 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-white/30 placeholder-white/30 transition-all"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="h-64 flex items-center justify-center gap-2 text-white/50 text-xs font-bold">
              <div className="w-5 h-5 rounded-full border border-t-transparent border-white/40 animate-spin" />
              Loading catalog...
            </div>
          ) : filteredSingers.length === 0 ? (
            <div className="text-center py-20 text-white/30 border border-white/5 rounded-3xl">
              No performers matched your search.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredSingers.map((singer, idx) => {
                const isExpanded = expandedSingerId === singer.id;
                return (
                  <motion.div
                    key={singer.id}
                    layout="position"
                    className="p-6 rounded-3xl border border-white/5 bg-white/[0.015] hover:bg-white/[0.025] transition-all space-y-4"
                  >
                    <div className="flex flex-wrap gap-4 items-center justify-between">
                      <div className="flex gap-4 items-center">
                        <div className="relative">
                          <img 
                            src={singer.photoUrl || 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=150&auto=format&fit=crop&q=60'} 
                            alt={singer.name}
                            className="w-16 h-16 rounded-2xl object-cover border border-white/10 shadow"
                          />
                          {idx === 0 && singer.rating >= 4.5 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-black text-[8px] font-black uppercase px-1 rounded-full flex items-center gap-0.5 shadow">
                              <Star size={7} fill="currentColor" /> Top
                            </span>
                          )}
                        </div>
                        <div>
                          <h3 className="text-base font-black text-white">{singer.name}</h3>
                          <p className="text-[10px] font-black uppercase tracking-wider mt-0.5" style={{ color: PINK }}>{singer.genre || 'Vocalist'}</p>
                          <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold mt-1.5">
                            <Star size={12} fill="currentColor" />
                            <span>{singer.rating.toFixed(1)}</span>
                            <span className="text-white/30 text-[10px] font-normal">({singer.videos.length} clips · {singer.posts.length} posts)</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (isExpanded) {
                            setExpandedSingerId(null);
                          } else {
                            setExpandedSingerId(singer.id);
                            setPortfolioTab('posts');
                          }
                        }}
                        className="px-5 py-2.5 rounded-2xl border text-xs font-bold tracking-tight transition-all"
                        style={{
                          borderColor: isExpanded ? 'rgba(255,255,255,0.2)' : 'rgba(232,160,160,0.3)',
                          color: isExpanded ? '#ffffff' : PINK,
                          background: isExpanded ? 'transparent' : 'rgba(232,160,160,0.04)'
                        }}
                      >
                        {isExpanded ? 'Hide Portfolio' : 'View Portfolio'}
                      </button>
                    </div>

                    {singer.bio && (
                      <p className="text-xs text-white/50 leading-relaxed max-w-3xl">
                        {singer.bio}
                      </p>
                    )}

                    {/* Accordion portfolio expand block */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="border-t border-white/5 pt-5 mt-4 space-y-4 overflow-hidden"
                        >
                          <div className="flex gap-4 border-b border-white/5 pb-2">
                            <button
                              onClick={() => setPortfolioTab('posts')}
                              className={`text-xs font-black pb-1.5 transition-colors flex items-center gap-1.5 ${portfolioTab === 'posts' ? 'border-b-2 text-white' : 'text-white/40 hover:text-white/60'}`}
                              style={{ borderColor: portfolioTab === 'posts' ? PINK : 'transparent' }}
                            >
                              <Rss size={12} /> News & Updates ({singer.posts.length})
                            </button>
                            <button
                              onClick={() => setPortfolioTab('videos')}
                              className={`text-xs font-black pb-1.5 transition-colors flex items-center gap-1.5 ${portfolioTab === 'videos' ? 'border-b-2 text-white' : 'text-white/40 hover:text-white/60'}`}
                              style={{ borderColor: portfolioTab === 'videos' ? PINK : 'transparent' }}
                            >
                              <Video size={12} /> Videos & Reels ({singer.videos.length})
                            </button>
                          </div>

                           {portfolioTab === 'posts' ? (
                            <div className="space-y-6 pt-2">
                              {singer.posts.length === 0 ? (
                                <p className="text-xs text-white/30 italic">No updates posted yet.</p>
                              ) : (
                                singer.posts.map(post => (
                                  <div key={post.id} className="max-w-md mx-auto rounded-3xl border border-white/5 bg-black/40 overflow-hidden shadow-xl space-y-3 pb-4">
                                    <div className="flex items-center gap-3 p-4">
                                      <img 
                                        src={singer.photoUrl || 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=150&auto=format&fit=crop&q=60'} 
                                        alt={singer.name}
                                        className="w-8 h-8 rounded-full object-cover border border-white/10"
                                      />
                                      <div>
                                        <h4 className="text-xs font-black text-white">{singer.name}</h4>
                                        <span className="text-[9px] text-white/30 block mt-0.5">{new Date(post.createdAt).toLocaleDateString()}</span>
                                      </div>
                                    </div>
                                    
                                    {post.imageUrl ? (
                                      <div className="aspect-square bg-slate-950 flex items-center justify-center overflow-hidden border-t border-b border-white/5">
                                        <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
                                      </div>
                                    ) : (
                                      <div className="aspect-square bg-gradient-to-tr from-[#1a0e0a] to-[#2a1711] flex flex-col items-center justify-center p-6 text-center border-t border-b border-white/5">
                                        <Music className="text-white/20 mb-3" size={32} />
                                        <h3 className="text-sm font-black text-white/90 max-w-xs leading-normal">"{post.title}"</h3>
                                      </div>
                                    )}

                                    <div className="flex gap-4 px-4 pt-1">
                                      <button className="text-white/70 hover:text-rose-500 transition-colors">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                                      </button>
                                      <button className="text-white/70">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                                      </button>
                                    </div>

                                    <div className="px-4 space-y-1">
                                      <p className="text-xs text-white/90 leading-relaxed">
                                        <span className="font-black mr-2 text-white">{singer.name}</span>
                                        {post.content}
                                      </p>
                                      {post.tags && (
                                        <div className="flex gap-1.5 flex-wrap pt-1">
                                          {post.tags.split(',').map((t: string) => t.trim()).filter(Boolean).map((t: string, i: number) => (
                                            <span key={i} className="text-xs font-bold text-indigo-400 hover:underline cursor-pointer">
                                              #{t}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                              {singer.videos.length === 0 ? (
                                <p className="text-xs text-white/30 italic col-span-full">No performance video clips uploaded.</p>
                              ) : (
                                singer.videos.map(vid => (
                                  <ReelCard 
                                    key={vid.id} 
                                    vid={vid} 
                                    singer={singer} 
                                  />
                                ))
                              )}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

      </div>
    </main>
  );
}
