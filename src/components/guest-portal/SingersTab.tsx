import React, { useState, useEffect, useRef } from 'react';
import { 
  Music, Star, Play, CheckCircle2, MessageSquare, Video, 
  Rss, Search, Sparkles, Send, Flame, ThumbsUp, Loader2 
} from 'lucide-react';
import { toast } from 'sonner';

interface Performance {
  id: string;
  venueName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  singer: {
    id: string;
    name: string;
    genre: string | null;
    bio: string | null;
    photoUrl: string | null;
    rating: number;
  };
}

interface Singer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  bio: string | null;
  genre: string | null;
  photoUrl: string | null;
  rating: number;
  videos: Array<{ id: string; title: string; videoUrl: string; description: string | null }>;
  posts: Array<{ id: string; title: string; content: string; imageUrl: string | null; tags?: string | null; createdAt: string }>;
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

  return (
    <div 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleToggle}
      className="relative aspect-[9/16] rounded-3xl bg-slate-950 overflow-hidden border border-slate-800 group shadow-lg flex flex-col justify-end cursor-pointer"
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
        <h4 className="text-xs font-black text-white drop-shadow-md flex items-center gap-1.5"><Play size={11} fill="currentColor" className="text-indigo-400" /> {vid.title}</h4>
        {vid.description && <p className="text-[10px] text-slate-300 mt-1 drop-shadow">{vid.description}</p>}
      </div>
    </div>
  );
};

interface UpcomingPerformance {
  id: string;
  venueName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  singer: {
    id: string;
    name: string;
    genre: string | null;
    bio: string | null;
    photoUrl: string | null;
    rating: number;
    videos: Array<{ id: string; title: string; videoUrl: string; description: string | null }>;
    posts: Array<{ id: string; title: string; content: string; imageUrl: string | null; tags?: string | null; createdAt: string }>;
  };
}

