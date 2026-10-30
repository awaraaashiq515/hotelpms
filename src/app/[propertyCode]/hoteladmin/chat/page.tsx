'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  MessageSquare, Send, Users, Sparkles, ShieldCheck,
  Search, RefreshCw, ArrowLeft, Phone, Clock, Check, CheckCheck,
  Bell, Volume2, VolumeX, AlertCircle, Coffee, BedDouble, Wrench,
  Radio, Megaphone, ChevronRight, Filter, Plus, ChevronLeft
} from 'lucide-react';
import { toast } from 'sonner';

interface StaffContact {
  id: string;
  name: string;
  designation?: string;
  avatarUrl?: string;
  phone?: string;
  unreadCount?: number;
}

interface ChatMessage {
  id: string;
  propertyId: string;
  staffId: string;
  staffName: string;
  senderRole: 'ADMIN' | 'STAFF';
  senderName: string;
  message: string;
  channelType?: 'ADMIN' | 'GROUP' | 'DIRECT';
  recipientId?: string | null;
  isRead: number;
  createdAt: string;
}

export default function HotelAdminStaffChatPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const propertyCode = (params?.propertyCode as string) || '';
  const initialStaffId = searchParams.get('staffId');

  // Mobile View Navigation:
  // 'contacts' -> Shows the staff directory / broadcast channel list on mobile
  // 'conversation' -> Shows the active chat conversation / input on mobile
  const [mobileView, setMobileView] = useState<'contacts' | 'conversation'>(
    initialStaffId ? 'conversation' : 'contacts'
  );

  // Channel & Target Selection
  // 'GROUP' = broadcast to entire hotel & restaurant staff
  // 'DIRECT' = 1-on-1 admin chat with specific staff member
  const [activeChannel, setActiveChannel] = useState<'GROUP' | 'DIRECT'>(
    initialStaffId ? 'DIRECT' : 'GROUP'
  );
  const [selectedStaff, setSelectedStaff] = useState<StaffContact | null>(null);

  // Contacts & Messages
  const [staffList, setStaffList] = useState<StaffContact[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'HOUSEKEEPING' | 'FRONT_OFFICE' | 'FB' | 'MAINTENANCE'>('ALL');

  // Loading & Polling
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMsgCountRef = useRef<number>(0);

  // Audio chime for incoming staff messages
  const playNotificationSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;
      const ctx = new AudioCtxClass();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const now = ctx.currentTime;

      // Bell chime tone 1 (880 Hz - A5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.35, now + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.28);

      // Bell chime tone 2 (1318.51 Hz - E6)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1318.51, now + 0.09);
      gain2.gain.setValueAtTime(0, now + 0.09);
      gain2.gain.linearRampToValueAtTime(0.4, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.09);
      osc2.stop(now + 0.55);
    } catch (_) {}
  };

  // Gentle audio chime for sending messages
  const playSentSound = () => {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;
      const ctx = new AudioCtxClass();
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    } catch (_) {}
  };

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  // Fetch Staff Contacts List
  const fetchContacts = useCallback(async (isInitial = false) => {
    if (isInitial) setLoadingContacts(true);
    try {
      const q = new URLSearchParams({
        summary: 'true',
        fromAdmin: 'true',
        propertyCode: propertyCode || '',
      });
      const res = await fetch(`/api/staff-chat?${q.toString()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const mapped: StaffContact[] = data.data.map((item: any) => ({
          id: item.staff.id,
          name: item.staff.name,
          designation: item.staff.designation,
          avatarUrl: item.staff.avatarUrl,
          unreadCount: item.unreadCount || 0,
        }));
        setStaffList(mapped);

        if (initialStaffId && !selectedStaff) {
          const match = mapped.find(s => s.id === initialStaffId);
          if (match) {
            setSelectedStaff(match);
            setActiveChannel('DIRECT');
            setMobileView('conversation');
          }
        } else if (!selectedStaff && mapped.length > 0) {
          setSelectedStaff(mapped[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching staff contacts:', err);
    } finally {
      if (isInitial) setLoadingContacts(false);
    }
  }, [propertyCode, initialStaffId, selectedStaff]);

  // Fetch Messages for Active Channel
  const fetchMessages = useCallback(async (showLoading = false) => {
    if (showLoading) setLoadingMessages(true);
    try {
      const q = new URLSearchParams({
        fromAdmin: 'true',
        propertyCode: propertyCode || '',
        channelType: activeChannel === 'GROUP' ? 'GROUP' : 'DIRECT',
      });

      if (activeChannel === 'DIRECT') {
        if (!selectedStaff?.id) return;
        q.set('staffId', selectedStaff.id);
        q.set('recipientId', selectedStaff.id);
      }

      const res = await fetch(`/api/staff-chat?${q.toString()}`);
      const data = await res.json();

      if (data.success && Array.isArray(data.data)) {
        const newMsgs: ChatMessage[] = data.data;

        if (
          prevMsgCountRef.current > 0 &&
          newMsgs.length > prevMsgCountRef.current &&
          newMsgs[newMsgs.length - 1]?.senderRole === 'STAFF'
        ) {
          playNotificationSound();
        }

        prevMsgCountRef.current = newMsgs.length;
        setMessages(newMsgs);
      }
    } catch (err) {
      console.error('Error fetching chat messages:', err);
    } finally {
      if (showLoading) setLoadingMessages(false);
    }
  }, [propertyCode, activeChannel, selectedStaff?.id, soundEnabled]);

  useEffect(() => {
    fetchContacts(true);
  }, [fetchContacts]);

  useEffect(() => {
    prevMsgCountRef.current = 0;
    fetchMessages(true);
  }, [activeChannel, selectedStaff?.id]);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages.length]);

  // Polling every 3.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchContacts(false);
      fetchMessages(false);
    }, 3500);
    return () => clearInterval(interval);
  }, [fetchContacts, fetchMessages]);

  // Send Message
  const handleSendMessage = async (e?: React.FormEvent, presetText?: string) => {
    if (e) e.preventDefault();
    const textToSend = (presetText || chatInput).trim();
    if (!textToSend || sending) return;

    if (activeChannel === 'DIRECT' && !selectedStaff?.id) {
      toast.error('Please select a staff member first');
      return;
    }

    setSending(true);
    try {
      const payload: any = {
        message: textToSend,
        channelType: activeChannel,
        propertyCode: propertyCode || undefined,
        fromAdminDashboard: true,
        senderRole: 'ADMIN',
      };

      if (activeChannel === 'DIRECT' && selectedStaff?.id) {
        payload.staffId = selectedStaff.id;
        payload.recipientId = selectedStaff.id;
      }

      const res = await fetch('/api/staff-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setChatInput('');
        setMessages(prev => [...prev, data.data]);
        playSentSound();
        scrollToBottom(true);
        fetchContacts(false);
      } else {
        toast.error(data.error || 'Failed to send message');
      }
    } catch (err) {
      toast.error('Network error. Could not send message.');
    } finally {
      setSending(false);
    }
  };

  const fmtTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const groupPresets = [
    '📢 Team Briefing in 15 mins at Front Desk',
    '⭐ High Occupancy Today — Prepare all rooms',
    '🧹 Deep cleaning priority for all check-out rooms',
    '🍽️ Special dinner buffet scheduled for tonight',
  ];

  const staffPresets = [
    'Please inspect and clean Room immediately',
    'Guest requested extra towels and amenities',
    'Is Room maintenance completed?',
    'Good job! Room inspection passed successfully',
    'Please report to Reception desk for assistance',
  ];

  const filteredStaff = staffList.filter(s => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.designation || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (roleFilter === 'HOUSEKEEPING') {
      const d = (s.designation || '').toLowerCase();
      return d.includes('housekeep') || d.includes('clean') || d.includes('room boy') || d.includes('linen');
    }
    if (roleFilter === 'FRONT_OFFICE') {
      const d = (s.designation || '').toLowerCase();
      return d.includes('reception') || d.includes('front') || d.includes('manager') || d.includes('desk');
    }
    if (roleFilter === 'FB') {
      const d = (s.designation || '').toLowerCase();
      return d.includes('chef') || d.includes('cook') || d.includes('waiter') || d.includes('f&b') || d.includes('kitchen');
    }
    if (roleFilter === 'MAINTENANCE') {
      const d = (s.designation || '').toLowerCase();
      return d.includes('maint') || d.includes('tech') || d.includes('electric') || d.includes('plumb') || d.includes('security');
    }

    return true;
  });

  const totalUnreadStaff = staffList.reduce((acc, curr) => acc + (curr.unreadCount || 0), 0);

  return (
    <div className="flex flex-col h-full w-full bg-[#070913] text-slate-100 overflow-hidden font-sans select-none">
      
      {/* ── Top Header Bar (Desktop & Mobile Adaptive) ── */}
      <header className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 bg-[#0d1021]/95 backdrop-blur-xl border-b border-white/[0.08] shrink-0 z-10">
        
        {/* Left Side: Back action & Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* On Mobile: If in Conversation view, back button returns to Contacts list */}
          {mobileView === 'conversation' ? (
            <button
              type="button"
              onClick={() => setMobileView('contacts')}
              className="flex md:hidden items-center gap-1 px-2 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold transition-all active:scale-95 shrink-0"
              title="Back to Contact List"
            >
              <ChevronLeft size={18} />
              <span className="text-[11px] font-black">Contacts</span>
              {totalUnreadStaff > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 bg-rose-500 text-white text-[9px] font-black rounded-full">
                  {totalUnreadStaff}
                </span>
              )}
            </button>
          ) : null}

          {/* Regular Dashboard Back Link (always visible on desktop, or on mobile when in contacts view) */}
          <Link
            href={`/${propertyCode}/hoteladmin`}
            className={`items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-all active:scale-95 shrink-0 ${
              mobileView === 'conversation' ? 'hidden md:flex' : 'flex'
            }`}
            title="Back to Hotel Admin Dashboard"
          >
            <ArrowLeft size={16} />
          </Link>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-sm sm:text-base font-black tracking-tight text-white flex items-center gap-1.5 truncate">
                <MessageSquare className="text-amber-400 shrink-0" size={16} />
                <span className="truncate">Staff & Team Chat</span>
              </h1>
              <span className="hidden xs:flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[9px] sm:text-[10px] font-black shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-slate-400 truncate">
              Instant broadcast & direct messaging with all hotel & kitchen staff
            </p>
          </div>
        </div>

        {/* Right Side: Sound Mute + Refresh */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={() => setSoundEnabled(prev => !prev)}
            className={`p-1.5 sm:p-2 rounded-xl border transition-all ${
              soundEnabled
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                : 'bg-white/5 border-white/10 text-slate-500'
            }`}
            title={soundEnabled ? 'Chime sound enabled' : 'Chime sound muted'}
          >
            {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>

          <button
            onClick={() => {
              fetchContacts(false);
              fetchMessages(true);
            }}
            disabled={loadingMessages}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-bold transition-all disabled:opacity-40"
          >
            <RefreshCw size={13} className={loadingMessages ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </header>

      {/* ── Main Responsive Content Area ── */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* ── Directory / Contacts List Pane ── */}
        {/* On Mobile: Shown when mobileView === 'contacts'. Hidden when in 'conversation'. */}
        {/* On Desktop (md+): Always visible as left sidebar (w-80 md:w-88 lg:w-96). */}
        <aside
          className={`flex-col border-r border-white/[0.08] bg-[#090c19]/90 shrink-0 overflow-hidden ${
            mobileView === 'contacts' ? 'flex w-full' : 'hidden md:flex md:w-80 lg:w-92'
          }`}
        >
          {/* Channel Tabs: Team Broadcast vs 1-on-1 */}
          <div className="p-2.5 sm:p-3 border-b border-white/[0.06] space-y-2 shrink-0">
            <div className="grid grid-cols-2 p-1 rounded-2xl bg-black/40 border border-white/[0.06]">
              <button
                type="button"
                onClick={() => {
                  setActiveChannel('GROUP');
                  setMobileView('conversation');
                }}
                className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  activeChannel === 'GROUP'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Megaphone size={14} className="shrink-0" />
                <span className="truncate">Team Broadcast</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveChannel('DIRECT');
                  if (!selectedStaff && staffList.length > 0) {
                    setSelectedStaff(staffList[0]);
                  }
                }}
                className={`relative flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  activeChannel === 'DIRECT'
                    ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users size={14} className="shrink-0" />
                <span className="truncate">Staff 1-on-1</span>
                {totalUnreadStaff > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-rose-500 text-white text-[9px] font-black rounded-full animate-bounce">
                    {totalUnreadStaff}
                  </span>
                )}
              </button>
            </div>

            {/* Direct Mode: Search & Filter Pills */}
            {activeChannel === 'DIRECT' && (
              <div className="space-y-2 pt-0.5">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search staff by name or role..."
                    className="w-full pl-9 pr-8 py-2 rounded-xl bg-black/30 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-white"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-[10px] font-bold">
                  {[
                    { key: 'ALL', label: 'All Staff' },
                    { key: 'HOUSEKEEPING', label: '🧹 Clean' },
                    { key: 'FRONT_OFFICE', label: '🛎️ Front Desk' },
                    { key: 'FB', label: '🍽️ F&B' },
                    { key: 'MAINTENANCE', label: '🔧 Tech' },
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setRoleFilter(tab.key as any)}
                      className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-all ${
                        roleFilter === tab.key
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          : 'bg-white/5 text-slate-400 hover:text-slate-200 border border-transparent'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Directory Body */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04]">
            {activeChannel === 'GROUP' ? (
              <div className="p-3 sm:p-4 space-y-3">
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/15 to-orange-500/5 border border-amber-500/25">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                      <Megaphone size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-amber-300">All-Staff Broadcast Channel</p>
                      <p className="text-[10px] text-slate-400">All online staff receive your broadcasts</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed mt-2">
                    Broadcast announcements, emergency notices, or daily briefings instantly to all staff members across hotel and kitchen.
                  </p>
                  <button
                    type="button"
                    onClick={() => setMobileView('conversation')}
                    className="mt-3 w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs transition-all shadow-md active:scale-95 md:hidden"
                  >
                    Open Broadcast Thread →
                  </button>
                </div>

                <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Staff Team Members ({staffList.length})
                  </p>
                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                    {staffList.map(s => (
                      <div
                        key={s.id}
                        onClick={() => {
                          setSelectedStaff(s);
                          setActiveChannel('DIRECT');
                          setMobileView('conversation');
                        }}
                        className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] cursor-pointer transition-all text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-[10px] font-black shrink-0">
                            {s.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-white text-[11px] truncate">{s.name}</p>
                            <p className="text-[9px] text-slate-400 truncate">{s.designation || 'Staff Member'}</p>
                          </div>
                        </div>
                        <span className="text-[10px] text-indigo-400 font-bold shrink-0 ml-2">Chat →</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Direct 1-on-1 Staff List */
              <div>
                {loadingContacts ? (
                  <div className="p-8 text-center text-slate-500 space-y-2">
                    <RefreshCw size={18} className="animate-spin mx-auto text-indigo-400" />
                    <p className="text-xs">Loading staff contacts...</p>
                  </div>
                ) : filteredStaff.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 space-y-2">
                    <Users size={22} className="mx-auto text-slate-600" />
                    <p className="text-xs font-bold text-slate-400">No staff found</p>
                    <p className="text-[10px] text-slate-500">Try adjusting your search query</p>
                  </div>
                ) : (
                  filteredStaff.map(staff => {
                    const isSelected = selectedStaff?.id === staff.id;
                    const unread = staff.unreadCount || 0;

                    return (
                      <button
                        key={staff.id}
                        type="button"
                        onClick={() => {
                          setSelectedStaff(staff);
                          setActiveChannel('DIRECT');
                          setMobileView('conversation');
                        }}
                        className={`w-full text-left p-3 sm:p-3.5 flex items-center gap-3 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-500/20 border-l-4 border-indigo-500'
                            : 'hover:bg-white/[0.04] active:bg-white/[0.06]'
                        }`}
                      >
                        <div className="relative shrink-0">
                          <div
                            className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shadow-inner ${
                              isSelected
                                ? 'bg-indigo-500 text-white'
                                : 'bg-white/10 text-slate-300'
                            }`}
                          >
                            {staff.name.charAt(0).toUpperCase()}
                          </div>
                          {unread > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow-lg shadow-rose-500/50">
                              {unread}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-xs font-black text-white truncate">{staff.name}</p>
                            {unread > 0 && (
                              <span className="text-[9px] font-black text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded-full shrink-0">
                                {unread} new
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {staff.designation || 'Staff Member'}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </aside>

        {/* ── Active Conversation & Chat Thread Pane ── */}
        {/* On Mobile: Shown when mobileView === 'conversation'. Hidden when in 'contacts'. */}
        {/* On Desktop (md+): Always visible on the right. */}
        <main
          className={`flex-1 flex-col bg-[#050711] overflow-hidden ${
            mobileView === 'conversation' ? 'flex w-full' : 'hidden md:flex'
          }`}
        >
          {/* Active Conversation Sub-Header */}
          <div className="px-3 sm:px-5 py-2.5 sm:py-3 bg-[#0a0d1e]/90 border-b border-white/[0.08] backdrop-blur-md flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              {activeChannel === 'GROUP' ? (
                <>
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md shrink-0">
                    <Megaphone size={17} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <h2 className="text-xs sm:text-sm font-black text-white truncate">Team Group Broadcast</h2>
                      <span className="text-[9px] sm:text-[10px] bg-amber-500/20 text-amber-300 font-black px-1.5 py-0.2 rounded-full border border-amber-500/30 shrink-0">
                        All Staff
                      </span>
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                      Broadcasting to all {staffList.length} staff members
                    </p>
                  </div>
                </>
              ) : selectedStaff ? (
                <>
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black text-sm shadow-md shrink-0">
                    {selectedStaff.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <h2 className="text-xs sm:text-sm font-black text-white truncate">{selectedStaff.name}</h2>
                      <span className="text-[9px] sm:text-[10px] bg-indigo-500/20 text-indigo-300 font-black px-1.5 py-0.2 rounded-full border border-indigo-500/30 shrink-0">
                        {selectedStaff.designation || 'Staff'}
                      </span>
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                      Direct private conversation with Hotel Admin
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-xs text-slate-400">Please select a staff member</p>
              )}
            </div>

            {/* Quick Actions / Mode indicator */}
            <div className="flex items-center gap-2 shrink-0">
              {activeChannel === 'DIRECT' && selectedStaff?.phone && (
                <a
                  href={`tel:${selectedStaff.phone}`}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold hover:bg-emerald-500/25 transition-all"
                  title={`Call ${selectedStaff.name}`}
                >
                  <Phone size={13} />
                  <span className="hidden sm:inline">Call</span>
                </a>
              )}
              <span className="hidden lg:inline-block px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-slate-400 font-mono text-[11px]">
                {activeChannel === 'GROUP' ? 'Broadcast Mode' : 'Direct Staff Mode'}
              </span>
            </div>
          </div>

          {/* Preset Quick Actions Banner */}
          <div className="px-3 sm:px-4 py-2 bg-black/30 border-b border-white/[0.04] flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none shrink-0">
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-500 shrink-0">
              Presets:
            </span>
            {(activeChannel === 'GROUP' ? groupPresets : staffPresets).map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(undefined, preset)}
                disabled={sending}
                className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-slate-300 hover:text-white text-[10px] sm:text-[11px] font-bold border border-white/10 whitespace-nowrap transition-all disabled:opacity-40"
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Message Thread Stream */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 overscroll-contain">
            {loadingMessages ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
                <RefreshCw size={22} className="animate-spin text-amber-400" />
                <p className="text-xs">Fetching messages...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500">
                  <MessageSquare size={22} />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-300">No messages in this channel yet</p>
                  <p className="text-xs text-slate-500 max-w-xs sm:max-w-sm mt-1">
                    Send instructions, tasks, or urgent notifications to staff. Messages sync in real time.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isAdmin = msg.senderRole === 'ADMIN';

                return (
                  <div
                    key={msg.id || index}
                    className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'} transition-all`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <span className="text-[10px] sm:text-[11px] font-black text-slate-400">
                        {isAdmin ? '👑 Hotel Admin (You)' : msg.senderName || msg.staffName}
                      </span>
                      {activeChannel === 'GROUP' && !isAdmin && (
                        <span className="text-[9px] bg-white/10 text-slate-400 px-1 py-0.2 rounded">
                          Staff
                        </span>
                      )}
                      <span className="text-[9px] sm:text-[10px] text-slate-600">
                        {fmtTime(msg.createdAt)}
                      </span>
                    </div>

                    <div
                      className={`max-w-[90%] sm:max-w-[75%] md:max-w-[70%] rounded-2xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm leading-relaxed shadow-lg ${
                        isAdmin
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold rounded-br-xs'
                          : 'bg-[#12162a] text-slate-100 border border-white/[0.08] rounded-bl-xs'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                    </div>

                    <div className="flex items-center gap-1 mt-0.5 px-1 text-[9px] sm:text-[10px] text-slate-500">
                      {isAdmin && (
                        <span className="flex items-center gap-0.5">
                          {msg.isRead ? (
                            <>
                              <CheckCheck size={12} className="text-emerald-400" />
                              <span className="text-emerald-400/80">Read</span>
                            </>
                          ) : (
                            <>
                              <Check size={12} className="text-slate-500" />
                              <span>Delivered</span>
                            </>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Form */}
          <div className="p-2.5 sm:p-3 md:p-4 bg-[#0a0d1e]/95 border-t border-white/[0.08] backdrop-blur-md shrink-0">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder={
                  activeChannel === 'GROUP'
                    ? 'Broadcast message to staff...'
                    : `Type message to ${selectedStaff?.name || 'staff'}...`
                }
                disabled={sending}
                className="flex-1 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-black/40 border border-white/15 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/80 focus:ring-1 focus:ring-amber-400/50 transition-all"
              />

              <button
                type="submit"
                disabled={!chatInput.trim() || sending}
                className="flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs sm:text-sm shadow-lg shadow-amber-500/25 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
              >
                {sending ? (
                  <RefreshCw size={15} className="animate-spin" />
                ) : (
                  <>
                    <Send size={15} />
                    <span className="hidden sm:inline">Send</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
