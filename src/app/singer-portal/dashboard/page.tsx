'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Music, Star, Play, XCircle, LogOut, Rss, Loader2, 
  Clock, Briefcase, ImageIcon, Calendar
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

import { LiveRequestsTab } from '../../../components/singer-portal/LiveRequestsTab';
import { MyContentTab } from '../../../components/singer-portal/MyContentTab';
import { ScheduleTab } from '../../../components/singer-portal/ScheduleTab';
import { BookingsTab } from '../../../components/singer-portal/BookingsTab';
import { ReviewsTab } from '../../../components/singer-portal/ReviewsTab';

interface SingerInfo {
  id: string;
  name: string;
  email: string;
  genre: string | null;
  photoUrl: string | null;
  coverPhotoUrl: string | null;
  rating: number;
}

interface SongRequest {
  id: string;
  songTitle: string;
  artist: string | null;
  guestName: string;
  roomNo: string | null;
  status: string;
  createdAt: string;
}

interface Performance {
  id: string;
  venueName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  property: { name: string };
}

interface Feedback {
  id: string;
  rating: number;
  comment: string | null;
  guestName: string | null;
  createdAt: string;
}

interface VideoItem {
  id: string;
  title: string;
  videoUrl: string;
  description: string | null;
  createdAt: string;
}

interface PostItem {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  tags: string | null;
  createdAt: string;
  likes?: Array<{ id: string; singerId: string | null; guestId: string | null }>;
  comments?: Array<{ id: string; authorName: string; content: string; createdAt: string }>;
}

interface BookingRequest {
  id: string;
  singerId: string;
  propertyId: string;
  sender: 'HOTEL' | 'SINGER';
  venueName: string;
  date: string;
  startTime: string;
  endTime: string;
  proposedFee: number | null;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  notes: string | null;
  createdAt: string;
  property: {
    id: string;
    name: string;
    city: string | null;
  };
}