export default function SingersTab({ token, propertyId }: { token: string; propertyId?: string }) {
  const [livePerformance, setLivePerformance] = useState<Performance | null>(null);
  const [upcomingPerformances, setUpcomingPerformances] = useState<UpcomingPerformance[]>([]);
  const [singers, setSingers] = useState<Singer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state for guest to view upcoming singer details
  const [modalSinger, setModalSinger] = useState<UpcomingPerformance | Singer | null>(null);
  const [modalTab, setModalTab] = useState<'posts' | 'videos'>('posts');
  
  // Forms state
  const [songTitle, setSongTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Tab inside singer details
  const [selectedSingerId, setSelectedSingerId] = useState<string | null>(null);
  const [singerSubTab, setSingerSubTab] = useState<'posts' | 'videos'>('posts');

  useEffect(() => {
    fetchLiveSinger();
    fetchUpcomingPerformances();
    fetchSingers();
  }, [propertyId]);

  const fetchUpcomingPerformances = async () => {
    try {
      const url = propertyId ? `/api/guest-portal/performances?propertyId=${propertyId}` : '/api/guest-portal/performances';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setUpcomingPerformances(data.data);
      }
    } catch (err) {
      console.error('Error fetching upcoming performances:', err);
    }
  };

  const fetchLiveSinger = async () => {
    if (!propertyId) return;
    try {
      const res = await fetch(`/api/guest-portal/live-singer?propertyId=${propertyId}`);
      const data = await res.json();
      if (data.success) {
        setLivePerformance(data.data);
      }
    } catch (err) {
      console.error('Error fetching live singer:', err);
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
      console.error('Error fetching singers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!livePerformance || !songTitle.trim()) return;

    setSubmittingRequest(true);
    try {
      const res = await fetch('/api/guest-portal/song-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          performanceId: livePerformance.id,
          songTitle: songTitle.trim(),
          artist: artist.trim() || undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Song request sent to singer!');
        setSongTitle('');
        setArtist('');
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Failed to send song request.');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleSendFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!livePerformance) return;

    setSubmittingFeedback(true);
    try {
      const res = await fetch('/api/guest-portal/singer-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          performanceId: livePerformance.id,
          rating,
          comment: comment.trim() || undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Thank you for rating this performance!');
        setComment('');
        fetchSingers(); // Refresh scores
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Failed to submit rating.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const filteredSingers = singers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (s.genre && s.genre.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      
      {/* 1. Live Music Banner & Panel */}
      {livePerformance && (
        <section className="p-6 rounded-3xl bg-gradient-to-br from-indigo-900/30 via-[#0a0f24] to-[#050818] border border-indigo-500/20 shadow-2xl relative overflow-hidden">
          <div className="absolute top-[-30%] right-[-10%] w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-1.5 mb-3">
            <Flame size={14} className="text-amber-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
              {livePerformance.status === 'LIVE' ? 'LIVE NOW PERFORMANCE' : 'UPCOMING PERFORMANCE TODAY'}
            </span>
          </div>

          <div className="flex flex-col md:flex-row gap-6 justify-between">
            {/* Singer Profile card */}
            <div className="flex gap-4 items-center flex-1">
              <img 
                src={livePerformance.singer.photoUrl || 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=150&auto=format&fit=crop&q=60'} 
                alt={livePerformance.singer.name}
                className="w-16 h-16 rounded-2xl object-cover border border-slate-800 shadow-md shrink-0"
              />
              <div>
                <h3 className="text-base font-black text-white">{livePerformance.singer.name}</h3>
                <p className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">{livePerformance.singer.genre || 'Live Music'}</p>
                <div className="flex gap-3 text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-tight">
                  <span className="flex items-center gap-1">📍 {livePerformance.venueName}</span>
                  <span>⏰ {new Date(livePerformance.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
              </div>
            </div>

            {/* Song Request Form (only when Live) */}
            {livePerformance.status === 'LIVE' ? (
              <div className="w-full md:w-80 bg-[#060b18] border border-slate-800/80 rounded-2xl p-4 space-y-3 shrink-0">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Music size={11} className="text-indigo-400" /> Request a song
                </p>
                <form onSubmit={handleRequestSong} className="space-y-2">
                  <input 
                    type="text" required
                    placeholder="Song Title..."
                    className="w-full bg-[#050a14] border border-slate-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-600"
                    value={songTitle}
                    onChange={e => setSongTitle(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      placeholder="Artist (Optional)..."
                      className="flex-1 bg-[#050a14] border border-slate-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-600"
                      value={artist}
                      onChange={e => setArtist(e.target.value)}
                    />
                    <button 
                      type="submit" disabled={submittingRequest}
                      className="px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center justify-center disabled:opacity-50"
                    >
                      <Send size={12} />
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="flex items-center text-xs text-slate-500 italic">
                Performance starts soon. Request queue opens when session is live.
              </div>
            )}
          </div>

          {/* Feedback Form (Only when LIVE or active) */}
          {livePerformance.status === 'LIVE' && (
            <div className="border-t border-slate-800/60 pt-4 mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Rate Performance:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(val => (
                    <button 
                      key={val} 
                      onClick={() => setRating(val)}
                      className="text-amber-400 focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star size={18} fill={val <= rating ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSendFeedback} className="flex gap-2">
                <input 
                  type="text"
                  placeholder="Share your experience (Optional)..."
                  className="flex-1 bg-[#050a14] border border-slate-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-600"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                />
                <button 
                  type="submit" disabled={submittingFeedback}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-black text-white rounded-xl active:scale-95 transition-all disabled:opacity-50"
                >
                  Submit
                </button>
              </form>
            </div>
          )}

        </section>
      )}

      {/* 2. Upcoming Performances & Scheduled Lineup */}
      {upcomingPerformances.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame size={16} className="text-amber-500 animate-pulse" />
              <h3 className="font-black text-sm uppercase tracking-wider text-slate-200">
                Upcoming Shows & Singer Lineup
              </h3>
            </div>
            <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
              {upcomingPerformances.length} Scheduled Gigs
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingPerformances.map((perf) => (
              <div 
                key={perf.id}
                onClick={() => { setModalSinger(perf); setModalTab('posts'); }}
                className="group relative bg-[#090f1e]/80 border border-slate-800 rounded-2xl p-4 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/5 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <img 
                      src={perf.singer.photoUrl || 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=150&auto=format&fit=crop&q=60'} 
                      alt={perf.singer.name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-700 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-xs text-white truncate group-hover:text-indigo-400 transition-colors">{perf.singer.name}</h4>
                      <p className="text-[9px] font-black uppercase text-indigo-400 tracking-wider mt-0.5">{perf.singer.genre || 'Vocalist'}</p>
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-amber-400 font-bold">
                        <Star size={10} fill="currentColor" />
                        <span>{perf.singer.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 border-t border-slate-800/80 pt-3 text-xs text-slate-300">
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="text-indigo-400 font-bold">📍 Venue:</span>
                      <span className="truncate">{perf.venueName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="text-indigo-400 font-bold">📅 Date:</span>
                      <span>{new Date(perf.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="text-indigo-400 font-bold">⏰ Time:</span>
                      <span>
                        {new Date(perf.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(perf.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-800/60 pt-3 mt-3">
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                    perf.status === 'LIVE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                  }`}>
                    {perf.status === 'LIVE' ? '● LIVE NOW' : 'Upcoming'}
                  </span>
                  <span className="text-[10px] font-black text-indigo-400 group-hover:underline flex items-center gap-1">
                    View Details →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. Professional Directory */}
      <section className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-indigo-400" />
            <h3 className="font-black text-sm uppercase tracking-wider text-slate-300">Singers Professional Directory</h3>
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={13} />
            <input 
              type="text"
              placeholder="Search singers, genre..."
              className="w-full bg-[#090f1e]/80 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-650"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="h-48 flex items-center justify-center text-slate-500 text-xs font-bold gap-2">
            <Loader2 className="animate-spin text-indigo-500" size={20} />
            Syncing artist profiles...
          </div>
        ) : filteredSingers.length === 0 ? (
          <div className="text-center py-16 text-slate-500 border border-slate-800 rounded-2xl">
            No singers found matching criteria.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSingers.map((singer, index) => {
              const isSelected = selectedSingerId === singer.id;
              return (
                <div 
                  key={singer.id} 
                  className="p-5 rounded-2xl bg-[#090f1e]/60 border border-slate-800/80 hover:border-slate-700/85 transition-all space-y-4"
                >
                  <div className="flex flex-wrap gap-4 justify-between items-center">
                    <div className="flex gap-4 items-center">
                      <div className="relative">
                        <img 
                          src={singer.photoUrl || 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=150&auto=format&fit=crop&q=60'} 
                          alt={singer.name}
                          className="w-14 h-14 rounded-2xl object-cover border border-slate-800 shadow"
                        />
                        {index === 0 && singer.rating >= 4.5 && (
                          <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-amber-500 to-yellow-600 text-white text-[8px] font-black uppercase px-1 rounded-full border border-slate-900 shadow flex items-center gap-0.5">
                            <Star size={7} fill="currentColor" /> Top
                          </span>
                        )}
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-white">{singer.name}</h4>
                        <p className="text-[10px] font-black uppercase text-indigo-400 tracking-wider mt-0.5">{singer.genre || 'Vocalist'}</p>
                        <div className="flex items-center gap-1 mt-1.5 text-xs text-amber-400 font-bold">
                          <Star size={11} fill="currentColor" />
                          <span>{singer.rating.toFixed(1)}</span>
                          <span className="text-slate-500 text-[10px] font-normal ml-1">({singer.videos.length} clips · {singer.posts.length} posts)</span>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        if (isSelected) {
                          setSelectedSingerId(null);
                        } else {
                          setSelectedSingerId(singer.id);
                          setSingerSubTab('posts');
                        }
                      }}
                      className="px-4 py-2 rounded-xl border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 text-xs font-bold transition-all"
                    >
                      {isSelected ? 'Hide Portfolio' : 'View Portfolio'}
                    </button>
                  </div>

                  {singer.bio && (
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                      {singer.bio}
                    </p>
                  )}

                  {/* Portfolio Details (Accordion body) */}
                  {isSelected && (
                    <div className="border-t border-slate-800/80 pt-4 mt-4 space-y-4">
                      {/* Portfolio tabs */}
                      <div className="flex gap-4 border-b border-slate-850 pb-2">
                        <button 
                          onClick={() => setSingerSubTab('posts')}
                          className={`text-xs font-black pb-1 transition-colors flex items-center gap-1.5 ${singerSubTab === 'posts' ? 'text-indigo-400 border-b border-indigo-500' : 'text-slate-500 hover:text-slate-350'}`}
                        >
                          <Rss size={12} /> Posts & Updates ({singer.posts.length})
                        </button>
                        <button 
                          onClick={() => setSingerSubTab('videos')}
                          className={`text-xs font-black pb-1 transition-colors flex items-center gap-1.5 ${singerSubTab === 'videos' ? 'text-indigo-400 border-b border-indigo-500' : 'text-slate-500 hover:text-slate-350'}`}
                        >
                          <Video size={12} /> Performance Clips ({singer.videos.length})
                        </button>
                      </div>

                      {singerSubTab === 'posts' ? (
                        <div className="space-y-4">
                          {singer.posts.length === 0 ? (
                            <p className="text-xs text-slate-500 italic py-2">No updates posted yet.</p>
                          ) : (
                            singer.posts.map(post => (
                              <div key={post.id} className="max-w-md mx-auto rounded-3xl border border-slate-800 bg-[#050a14] overflow-hidden shadow-xl space-y-3 pb-4">
                                <div className="flex items-center gap-3 p-4">
                                  <img 
                                    src={singer.photoUrl || 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=150&auto=format&fit=crop&q=60'} 
                                    alt={singer.name}
                                    className="w-8 h-8 rounded-full object-cover border border-slate-800"
                                  />
                                  <div>
                                    <h4 className="text-xs font-black text-white">{singer.name}</h4>
                                    <span className="text-[9px] text-slate-500 block mt-0.5">{new Date(post.createdAt).toLocaleDateString()}</span>
                                  </div>
                                </div>
                                
                                {post.imageUrl ? (
                                  <div className="aspect-square bg-slate-950 flex items-center justify-center overflow-hidden border-t border-b border-slate-900">
                                    <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
                                  </div>
                                ) : (
                                  <div className="aspect-square bg-gradient-to-tr from-[#050a14] to-[#090f1e] flex flex-col items-center justify-center p-6 text-center border-t border-b border-slate-900">
                                    <Music className="text-slate-800 mb-3" size={32} />
                                    <h3 className="text-sm font-black text-white/90 max-w-xs leading-normal">"{post.title}"</h3>
                                  </div>
                                )}

                                <div className="flex gap-4 px-4 pt-1">
                                  <button className="text-slate-400 hover:text-rose-500 transition-colors">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                                  </button>
                                  <button className="text-slate-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                                  </button>
                                </div>

                                <div className="px-4 space-y-1">
                                  <p className="text-xs text-slate-300 leading-relaxed">
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {singer.videos.length === 0 ? (
                            <p className="text-xs text-slate-500 italic py-2 col-span-full">No performance video clips uploaded.</p>
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
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. Singer Profile Detail Modal */}
      {modalSinger && (() => {
        const item = modalSinger as any;
        const singerData = item.singer || item;
        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 overflow-y-auto">
            <div className="bg-[#090f1e] border border-slate-800 rounded-3xl p-6 w-full max-w-2xl shadow-2xl relative space-y-5 my-8">
              <button 
                onClick={() => setModalSinger(null)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>

              {/* Singer Profile Header */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left border-b border-slate-800 pb-5">
                <img 
                  src={singerData.photoUrl || 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=150&auto=format&fit=crop&q=60'}
                  alt={singerData.name || 'Singer'}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-500/40 shadow-lg shrink-0"
                />
                <div className="space-y-1 flex-1">
                  <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                    <h2 className="text-xl font-black text-white">
                      {singerData.name || ''}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {singerData.genre || 'Vocalist'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 justify-center sm:justify-start text-xs text-amber-400 font-bold">
                    <Star size={13} fill="currentColor" />
                    <span>
                      {(singerData.rating || 5).toFixed(1)} Rating
                    </span>
                  </div>
                  {singerData.bio && (
                    <p className="text-xs text-slate-400 leading-relaxed mt-2">
                      {singerData.bio}
                    </p>
                  )}
                </div>
              </div>

              {/* Performance Schedule details (if opened from an upcoming performance) */}
              {'venueName' in item && (
                <div className="bg-indigo-950/40 border border-indigo-500/20 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-black text-indigo-400 uppercase tracking-wider">
                    <Flame size={14} className="text-amber-400 animate-pulse" /> Scheduled Performance Details
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-300">
                    <div><span className="text-slate-500 font-bold">Stage:</span> {item.venueName}</div>
                    <div><span className="text-slate-500 font-bold">Date:</span> {new Date(item.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                    <div>
                      <span className="text-slate-500 font-bold">Time:</span> {new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(item.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              )}

              {/* Video reels / Posts tabs */}
              <div className="space-y-4">
                <div className="flex gap-4 border-b border-slate-800 pb-2">
                  <button
                    onClick={() => setModalTab('posts')}
                    className={`text-xs font-black pb-1.5 transition-colors flex items-center gap-1.5 ${modalTab === 'posts' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    <Rss size={12} /> Posts & Updates
                  </button>
                  <button
                    onClick={() => setModalTab('videos')}
                    className={`text-xs font-black pb-1.5 transition-colors flex items-center gap-1.5 ${modalTab === 'videos' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    <Video size={12} /> Performance Reels
                  </button>
                </div>

                {modalTab === 'posts' ? (
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {(singerData.posts || []).length === 0 ? (
                      <p className="text-xs text-slate-500 italic py-4 text-center">No posts uploaded yet.</p>
                    ) : (
                      (singerData.posts || []).map((post: any) => (
                        <div key={post.id} className="bg-[#050a14] border border-slate-850 rounded-xl p-3 space-y-2 text-xs">
                          <div className="flex justify-between items-center text-[10px] text-slate-500">
                            <span className="font-bold text-slate-300">{post.title}</span>
                            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-slate-300">{post.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                    {(singerData.videos || []).length === 0 ? (
                      <p className="text-xs text-slate-500 italic py-4 text-center col-span-full">No video clips uploaded yet.</p>
                    ) : (
                      (singerData.videos || []).map((vid: any) => (
                        <ReelCard key={vid.id} vid={vid} singer={singerData} />
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setModalSinger(null)}
                  className="px-5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-black text-slate-300 hover:text-white transition-colors"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
