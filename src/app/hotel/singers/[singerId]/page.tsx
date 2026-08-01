'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Music, Star, FileText, MapPin,
  Calendar, CheckCircle2, Clock, Phone,
  Mail, Loader2, MessageSquare, Heart, Video,
  Mic2, Award
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

interface SingerProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  bio: string | null;
  genre: string | null;
  photoUrl: string | null;
  coverPhotoUrl: string | null;
  rating: number;
  isActive: boolean;
  createdAt: string;
  avgRating: number;
  totalReviews: number;
  completedShows: number;
  videos: { id: string; title: string; videoUrl: string; description: string | null; createdAt: string }[];
  posts: {
    id: string; title: string; content: string; imageUrl: string | null; tags: string | null; createdAt: string;
    likes: { id: string }[]; comments: { id: string; authorName: string; content: string; createdAt: string }[];
  }[];
  feedbacks: { id: string; rating: number; comment: string | null; guestName: string | null; createdAt: string }[];
  performances: {
    id: string; venueName: string; date: string; startTime: string; endTime: string; status: string;
    property: { name: string; city: string | null };
  }[];
}

type TabType = 'overview' | 'videos' | 'posts' | 'reviews' | 'history';

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} size={size}
          className={s <= Math.round(rating) ? 'text-amber-400' : 'text-slate-700'}
          fill={s <= Math.round(rating) ? 'currentColor' : 'none'} />
      ))}
    </div>
  );
}

