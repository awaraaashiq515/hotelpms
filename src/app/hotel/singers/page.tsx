'use client';

import React, { useState, useEffect } from 'react';
import { 
  Music, Plus, Edit, Trash2, Calendar, Star, Users, Video, 
  FileText, Play, CheckCircle2, XCircle, ArrowLeft, Loader2, Sparkles, MapPin, Briefcase
} from 'lucide-react';
import Link from 'next/link';
import { toast, Toaster } from 'sonner';

interface Singer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  bio: string | null;
  genre: string | null;
  photoUrl: string | null;
  rating: number;
  isActive: boolean;
}

interface Performance {
  id: string;
  singerId: string;
  propertyId: string;
  venueName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  singer: {
    name: string;
    genre: string | null;
    photoUrl: string | null;
  };
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
  singer: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    genre: string | null;
    photoUrl: string | null;
    rating: number;
  };
}

export default function AdminSingersPage() {
  const [activeTab, setActiveTab] = useState<'singers' | 'schedules' | 'bookings'>('singers');
  const [singers, setSingers] = useState<Singer[]>([]);
  const [schedules, setSchedules] = useState<Performance[]>([]);
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showSingerModal, setShowSingerModal] = useState(false);
  const [editingSinger, setEditingSinger] = useState<Singer | null>(null);
  const [singerForm, setSingerForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    bio: '',
    genre: '',
    photoUrl: '',
    isActive: true
  });

  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    singerId: '',
    venueName: '',
    date: '',
    startTime: '',
    endTime: '',
    proposedFee: '',
    notes: ''
  });

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Performance | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    singerId: '',
    venueName: '',
    date: '',
    startTime: '',
    endTime: '',
    status: 'SCHEDULED'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const singersRes = await fetch('/api/admin/singers');
      const singersData = await singersRes.json();
      if (singersData.success) {
        setSingers(singersData.data);
      }

      const schedulesRes = await fetch('/api/admin/performances');
      const schedulesData = await schedulesRes.json();
      if (schedulesData.success) {
        setSchedules(schedulesData.data);
      }

      const bookingsRes = await fetch('/api/admin/bookings');
      const bookingsData = await bookingsRes.json();
      if (bookingsData.success) {
        setBookings(bookingsData.data);
      }
    } catch (error) {
      toast.error('Failed to load singers, schedules, and bookings.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.singerId || !bookingForm.venueName || !bookingForm.date || !bookingForm.startTime || !bookingForm.endTime) {
      toast.error('Please fill in all required fields.');
      return;
    }

    const startDateTime = new Date(`${bookingForm.date}T${bookingForm.startTime}`);
    const endDateTime = new Date(`${bookingForm.date}T${bookingForm.endTime}`);

    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          singerId: bookingForm.singerId,
          venueName: bookingForm.venueName,
          date: new Date(bookingForm.date).toISOString(),
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          proposedFee: bookingForm.proposedFee ? parseFloat(bookingForm.proposedFee) : null,
          notes: bookingForm.notes
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Singer invited successfully!');
        setShowBookingModal(false);
        setBookingForm({
          singerId: '',
          venueName: '',
          date: '',
          startTime: '',
          endTime: '',
          proposedFee: '',
          notes: ''
        });
        fetchData();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Failed to invite singer.');
    }
  };

  const handleBookingAction = async (bookingRequestId: string, status: 'ACCEPTED' | 'DECLINED') => {
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingRequestId, status })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchData();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Failed to update booking status.');
    }
  };

  const handleSingerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingSinger ? 'PUT' : 'POST';
      const body = editingSinger 
        ? { id: editingSinger.id, ...singerForm } 
        : singerForm;

      const res = await fetch('/api/admin/singers', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (data.success) {
        toast.success(editingSinger ? 'Singer updated!' : 'Singer added!');
        setShowSingerModal(false);
        setEditingSinger(null);
        resetSingerForm();
        fetchData();
      } else {
        toast.error(data.message || 'Error occurred.');
      }
    } catch (err) {
      toast.error('Failed to save singer.');
    }
  };

  const handleDeleteSinger = async (id: string) => {
    if (!confirm('Are you sure you want to delete this singer? All associated performances will be deleted.')) return;
    try {
      const res = await fetch(`/api/admin/singers?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Singer deleted successfully.');
        fetchData();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Failed to delete singer.');
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingSchedule ? 'PUT' : 'POST';
      
      // We need to parse dates properly
      const startDateTime = new Date(`${scheduleForm.date}T${scheduleForm.startTime}`);
      const endDateTime = new Date(`${scheduleForm.date}T${scheduleForm.endTime}`);

      const body = editingSchedule
        ? { 
            id: editingSchedule.id,
            venueName: scheduleForm.venueName,
            date: new Date(scheduleForm.date).toISOString(),
            startTime: startDateTime.toISOString(),
            endTime: endDateTime.toISOString(),
            status: scheduleForm.status
          }
        : {
            singerId: scheduleForm.singerId,
            venueName: scheduleForm.venueName,
            date: new Date(scheduleForm.date).toISOString(),
            startTime: startDateTime.toISOString(),
            endTime: endDateTime.toISOString(),
            status: scheduleForm.status
          };

      const res = await fetch('/api/admin/performances', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (data.success) {
        toast.success(editingSchedule ? 'Performance rescheduled!' : 'Performance scheduled!');
        setShowScheduleModal(false);
        setEditingSchedule(null);
        resetScheduleForm();
        fetchData();
      } else {
        toast.error(data.message || 'Error occurred.');
      }
    } catch (err) {
      toast.error('Failed to schedule performance.');
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;
    try {
      const res = await fetch(`/api/admin/performances?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Performance schedule deleted.');
        fetchData();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Failed to delete schedule.');
    }
  };

  const openEditSinger = (singer: Singer) => {
    setEditingSinger(singer);
    setSingerForm({
      name: singer.name,
      email: singer.email,
      password: '', // blank during edit unless changing
      phone: singer.phone || '',
      bio: singer.bio || '',
      genre: singer.genre || '',
      photoUrl: singer.photoUrl || '',
      isActive: singer.isActive
    });
    setShowSingerModal(true);
  };

  const openEditSchedule = (perf: Performance) => {
    setEditingSchedule(perf);
    const dateStr = perf.date.split('T')[0];
    const startStr = new Date(perf.startTime).toTimeString().slice(0, 5);
    const endStr = new Date(perf.endTime).toTimeString().slice(0, 5);
    
    setScheduleForm({
      singerId: perf.singerId,
      venueName: perf.venueName,
      date: dateStr,
      startTime: startStr,
      endTime: endStr,
      status: perf.status
    });
    setShowScheduleModal(true);
  };

  const resetSingerForm = () => {
    setSingerForm({
      name: '',
      email: '',
      password: '',
      phone: '',
      bio: '',
      genre: '',
      photoUrl: '',
      isActive: true
    });
  };

  const resetScheduleForm = () => {
    setScheduleForm({
      singerId: '',
      venueName: '',
      date: '',
      startTime: '',
      endTime: '',
      status: 'SCHEDULED'
    });
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white p-6 space-y-6">
      <Toaster richColors position="top-right" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <Link href="/hotel" className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Music className="text-indigo-400" size={14} />
              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Hospitality & Guest Services</span>
            </div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Live Music & Singers Console
            </h1>
          </div>
        </div>

        <div className="flex gap-3">
          {activeTab === 'singers' ? (
            <button 
              onClick={() => { setEditingSinger(null); resetSingerForm(); setShowSingerModal(true); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-700 text-xs font-black text-white hover:from-indigo-500 hover:to-violet-600 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
            >
              <Plus size={14} /> Add Singer
            </button>
          ) : activeTab === 'schedules' ? (
            <button 
              onClick={() => { setEditingSchedule(null); resetScheduleForm(); setShowScheduleModal(true); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-700 text-xs font-black text-white hover:from-indigo-500 hover:to-violet-600 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
            >
              <Plus size={14} /> Schedule Performance
            </button>
          ) : (
            <button 
              onClick={() => setShowBookingModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-700 text-xs font-black text-white hover:from-indigo-500 hover:to-violet-600 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
            >
              <Plus size={14} /> Invite Performer
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs & Quick Stats */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/80 w-fit">
          <button 
            onClick={() => setActiveTab('singers')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all ${activeTab === 'singers' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            <Users size={14} /> Associated Singers ({singers.length})
          </button>
          <button 
            onClick={() => setActiveTab('schedules')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all ${activeTab === 'schedules' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            <Calendar size={14} /> Scheduled Slots ({schedules.length})
          </button>
          <button 
            onClick={() => setActiveTab('bookings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all ${activeTab === 'bookings' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            <Briefcase size={14} className="shrink-0" /> Gig Invites & Proposals ({bookings.length})
          </button>
        </div>

        {/* Live & Upcoming Records Summary Pill */}
        <div className="flex items-center gap-3 bg-gradient-to-r from-indigo-950/60 to-slate-900 border border-indigo-500/20 px-4 py-2 rounded-xl text-xs font-bold">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{schedules.filter(s => s.status === 'LIVE').length} Live Now</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1.5 text-sky-400">
            <Calendar size={12} />
            <span>{schedules.filter(s => s.status === 'SCHEDULED').length} Upcoming Shows Recorded</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-2">
          <Loader2 className="animate-spin text-indigo-500" size={32} />
          <p className="text-xs text-slate-500 font-bold">Synchronizing database schedules...</p>
        </div>
      ) : activeTab === 'singers' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {singers.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl">
              <Music className="mx-auto mb-2 text-slate-700" size={40} />
              <p className="font-bold text-sm">No Singers Onboarded Yet.</p>
              <p className="text-xs text-slate-600 mt-1">Click "Add Singer" to create login credentials and profiles.</p>
            </div>
          ) : (
            singers.map(singer => (
              <div key={singer.id} className="relative group bg-[#090f1e]/80 border border-slate-800 rounded-2xl p-5 hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/5 transition-all overflow-hidden flex flex-col justify-between">
                <div className="absolute top-4 right-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEditSinger(singer)} className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-amber-400 hover:text-amber-300 transition-colors">
                    <Edit size={12} />
                  </button>
                  <button onClick={() => handleDeleteSinger(singer.id)} className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-rose-500 hover:text-rose-400 transition-colors">
                    <Trash2 size={12} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-4 items-center">
                    <img 
                      src={singer.photoUrl || 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=150&auto=format&fit=crop&q=60'} 
                      alt={singer.name}
                      className="w-14 h-14 rounded-2xl object-cover border border-slate-700"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${singer.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
                        <h3 className="font-black text-sm text-white leading-tight">{singer.name}</h3>
                      </div>
                      <p className="text-[10px] font-black uppercase text-indigo-400 tracking-wider mt-0.5">{singer.genre || 'Various Genres'}</p>
                      <div className="flex items-center gap-1 mt-1 text-amber-400 text-xs">
                        <Star size={12} fill="currentColor" />
                        <span className="font-black text-[11px]">{singer.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                    {singer.bio || 'No biography written yet for this performer.'}
                  </p>
                </div>

                <div className="border-t border-slate-800/80 pt-4 mt-4 space-y-2">
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>{singer.email}</span>
                    {singer.phone && <span>{singer.phone}</span>}
                  </div>
                  <Link
                    href={`/hotel/singers/${singer.id}`}
                    className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-600/20 hover:border-indigo-500/40 text-[10px] font-black uppercase tracking-wider transition-all"
                  >
                    <Sparkles size={11} /> View Full Profile
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      ) : activeTab === 'schedules' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schedules.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl">
              <Calendar className="mx-auto mb-2 text-slate-700" size={40} />
              <p className="font-bold text-sm">No Performances Scheduled.</p>
              <p className="text-xs text-slate-600 mt-1">Assign singer performance slots across your lounges or cafe stages.</p>
            </div>
          ) : (
            schedules.map(perf => (
              <div key={perf.id} className="relative group bg-[#090f1e]/80 border border-slate-800 rounded-2xl p-5 hover:border-indigo-500/40 hover:shadow-lg transition-all flex flex-col justify-between">
                <div className="absolute top-4 right-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEditSchedule(perf)} className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-amber-400 hover:text-amber-300 transition-colors">
                    <Edit size={12} />
                  </button>
                  <button onClick={() => handleDeleteSchedule(perf.id)} className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-rose-500 hover:text-rose-400 transition-colors">
                    <Trash2 size={12} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={perf.singer.photoUrl || 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=150&auto=format&fit=crop&q=60'} 
                      alt={perf.singer.name}
                      className="w-10 h-10 rounded-xl object-cover"
                    />
                    <div>
                      <h3 className="font-black text-xs text-white leading-tight">{perf.singer.name}</h3>
                      <p className="text-[9px] uppercase tracking-wider font-bold text-indigo-400 mt-0.5">{perf.singer.genre || 'Various'}</p>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-b border-slate-800/80 py-3">
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <MapPin size={12} className="text-slate-500" />
                      <span>{perf.venueName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <Calendar size={12} className="text-slate-500" />
                      <span>{new Date(perf.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <Play size={12} className="text-slate-500" />
                      <span>
                        {new Date(perf.startTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} - {new Date(perf.endTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                    perf.status === 'LIVE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    perf.status === 'SCHEDULED' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' :
                    perf.status === 'COMPLETED' ? 'bg-slate-800 text-slate-400' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {perf.status}
                  </span>
                  <Link 
                    href={`/hotel/singers/${perf.singerId}`}
                    className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 flex items-center gap-1 uppercase tracking-wider"
                  >
                    <Sparkles size={10} /> View Artist Page →
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookings.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl">
              <Briefcase className="mx-auto mb-2 text-slate-700" size={40} />
              <p className="font-bold text-sm">No Gig Invites or Proposals.</p>
              <p className="text-xs text-slate-600 mt-1">Invite performers for upcoming events, or review proposals sent by singers.</p>
            </div>
          ) : (
            bookings.map(req => {
              const isSingerProposal = req.sender === 'SINGER';
              return (
                <div key={req.id} className="relative group bg-[#090f1e]/80 border border-slate-800 rounded-2xl p-5 hover:border-indigo-500/40 hover:shadow-lg transition-all flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex gap-3 items-center">
                      <img 
                        src={req.singer.photoUrl || 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=150&auto=format&fit=crop&q=60'} 
                        alt={req.singer.name}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-700"
                      />
                      <div>
                        <h3 className="font-black text-xs text-white leading-tight">{req.singer.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                            isSingerProposal ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-slate-800 text-slate-450 border border-slate-700'
                          }`}>
                            {isSingerProposal ? 'Singer Proposal' : 'Hotel Invite'}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                            req.status === 'ACCEPTED' ? 'bg-emerald-500/25 text-emerald-400' :
                            req.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse' :
                            'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {req.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 border-t border-b border-slate-800/80 py-3">
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <MapPin size={12} className="text-slate-500" />
                        <span>{req.venueName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <Calendar size={12} className="text-slate-500" />
                        <span>{new Date(req.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <Play size={12} className="text-slate-500" />
                        <span>
                          {new Date(req.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(req.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {req.proposedFee && (
                        <div className="text-xs font-bold text-indigo-400">
                          Proposed Fee: ₹{req.proposedFee}
                        </div>
                      )}
                      {req.notes && (
                        <p className="text-[10px] text-slate-550 italic mt-1 font-medium">"{req.notes}"</p>
                      )}
                    </div>
                  </div>

                  {isSingerProposal && req.status === 'PENDING' && (
                    <div className="flex gap-2 mt-4 shrink-0">
                      <button 
                        onClick={() => handleBookingAction(req.id, 'ACCEPTED')}
                        className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase transition-colors"
                      >
                        Accept
                      </button>
                      <button 
                        onClick={() => handleBookingAction(req.id, 'DECLINED')}
                        className="w-full py-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white text-[10px] font-black uppercase transition-colors"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Add/Edit Singer Modal */}
      {showSingerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#090f1e] border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative">
            <h2 className="text-lg font-black mb-4 flex items-center gap-2 text-white border-b border-slate-800 pb-3">
              <Sparkles size={16} className="text-indigo-400" />
              {editingSinger ? 'Edit Singer Profile' : 'Onboard New Singer'}
            </h2>
            <form onSubmit={handleSingerSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Full Name *</label>
                  <input 
                    type="text" required
                    className="w-full bg-[#050a14] border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    value={singerForm.name}
                    onChange={e => setSingerForm({...singerForm, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Email Address *</label>
                  <input 
                    type="email" required
                    className="w-full bg-[#050a14] border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    value={singerForm.email}
                    onChange={e => setSingerForm({...singerForm, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Password {editingSinger && '(Leave blank to keep)'} *</label>
                  <input 
                    type="password" required={!editingSinger}
                    className="w-full bg-[#050a14] border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    value={singerForm.password}
                    onChange={e => setSingerForm({...singerForm, password: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Phone Number</label>
                  <input 
                    type="text"
                    className="w-full bg-[#050a14] border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    value={singerForm.phone}
                    onChange={e => setSingerForm({...singerForm, phone: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Genre (e.g. Sufi, Pop, Bollywood)</label>
                  <input 
                    type="text"
                    placeholder="Pop, Classical..."
                    className="w-full bg-[#050a14] border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    value={singerForm.genre}
                    onChange={e => setSingerForm({...singerForm, genre: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Photo URL</label>
                  <input 
                    type="url"
                    placeholder="https://..."
                    className="w-full bg-[#050a14] border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    value={singerForm.photoUrl}
                    onChange={e => setSingerForm({...singerForm, photoUrl: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Biography / Bio</label>
                <textarea 
                  rows={3}
                  className="w-full bg-[#050a14] border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  value={singerForm.bio}
                  onChange={e => setSingerForm({...singerForm, bio: e.target.value})}
                />
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox"
                  id="isActive"
                  checked={singerForm.isActive}
                  onChange={e => setSingerForm({...singerForm, isActive: e.target.checked})}
                  className="rounded bg-slate-900 border-slate-800 text-indigo-500 focus:ring-0 focus:ring-offset-0"
                />
                <label htmlFor="isActive" className="text-xs text-slate-300">Active status (allow performances scheduling & login)</label>
              </div>

              <div className="flex gap-3 justify-end border-t border-slate-800/80 pt-4 mt-6">
                <button 
                  type="button"
                  onClick={() => setShowSingerModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-850 text-xs font-black text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-black text-white shadow-md active:scale-95 transition-all"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#090f1e] border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <h2 className="text-lg font-black mb-4 flex items-center gap-2 text-white border-b border-slate-800 pb-3">
              <Calendar size={16} className="text-indigo-400" />
              {editingSchedule ? 'Reschedule Performance' : 'Schedule Performance'}
            </h2>
            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              {!editingSchedule && (
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Select Singer *</label>
                  <select 
                    required
                    className="w-full bg-[#050a14] border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    value={scheduleForm.singerId}
                    onChange={e => setScheduleForm({...scheduleForm, singerId: e.target.value})}
                  >
                    <option value="" disabled>Choose a singer...</option>
                    {singers.filter(s => s.isActive).map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.genre || 'Various'})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Venue Stage / Room *</label>
                <input 
                  type="text" required
                  placeholder="e.g. Rooftop Cafe, Blue Velvet Lounge"
                  className="w-full bg-[#050a14] border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  value={scheduleForm.venueName}
                  onChange={e => setScheduleForm({...scheduleForm, venueName: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Performance Date *</label>
                <input 
                  type="date" required
                  className="w-full bg-[#050a14] border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 [color-scheme:dark]"
                  value={scheduleForm.date}
                  onChange={e => setScheduleForm({...scheduleForm, date: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Start Time *</label>
                  <input 
                    type="time" required
                    className="w-full bg-[#050a14] border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 [color-scheme:dark]"
                    value={scheduleForm.startTime}
                    onChange={e => setScheduleForm({...scheduleForm, startTime: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">End Time *</label>
                  <input 
                    type="time" required
                    className="w-full bg-[#050a14] border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 [color-scheme:dark]"
                    value={scheduleForm.endTime}
                    onChange={e => setScheduleForm({...scheduleForm, endTime: e.target.value})}
                  />
                </div>
              </div>

              {editingSchedule && (
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Status</label>
                  <select 
                    className="w-full bg-[#050a14] border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    value={scheduleForm.status}
                    onChange={e => setScheduleForm({...scheduleForm, status: e.target.value})}
                  >
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="LIVE">Live Now</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              )}

              <div className="flex gap-3 justify-end border-t border-slate-800/80 pt-4 mt-6">
                <button 
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-850 text-xs font-black text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-black text-white shadow-md active:scale-95 transition-all"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Performer Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#090f1e] border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <h2 className="text-lg font-black mb-4 flex items-center gap-2 text-white border-b border-slate-800 pb-3">
              <Briefcase size={16} className="text-indigo-400 animate-pulse" />
              Invite Performer / Singer
            </h2>
            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Select Singer *</label>
                <select 
                  required
                  className="w-full bg-[#050a14] border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  value={bookingForm.singerId}
                  onChange={e => setBookingForm({...bookingForm, singerId: e.target.value})}
                >
                  <option value="" disabled>Choose a singer to invite...</option>
                  {singers.filter(s => s.isActive).map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.genre || 'Various'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Venue Stage / Room *</label>
                <input 
                  type="text" required
                  placeholder="e.g. Poolside Grill, Sky Bar"
                  className="w-full bg-[#050a14] border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  value={bookingForm.venueName}
                  onChange={e => setBookingForm({...bookingForm, venueName: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Performance Date *</label>
                <input 
                  type="date" required
                  className="w-full bg-[#050a14] border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 [color-scheme:dark]"
                  value={bookingForm.date}
                  onChange={e => setBookingForm({...bookingForm, date: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Start Time *</label>
                  <input 
                    type="time" required
                    className="w-full bg-[#050a14] border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 [color-scheme:dark]"
                    value={bookingForm.startTime}
                    onChange={e => setBookingForm({...bookingForm, startTime: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">End Time *</label>
                  <input 
                    type="time" required
                    className="w-full bg-[#050a14] border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 [color-scheme:dark]"
                    value={bookingForm.endTime}
                    onChange={e => setBookingForm({...bookingForm, endTime: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Proposed Fee (INR)</label>
                <input 
                  type="number"
                  placeholder="e.g. 5000"
                  className="w-full bg-[#050a14] border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-700"
                  value={bookingForm.proposedFee}
                  onChange={e => setBookingForm({...bookingForm, proposedFee: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Invitation Notes (Optional)</label>
                <textarea 
                  rows={2}
                  placeholder="Details about the gig..."
                  className="w-full bg-[#050a14] border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-700"
                  value={bookingForm.notes}
                  onChange={e => setBookingForm({...bookingForm, notes: e.target.value})}
                />
              </div>

              <div className="flex gap-3 justify-end border-t border-slate-800/80 pt-4 mt-6">
                <button 
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-850 text-xs font-black text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-black text-white shadow-md active:scale-95 transition-all"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