export default function SingerDashboard() {
  const router = useRouter();
  const [singer, setSinger] = useState<SingerInfo | null>(null);
  const [token, setToken] = useState<string>('');
  
  // Dashboard states
  const [activePerformance, setActivePerformance] = useState<Performance | null>(null);
  const [schedules, setSchedules] = useState<Performance[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [songRequests, setSongRequests] = useState<SongRequest[]>([]);
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
  const [stats, setStats] = useState({ rating: 5.0, reviews: 0 });
  const [loading, setLoading] = useState(true);

  // Mobile/Desktop navigation tabs
  const [activeTab, setActiveTab] = useState<'requests' | 'content' | 'schedule' | 'bookings' | 'feedback'>('requests');

  // Modular upload states for main header (which stays in dashboard layout)
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Video and Post state overrides loaded inside MyContent
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);

  useEffect(() => {
    const storedToken = localStorage.getItem('singer_token');
    const storedSinger = localStorage.getItem('singer_info');

    // ── Case 1: Singer portal's own localStorage token ──
    if (storedToken && storedSinger) {
      try {
        setToken(storedToken);
        setSinger(JSON.parse(storedSinger));
        fetchDashboard(storedToken);
        return;
      } catch {
        // fall through to session check
      }
    }

    // ── Case 2: Standard session login from /login page (SINGER role) ──
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(data => {
        if (data.authenticated && data.user?.role === 'SINGER') {
          const sessionSinger: SingerInfo = {
            id: data.user.id,
            name: data.user.name || data.user.fullName || data.user.email || 'Artist',
            email: data.user.email || '',
            genre: null,
            photoUrl: null,
            coverPhotoUrl: null,
            rating: 5.0,
          };
          setSinger(sessionSinger);
          setToken('session');
          setLoading(false);
        } else {
          router.replace('/login');
        }
      })
      .catch(() => router.replace('/login'));
  }, [router]);

  // Polling for song requests when active session is live
  useEffect(() => {
    if (!token || !activePerformance || activePerformance.status !== 'LIVE') return;

    const interval = setInterval(() => {
      fetchRequests(token, activePerformance.id);
    }, 5000);

    return () => clearInterval(interval);
  }, [token, activePerformance]);

  const fetchDashboard = async (jwtToken: string) => {
    try {
      const res = await fetch('/api/singer/dashboard', {
        headers: { Authorization: `Bearer ${jwtToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setStats({
          rating: data.data.singer.rating,
          reviews: data.data.singer.totalReviews
        });
        setActivePerformance(data.data.activePerformance);
        setSchedules(data.data.performances);
        setFeedbacks(data.data.feedbacks);

        if (data.data.singer) {
          setSinger(prev => {
            const updated = prev ? { ...prev, ...data.data.singer } : data.data.singer;
            localStorage.setItem('singer_info', JSON.stringify(updated));
            return updated;
          });
        }

        if (data.data.activePerformance) {
          fetchRequests(jwtToken, data.data.activePerformance.id);
        }
      } else {
        toast.error('Session expired. Please log in again.');
        handleLogout();
        return;
      }
    } catch (err) {
      toast.error('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }

    fetchVideos(jwtToken);
    fetchPosts(jwtToken);
    fetchBookings(jwtToken);
  };

  const fetchRequests = async (jwtToken: string, perfId: string) => {
    try {
      const res = await fetch(`/api/singer/requests?performanceId=${perfId}`, {
        headers: { Authorization: `Bearer ${jwtToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setSongRequests(data.data);
      }
    } catch (err) {
      console.error('Failed to poll song requests.');
    }
  };

  const fetchBookings = async (jwtToken: string) => {
    try {
      const res = await fetch('/api/singer/bookings', {
        headers: { Authorization: `Bearer ${jwtToken}` }
      });
      const data = await res.json();
      if (data.success) setBookingRequests(data.data);
    } catch (err) {
      console.error('Failed to fetch bookings.');
    }
  };

  const fetchVideos = async (jwtToken: string) => {
    try {
      const res = await fetch('/api/singer/videos', {
        headers: { Authorization: `Bearer ${jwtToken}` }
      });
      const data = await res.json();
      if (data.success) setVideos(data.data);
    } catch (err) {}
  };

  const fetchPosts = async (jwtToken: string) => {
    try {
      const res = await fetch('/api/singer/posts', {
        headers: { Authorization: `Bearer ${jwtToken}` }
      });
      const data = await res.json();
      if (data.success) setPosts(data.data);
    } catch (err) {}
  };

  const handleToggleSession = async (action: 'START' | 'END') => {
    let perfId = activePerformance?.id;
    if (!perfId) {
      const scheduled = schedules.find(s => s.status === 'SCHEDULED');
      if (!scheduled) {
        toast.error('No scheduled performance slot found to go live with.');
        return;
      }
      perfId = scheduled.id;
    }

    try {
      const res = await fetch('/api/singer/dashboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ performanceId: perfId, action })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchDashboard(token);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Failed to update session.');
    }
  };

  const handleRequestAction = async (requestId: string, status: 'ACCEPTED' | 'PLAYED' | 'DECLINED') => {
    try {
      const res = await fetch('/api/singer/requests', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ requestId, status })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Request marked as ${status.toLowerCase()}`);
        if (activePerformance) fetchRequests(token, activePerformance.id);
      }
    } catch (err) {
      toast.error('Failed to update request.');
    }
  };

  const handleBookingResponse = async (bookingRequestId: string, status: 'ACCEPTED' | 'DECLINED') => {
    try {
      const res = await fetch('/api/singer/bookings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ bookingRequestId, status })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchBookings(token);
        fetchDashboard(token);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Failed to update booking invite response.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('singer_token');
    localStorage.removeItem('singer_info');
    router.replace('/singer-portal/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050a14] flex flex-col items-center justify-center gap-2">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
        <p className="text-xs text-slate-500 font-bold">Synchronizing Live Console...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050a14] text-white relative">
      <Toaster richColors position="top-center" />

      {/* Header */}
      <header className="border-b border-slate-800/80 bg-[#050a14]/85 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center">
              <Music size={18} className="text-white" />
            </div>
            <div>
              <span className="text-[8px] font-black uppercase text-indigo-400 tracking-widest block">Singer Portal</span>
              <span className="text-xs font-black text-white">{singer?.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Live session controllers directly in layout header */}
            <div className="flex items-center gap-1.5">
              {activePerformance?.status === 'LIVE' ? (
                <button onClick={() => handleToggleSession('END')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-[10px] font-black text-white active:scale-95 transition-all shadow-lg shadow-rose-900/40">
                  <XCircle size={11} /> End Session
                </button>
              ) : (
                <button onClick={() => handleToggleSession('START')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-[10px] font-black text-white active:scale-95 transition-all shadow-lg shadow-indigo-900/40">
                  <Play size={11} fill="currentColor" /> Go Live
                </button>
              )}
            </div>
            <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 text-xs font-bold transition-all">
              <LogOut size={12} /> Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Mobile app navigation bottom bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090f1e]/95 backdrop-blur-lg border-t border-slate-800/80 px-4 py-2.5 flex justify-around items-center shadow-2xl">
        <button onClick={() => setActiveTab('requests')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'requests' ? 'text-indigo-400 scale-105' : 'text-slate-500'}`}>
          <Clock size={18} />
          <span className="text-[8px] font-black uppercase tracking-wider">Live Requests</span>
        </button>
        <button onClick={() => setActiveTab('content')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'content' ? 'text-indigo-400 scale-105' : 'text-slate-500'}`}>
          <Rss size={18} />
          <span className="text-[8px] font-black uppercase tracking-wider">My Profile</span>
        </button>
        <button onClick={() => setActiveTab('bookings')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'bookings' ? 'text-indigo-400 scale-105' : 'text-slate-500'}`}>
          <Briefcase size={18} />
          <span className="text-[8px] font-black uppercase tracking-wider">Gigs</span>
        </button>
        <button onClick={() => setActiveTab('feedback')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'feedback' ? 'text-indigo-400 scale-105' : 'text-slate-500'}`}>
          <Star size={18} />
          <span className="text-[8px] font-black uppercase tracking-wider">Reviews</span>
        </button>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-28">

        {/* Live Status console widget on top */}
        <div className="p-4 rounded-3xl bg-[#090f1e]/60 border border-slate-800 flex flex-wrap gap-4 items-center justify-between shadow-xl">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${
              activePerformance?.status === 'LIVE' ? 'bg-rose-500/10 border-rose-500/30' : 'bg-slate-900 border-slate-800'
            }`}>
              <Music size={18} className={activePerformance?.status === 'LIVE' ? 'text-rose-500 animate-pulse' : 'text-slate-500'} />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Live Status Console</p>
              <h4 className="text-xs font-black text-white mt-0.5">
                {activePerformance?.status === 'LIVE' ? `LIVE AT: ${activePerformance.venueName}` : 'Offline / Not performing'}
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-6 pr-2">
            <div className="text-center">
              <p className="text-sm font-black text-white flex items-center gap-0.5">
                <Star size={10} className="text-amber-400" fill="currentColor" />
                {stats.rating.toFixed(1)}
              </p>
              <p className="text-[9px] text-slate-500 uppercase tracking-wider">Rating</p>
            </div>
            <div className="w-px h-6 bg-slate-800" />
            <div className="text-center">
              <p className="text-sm font-black text-white">{stats.reviews}</p>
              <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Reviews</p>
            </div>
          </div>
        </div>

        {/* Desktop navigation tabs list */}
        <div className="hidden sm:flex border-b border-slate-800">
          <button onClick={() => setActiveTab('requests')} className={`px-4 py-3 text-xs font-black tracking-wider uppercase border-b-2 transition-all ${activeTab === 'requests' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-350'}`}>
            Live Song Requests ({songRequests.filter(r => r.status === 'PENDING').length})
          </button>
          <button onClick={() => setActiveTab('content')} className={`px-4 py-3 text-xs font-black tracking-wider uppercase border-b-2 transition-all ${activeTab === 'content' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-350'}`}>
            My Profile
          </button>
          <button onClick={() => setActiveTab('bookings')} className={`px-4 py-3 text-xs font-black tracking-wider uppercase border-b-2 transition-all ${activeTab === 'bookings' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-350'}`}>
            Hotel Gigs ({bookingRequests.filter(r => r.status === 'PENDING').length})
          </button>
          <button onClick={() => setActiveTab('schedule')} className={`px-4 py-3 text-xs font-black tracking-wider uppercase border-b-2 transition-all ${activeTab === 'schedule' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-350'}`}>
            My Schedule
          </button>
          <button onClick={() => setActiveTab('feedback')} className={`px-4 py-3 text-xs font-black tracking-wider uppercase border-b-2 transition-all ${activeTab === 'feedback' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-350'}`}>
            Reviews
          </button>
        </div>

        {/* Tab contents rendered modularly */}
        <div className="space-y-4">
          {activeTab === 'requests' && (
            <LiveRequestsTab 
              activePerformance={activePerformance} 
              songRequests={songRequests} 
              handleRequestAction={handleRequestAction} 
            />
          )}

          {activeTab === 'content' && (
            <MyContentTab 
              token={token} 
              singer={singer} 
              setSinger={setSinger} 
              posts={posts} 
              videos={videos} 
              fetchPosts={fetchPosts} 
              fetchVideos={fetchVideos} 
            />
          )}

          {activeTab === 'bookings' && (
            <BookingsTab 
              bookingRequests={bookingRequests} 
              handleBookingResponse={handleBookingResponse} 
            />
          )}

          {activeTab === 'schedule' && (
            <ScheduleTab 
              schedules={schedules} 
            />
          )}

          {activeTab === 'feedback' && (
            <ReviewsTab 
              feedbacks={feedbacks} 
            />
          )}
        </div>

      </main>
    </div>
  );
}