function VideoCard({ video }: { video: SingerProfile['videos'][0] }) {
  const isYT = video.videoUrl.includes('youtube.com') || video.videoUrl.includes('youtu.be');
  const embedUrl = () => {
    const m = video.videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
    return m ? `https://www.youtube.com/embed/${m[1]}` : video.videoUrl;
  };
  return (
    <div className="bg-[#090f1e]/80 border border-slate-800 rounded-2xl overflow-hidden hover:border-indigo-500/40 transition-all">
      <div className="relative aspect-video bg-black">
        {isYT ? (
          <iframe src={embedUrl()} className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        ) : (
          <video src={video.videoUrl} controls className="w-full h-full object-cover" />
        )}
      </div>
      <div className="p-3">
        <h4 className="text-xs font-black text-white line-clamp-1">{video.title}</h4>
        {video.description && <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{video.description}</p>}
        <p className="text-[9px] text-slate-600 mt-1.5 font-bold">
          {new Date(video.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      </div>
    </div>
  );
}

function PostCard({ post, singerName, singerPhoto }: { 
  post: SingerProfile['posts'][0]; 
  singerName: string;
  singerPhoto: string | null;
}) {
  return (
    <div className="bg-[#090f1e]/90 border border-slate-800 rounded-2xl overflow-hidden hover:border-indigo-500/30 transition-all">
      {/* Post Header */}
      <div className="flex items-center gap-3 p-4 pb-3">
        <img
          src={singerPhoto || 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=100&auto=format&fit=crop'}
          alt={singerName}
          className="w-9 h-9 rounded-full object-cover border-2 border-indigo-500/30"
        />
        <div className="flex-1">
          <p className="text-xs font-black text-white">{singerName}</p>
          <p className="text-[9px] text-slate-500">
            {new Date(post.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Full Image - no height constraint, shows fully */}
      {post.imageUrl && (
        <img
          src={post.imageUrl}
          alt={post.title}
          className="w-full object-contain bg-black"
          style={{ maxHeight: '600px' }}
        />
      )}

      {/* Likes & Comments Row */}
      <div className="flex items-center gap-4 px-4 pt-3 text-slate-400 text-xs">
        <span className="flex items-center gap-1.5">
          <Heart size={14} className="text-rose-400" fill={post.likes.length > 0 ? 'currentColor' : 'none'} />
          <span className="font-bold">{post.likes.length}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <MessageSquare size={14} className="text-sky-400" />
          <span className="font-bold">{post.comments.length}</span>
        </span>
      </div>

      {/* Content */}
      <div className="px-4 py-3 space-y-2">
        <p className="text-[12px] text-slate-200 leading-relaxed">
          <span className="font-black text-white mr-1.5">{singerName}</span>
          {post.content}
        </p>

        {/* Tags */}
        {post.tags && (
          <div className="flex flex-wrap gap-1">
            {post.tags.split(',').map((t, i) => (
              <span key={i} className="text-[11px] text-indigo-400 font-bold">
                #{t.trim()}
              </span>
            ))}
          </div>
        )}

        {/* Title (if different from content) */}
        {post.title && post.title !== post.content && (
          <p className="text-[10px] text-slate-500 italic border-t border-slate-800/60 pt-2">{post.title}</p>
        )}

        {/* Comments preview */}
        {post.comments.length > 0 && (
          <div className="border-t border-slate-800/60 pt-2 space-y-1.5">
            {post.comments.map(c => (
              <p key={c.id} className="text-[10px] text-slate-400">
                <span className="font-black text-slate-300 mr-1">{c.authorName}</span>
                {c.content}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


export default function SingerProfilePage() {
  const params = useParams();
  const singerId = params.singerId as string;

  const [profile, setProfile] = useState<SingerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  useEffect(() => { fetchProfile(); }, [singerId]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/hotel/singers/${singerId}`);
      const data = await res.json();
      if (data.success) setProfile(data.data);
      else toast.error(data.message || 'Failed to load singer profile.');
    } catch { toast.error('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center animate-pulse">
          <Music size={22} className="text-white" />
        </div>
        <Loader2 className="animate-spin text-indigo-500" size={24} />
        <p className="text-xs text-slate-500 font-bold">Loading Artist Profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center gap-4 text-white">
        <Music size={40} className="text-slate-700" />
        <p className="text-sm font-bold text-slate-400">Singer not found.</p>
        <Link href="/hotel/singers" className="px-4 py-2 rounded-xl bg-indigo-600 text-xs font-black text-white hover:bg-indigo-500 transition-colors">
          Back to Singers
        </Link>
      </div>
    );
  }

  const tabs: { id: TabType; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'overview', label: 'Overview', icon: <Mic2 size={13} /> },
    { id: 'videos', label: 'Videos', icon: <Video size={13} />, count: profile.videos.length },
    { id: 'posts', label: 'Posts', icon: <FileText size={13} />, count: profile.posts.length },
    { id: 'reviews', label: 'Reviews', icon: <Star size={13} />, count: profile.totalReviews },
    { id: 'history', label: 'Show History', icon: <Calendar size={13} />, count: profile.performances.length },
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <Toaster richColors position="top-right" />

      {/* Cover */}
      <div className="relative h-52 md:h-72 overflow-hidden">
        {profile.coverPhotoUrl ? (
          <img src={profile.coverPhotoUrl} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/40 to-transparent" />
        <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
          <Link href="/hotel/singers"
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-slate-300 hover:text-white text-xs font-bold transition-all hover:border-white/20">
            <ArrowLeft size={14} /> Back to Singers
          </Link>
        </div>
      </div>

      {/* Profile Hero */}
      <div className="relative px-4 sm:px-6 -mt-20 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl border-4 border-[#020617] overflow-hidden bg-slate-900 shadow-2xl shadow-indigo-900/30 shrink-0">
            <img
              src={profile.photoUrl || 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=300&auto=format&fit=crop&q=60'}
              alt={profile.name} className="w-full h-full object-cover" />
          </div>
          <div className="pb-2 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-white">{profile.name}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                profile.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-500 border-slate-700'
              }`}>{profile.isActive ? '● Active' : '○ Inactive'}</span>
            </div>
            {profile.genre && <p className="text-indigo-400 font-black text-xs uppercase tracking-widest mt-1">{profile.genre}</p>}
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <StarRow rating={profile.avgRating} size={13} />
                <span className="text-xs font-black text-amber-400">{profile.avgRating.toFixed(1)}</span>
                <span className="text-[10px] text-slate-500">({profile.totalReviews} reviews)</span>
              </div>
              <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                <CheckCircle2 size={11} className="text-indigo-400" /> {profile.completedShows} Shows Completed
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          {[
            { icon: <Star size={16} className="text-amber-400" />, val: profile.avgRating.toFixed(1), label: 'Avg Rating' },
            { icon: <Video size={16} className="text-violet-400" />, val: profile.videos.length, label: 'Videos' },
            { icon: <Award size={16} className="text-indigo-400" />, val: profile.completedShows, label: 'Shows Done' },
          ].map((stat) => (
            <div key={stat.label} className="bg-[#090f1e]/80 border border-slate-800 rounded-2xl p-4 flex flex-col items-center gap-1.5 hover:border-indigo-500/30 transition-all">
              {stat.icon}
              <p className="text-lg font-black text-white">{stat.val}</p>
              <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-6 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-black whitespace-nowrap transition-all border ${
                activeTab === tab.id
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                  : 'bg-[#090f1e]/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}>
              {tab.icon} {tab.label}
              {tab.count !== undefined && (
                <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black ${
                  activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                }`}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mt-6 pb-16 space-y-4">

          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              <div className="bg-[#090f1e]/80 border border-slate-800 rounded-2xl p-5">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-3 flex items-center gap-2">
                  <Mic2 size={12} /> About the Artist
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">{profile.bio || 'No biography written yet for this performer.'}</p>
              </div>

              <div className="bg-[#090f1e]/80 border border-slate-800 rounded-2xl p-5">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-3">Contact Info</h3>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center">
                      <Mail size={12} className="text-indigo-400" />
                    </div>
                    <span className="text-xs text-slate-300">{profile.email}</span>
                  </div>
                  {profile.phone && (
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center">
                        <Phone size={12} className="text-emerald-400" />
                      </div>
                      <span className="text-xs text-slate-300">{profile.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {profile.feedbacks.length > 0 && (
                <div className="bg-[#090f1e]/80 border border-slate-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                      <Star size={12} /> Recent Guest Reviews
                    </h3>
                    <button onClick={() => setActiveTab('reviews')} className="text-[9px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-wider">
                      See All →
                    </button>
                  </div>
                  <div className="space-y-3">
                    {profile.feedbacks.slice(0, 3).map(fb => (
                      <div key={fb.id} className="border-b border-slate-800/80 pb-3 last:border-0 last:pb-0">
                        <div className="flex items-center gap-2 mb-1">
                          <StarRow rating={fb.rating} size={11} />
                          <span className="text-[10px] text-slate-400 font-bold">{fb.guestName || 'Anonymous Guest'}</span>
                        </div>
                        {fb.comment && <p className="text-xs text-slate-400 leading-relaxed">{fb.comment}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {profile.performances.filter(p => p.status === 'SCHEDULED' || p.status === 'LIVE').length > 0 && (
                <div className="bg-[#090f1e]/80 border border-slate-800 rounded-2xl p-5">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-3 flex items-center gap-2">
                    <Calendar size={12} /> Upcoming Performances
                  </h3>
                  <div className="space-y-3">
                    {profile.performances.filter(p => p.status === 'SCHEDULED' || p.status === 'LIVE').slice(0, 3).map(perf => (
                      <div key={perf.id} className="flex items-center gap-3 bg-slate-900/60 rounded-xl p-3 border border-slate-800/60">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${perf.status === 'LIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-sky-500'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-white truncate">{perf.venueName}</p>
                          <p className="text-[9px] text-slate-500 mt-0.5">
                            {perf.property.name} · {new Date(perf.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
                          perf.status === 'LIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-sky-500/10 text-sky-400'
                        }`}>{perf.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIDEOS */}
          {activeTab === 'videos' && (
            <div>
              {profile.videos.length === 0 ? (
                <div className="py-20 flex flex-col items-center gap-3 border-2 border-dashed border-slate-800 rounded-2xl text-slate-500">
                  <Video size={36} className="text-slate-700" />
                  <p className="font-bold text-sm">No Videos Uploaded Yet</p>
                  <p className="text-xs text-slate-600">This singer has not uploaded any performance videos.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {profile.videos.map(v => <VideoCard key={v.id} video={v} />)}
                </div>
              )}
            </div>
          )}

          {/* POSTS */}
          {activeTab === 'posts' && (
            <div>
              {profile.posts.length === 0 ? (
                <div className="py-20 flex flex-col items-center gap-3 border-2 border-dashed border-slate-800 rounded-2xl text-slate-500">
                  <FileText size={36} className="text-slate-700" />
                  <p className="font-bold text-sm">No Posts Yet</p>
                  <p className="text-xs text-slate-600">This singer has not published any posts.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4 max-w-2xl mx-auto">
                  {profile.posts.map(p => <PostCard key={p.id} post={p} singerName={profile.name} singerPhoto={profile.photoUrl} />)}
                </div>
              )}
            </div>
          )}

          {/* REVIEWS */}
          {activeTab === 'reviews' && (
            <div className="space-y-4">
              <div className="bg-[#090f1e]/80 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-6">
                <div className="text-center">
                  <p className="text-5xl font-black text-white">{profile.avgRating.toFixed(1)}</p>
                  <StarRow rating={profile.avgRating} size={18} />
                  <p className="text-[10px] text-slate-500 mt-1 font-bold">{profile.totalReviews} Total Reviews</p>
                </div>
                <div className="flex-1 w-full space-y-1.5">
                  {[5, 4, 3, 2, 1].map(star => {
                    const count = profile.feedbacks.filter(f => Math.round(f.rating) === star).length;
                    const pct = profile.totalReviews > 0 ? (count / profile.totalReviews) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-2 text-[10px]">
                        <span className="text-slate-500 w-4 text-right font-bold">{star}</span>
                        <Star size={9} fill="currentColor" className="text-amber-400 shrink-0" />
                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-slate-500 w-4 font-bold">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {profile.feedbacks.length === 0 ? (
                <div className="py-16 flex flex-col items-center gap-3 border-2 border-dashed border-slate-800 rounded-2xl text-slate-500">
                  <Star size={36} className="text-slate-700" />
                  <p className="font-bold text-sm">No Reviews Yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {profile.feedbacks.map(fb => (
                    <div key={fb.id} className="bg-[#090f1e]/80 border border-slate-800 rounded-2xl p-4 hover:border-amber-500/20 transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <StarRow rating={fb.rating} size={12} />
                            <span className="text-[10px] font-black text-amber-400">{fb.rating.toFixed(1)}</span>
                          </div>
                          <p className="text-xs font-black text-white">{fb.guestName || 'Anonymous Guest'}</p>
                        </div>
                        <p className="text-[9px] text-slate-600 shrink-0">
                          {new Date(fb.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      {fb.comment && <p className="text-xs text-slate-400 mt-2 leading-relaxed border-t border-slate-800/80 pt-2">{fb.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SHOW HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              {profile.performances.length === 0 ? (
                <div className="py-16 flex flex-col items-center gap-3 border-2 border-dashed border-slate-800 rounded-2xl text-slate-500">
                  <Calendar size={36} className="text-slate-700" />
                  <p className="font-bold text-sm">No Performances Recorded</p>
                </div>
              ) : (
                profile.performances.map(perf => (
                  <div key={perf.id} className="bg-[#090f1e]/80 border border-slate-800 rounded-2xl p-4 hover:border-indigo-500/30 transition-all flex items-center gap-4">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      perf.status === 'LIVE' ? 'bg-emerald-500 animate-pulse' :
                      perf.status === 'SCHEDULED' ? 'bg-sky-500' :
                      perf.status === 'COMPLETED' ? 'bg-indigo-500' : 'bg-rose-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs font-black text-white">{perf.venueName}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                          perf.status === 'LIVE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          perf.status === 'SCHEDULED' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' :
                          perf.status === 'COMPLETED' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                          'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>{perf.status}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <MapPin size={9} /> {perf.property.name}{perf.property.city ? `, ${perf.property.city}` : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={9} /> {new Date(perf.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={9} />
                          {new Date(perf.startTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} - {new Date(perf.endTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
