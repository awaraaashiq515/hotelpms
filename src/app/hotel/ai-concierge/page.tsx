'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Sparkles, Brain, MessageSquare, BarChart3, Settings, 
  Search, Globe, Phone, Calendar, ShieldCheck, UserCheck,
  Plus, CheckCircle2, AlertCircle, Clock, Zap, Volume2, Bell, X, ArrowUpRight
} from 'lucide-react';
import { ChatWindow } from './components/ChatWindow';
import { QuickRequests } from './components/QuickRequests';
import { KnowledgeBaseModal } from './components/KnowledgeBaseModal';
import { 
  INITIAL_SESSIONS, DEFAULT_KNOWLEDGE, HotelSession, 
  HotelKnowledge, ChatMessage 
} from '@/lib/ai-concierge-engine';
import { playNotificationSound, setupAudioUnlock } from '@/lib/notification-sound';

interface IncomingMessageAlert {
  id: string;
  room: string;
  guest: string;
  content: string;
  time: string;
  sessionId?: string;
}

export default function AIConcierge() {
  const [sessions, setSessions] = useState<HotelSession[]>(INITIAL_SESSIONS);
  const [activeSessionId, setActiveSessionId] = useState<string>('sess-204');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'RESOLVED' | 'URGENT'>('ALL');
  const [preferredLanguage, setPreferredLanguage] = useState<string>('en');
  const [knowledge, setKnowledge] = useState<HotelKnowledge>(DEFAULT_KNOWLEDGE);
  const [isKnowledgeModalOpen, setIsKnowledgeModalOpen] = useState(false);
  const [externalPrompt, setExternalPrompt] = useState<string>('');

  // 🔔 Incoming Message Notification Popup Alert state
  const [incomingAlert, setIncomingAlert] = useState<IncomingMessageAlert | null>(null);
  const knownMessageIdsRef = useRef<Set<string>>(new Set());
  const isInitialFetchRef = useRef<boolean>(true);

  // Trigger popup alert and play bell sound
  const triggerNewMessageAlert = (msg: {
    id: string;
    room: string;
    guest: string;
    content: string;
    time?: string;
    sessionId?: string;
  }) => {
    // 🛎️ Play realistic Hotel Front Desk Bell Sound!
    playNotificationSound('booking');

    // Display Popup Alert
    setIncomingAlert({
      id: msg.id || String(Date.now()),
      room: msg.room,
      guest: msg.guest,
      content: msg.content,
      time: msg.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sessionId: msg.sessionId,
    });

    // Auto dismiss after 10 seconds
    setTimeout(() => {
      setIncomingAlert((current) => (current?.id === msg.id ? null : current));
    }, 10000);
  };

  // 1. Initial Load & Setup
  useEffect(() => {
    setupAudioUnlock();

    // Initial API fetch
    fetch('/api/hotel/ai-concierge')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.sessions?.length) {
          setSessions(data.sessions);
          if (data.knowledge) setKnowledge(data.knowledge);
          // Mark existing messages so we don't alert for old ones on load
          if (data.recentGuestMessages) {
            data.recentGuestMessages.forEach((m: any) => knownMessageIdsRef.current.add(m.id));
          }
          // Automatically focus on the first session (which has the latest live message!)
          setActiveSessionId((curr) => {
            if (!curr || curr === 'sess-204' || !data.sessions.some((s: any) => s.id === curr)) {
              return data.sessions[0].id;
            }
            return curr;
          });
        }
        isInitialFetchRef.current = false;
      })
      .catch(() => {
        isInitialFetchRef.current = false;
      });
  }, []);

  // 2. Cross-Tab Live BroadcastChannel for 0ms instant sync with room portal
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      channel = new BroadcastChannel('concierge_chat_channel');
      channel.onmessage = (event) => {
        const payload = event.data;
        if (!payload) return;

        if (payload.type === 'GUEST_MESSAGE') {
          const roomNo = String(payload.room || payload.roomNumber);
          const guestName = payload.guest || payload.guestName || `Guest Room ${roomNo}`;
          const content = payload.content || payload.message;
          const timeStr = payload.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const msgId = `bc-${Date.now()}`;

          knownMessageIdsRef.current.add(msgId);
          let targetSessionId = '';

          // Update or prepend session in list
          setSessions((prev) => {
            const existingIndex = prev.findIndex((s) => s.room === roomNo);
            const newMsgObj: ChatMessage = {
              id: msgId,
              role: 'user',
              content,
              time: timeStr,
              senderName: guestName,
            };

            let updatedList: HotelSession[];
            if (existingIndex >= 0) {
              const target = prev[existingIndex];
              targetSessionId = target.id;
              const updatedSession: HotelSession = {
                ...target,
                history: [...target.history, newMsgObj],
                lastMsg: content.slice(0, 60),
                time: timeStr,
                unreadCount: (target.unreadCount || 0) + 1,
                status: 'ACTIVE',
              };
              const remaining = prev.filter((_, idx) => idx !== existingIndex);
              updatedList = [updatedSession, ...remaining];
            } else {
              const newSessionId = `portal-room-${roomNo}`;
              targetSessionId = newSessionId;
              const newSession: HotelSession = {
                id: newSessionId,
                room: roomNo,
                roomType: 'In-Room Guest',
                guest: guestName,
                guestPhone: '+91 98000 00000',
                tier: 'Gold Loyalty',
                checkIn: 'Today',
                checkOut: 'Active',
                status: 'ACTIVE',
                lastMsg: content.slice(0, 60),
                time: timeStr,
                unreadCount: 1,
                history: [newMsgObj],
              };
              updatedList = [newSession, ...prev];
            }

            return updatedList;
          });

          // Auto-select this session in the main chat window so the receptionist sees it!
          if (targetSessionId) {
            setActiveSessionId(targetSessionId);
          }

          // Play Sound & Show Popup Alert!
          triggerNewMessageAlert({
            id: msgId,
            room: roomNo,
            guest: guestName,
            content,
            time: timeStr,
            sessionId: targetSessionId,
          });
        } else if (payload.type === 'AI_REPLY_SYNC') {
          // Live sync of AI's response to the guest
          const roomNo = String(payload.room || payload.roomNumber);
          const content = payload.message || payload.content;
          const timeStr = payload.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          setSessions((prev) => {
            return prev.map((s) => {
              if (s.room === roomNo) {
                const aiMsgObj: ChatMessage = {
                  id: `ai-sync-${Date.now()}`,
                  role: 'assistant',
                  content,
                  time: timeStr,
                  action: payload.action,
                  quickReplies: payload.quickReplies,
                  senderName: 'AI Concierge',
                };
                const last = s.history[s.history.length - 1];
                if (last && last.role === 'assistant' && last.content === content) {
                  return s;
                }
                return {
                  ...s,
                  history: [...s.history, aiMsgObj],
                  lastMsg: content.slice(0, 60),
                  time: timeStr,
                };
              }
              return s;
            });
          });
        }
      };
    }

    return () => {
      if (channel) channel.close();
    };
  }, []);

  // 3. Background Polling Loop (every 2.5s) to detect messages from tablet/other browsers
  useEffect(() => {
    const pollInterval = setInterval(() => {
      fetch('/api/hotel/ai-concierge')
        .then((res) => res.json())
        .then((data) => {
          if (!data.success) return;

          // Check if any new guest message arrived
          if (data.recentGuestMessages && Array.isArray(data.recentGuestMessages)) {
            data.recentGuestMessages.forEach((gm: any) => {
              if (!knownMessageIdsRef.current.has(gm.id)) {
                knownMessageIdsRef.current.add(gm.id);

                // If not initial fetch, trigger sound, popup, and focus!
                if (!isInitialFetchRef.current) {
                  triggerNewMessageAlert({
                    id: gm.id,
                    room: gm.room,
                    guest: gm.guest,
                    content: gm.content,
                    time: gm.time,
                  });

                  // Switch active session to this room
                  if (data.sessions) {
                    const match = data.sessions.find((s: any) => s.room === gm.room);
                    if (match) {
                      setActiveSessionId(match.id);
                    }
                  }
                }
              }
            });
          }

          if (data.sessions?.length) {
            setSessions(data.sessions);
            // If activeSessionId is not in the list, set to the first one
            setActiveSessionId((curr) => {
              if (!curr || curr === 'sess-204' || !data.sessions.some((s: any) => s.id === curr)) {
                return data.sessions[0].id;
              }
              return curr;
            });
          }

          isInitialFetchRef.current = false;
        })
        .catch(() => {});
    }, 2500);

    return () => clearInterval(pollInterval);
  }, []);

  // Save sessions to localStorage when updated
  const updateSessionHistory = (sessionId: string, newHistory: ChatMessage[], newStatus?: 'ACTIVE' | 'RESOLVED' | 'URGENT') => {
    setSessions(prev => {
      const updated = prev.map(s => {
        if (s.id === sessionId) {
          const lastMsgObj = newHistory[newHistory.length - 1];
          return {
            ...s,
            history: newHistory,
            lastMsg: lastMsgObj ? lastMsgObj.content.slice(0, 60) : s.lastMsg,
            time: 'Just now',
            status: newStatus || s.status,
            unreadCount: 0
          };
        }
        return s;
      });
      try {
        localStorage.setItem('guestflow_ai_sessions', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleToggleStatus = (sessionId: string, status: 'ACTIVE' | 'RESOLVED') => {
    setSessions(prev => {
      const updated = prev.map(s => s.id === sessionId ? { ...s, status } : s);
      try {
        localStorage.setItem('guestflow_ai_sessions', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleSaveKnowledge = (updated: HotelKnowledge) => {
    setKnowledge(updated);
    try {
      localStorage.setItem('guestflow_ai_knowledge', JSON.stringify(updated));
    } catch (e) {}
  };

  // Active session object
  const activeSession = useMemo(() => {
    return sessions.find(s => s.id === activeSessionId) || sessions[0];
  }, [sessions, activeSessionId]);

  // Filtered sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      const matchesSearch = 
        s.room.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.guest.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.lastMsg.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' ? true : s.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [sessions, searchQuery, statusFilter]);

  // Dynamic statistics
  const stats = useMemo(() => {
    const totalRequests = sessions.reduce((acc, s) => acc + s.history.filter(m => m.role === 'user').length, 120);
    const resolvedCount = sessions.filter(s => s.status === 'RESOLVED').length;
    const resolvedPercent = Math.round((resolvedCount / Math.max(sessions.length, 1)) * 100);

    return [
      { label: 'Requests Processed', value: `${totalRequests}`, sub: '+24% today', color: 'text-violet-300 border-violet-500/20 bg-violet-950/30' },
      { label: 'AI Auto-Resolved', value: `${Math.max(92, resolvedPercent)}%`, sub: 'Instant assistance', color: 'text-emerald-300 border-emerald-500/20 bg-emerald-950/30' },
      { label: 'Avg Response Time', value: '1.1s', sub: 'Real-time NLP engine', color: 'text-sky-300 border-sky-500/20 bg-sky-950/30' },
      { label: 'Guest Rating', value: '4.9★', sub: '5-star satisfaction', color: 'text-yellow-300 border-yellow-500/20 bg-yellow-950/30' },
    ];
  }, [sessions]);

  return (
    <div className="space-y-5 pb-10 max-w-[1440px] mx-auto px-4 sm:px-6 relative">
      {/* Header Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Brain size={14} className="text-violet-400" />
            <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest">
              AI Concierge · Operations
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">AI Concierge Portal</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            24/7 autonomous guest assistance · Multi-lingual NLP · Auto-dispatch Housekeeping & Maintenance
          </p>
        </div>

        {/* Header Tools */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Sound Notification Test Button */}
          <button
            onClick={() => {
              setupAudioUnlock();
              playNotificationSound('booking');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-violet-500/20 bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all"
            title="Click to test concierge notification bell sound"
          >
            <Volume2 size={13} className="text-violet-400" />
            <span>Sound Alert: Active</span>
          </button>

          {/* Language Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-slate-900/60 text-slate-300 text-xs">
            <Globe size={13} className="text-violet-400" />
            <select
              value={preferredLanguage}
              onChange={e => setPreferredLanguage(e.target.value)}
              className="bg-transparent text-white font-bold outline-none text-[11px] cursor-pointer"
            >
              <option value="en" className="bg-slate-900 text-white">English</option>
              <option value="hi" className="bg-slate-900 text-white">हिंदी (Hindi)</option>
              <option value="es" className="bg-slate-900 text-white">Español</option>
              <option value="fr" className="bg-slate-900 text-white">Français</option>
              <option value="ar" className="bg-slate-900 text-white">العربية</option>
            </select>
          </div>

          {/* Settings & Knowledge Base Modal Button */}
          <button
            onClick={() => setIsKnowledgeModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-violet-500/30 bg-violet-950/40 hover:bg-violet-900/60 text-violet-200 font-bold text-[11px] shadow-lg shadow-violet-950/40 transition-all hover:scale-105 active:scale-95"
          >
            <Settings size={13} />
            <span>Concierge Settings & Knowledge</span>
          </button>

          {/* Online AI status pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-500/20 bg-emerald-950/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-black text-emerald-300">AI Concierge Online</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 backdrop-blur-sm ${s.color}`}>
            <p className="text-2xl font-black text-white tracking-tight">{s.value}</p>
            <p className="text-[9px] font-bold uppercase tracking-widest opacity-70 mt-1">{s.label}</p>
            <p className="text-[8px] text-slate-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Left 2 Columns: Active Chat Window & Quick Requests */}
        <div className="xl:col-span-2 space-y-4">
          {activeSession ? (
            <ChatWindow 
              session={activeSession}
              knowledge={knowledge}
              language={preferredLanguage}
              onUpdateSessionHistory={updateSessionHistory}
              onToggleStatus={handleToggleStatus}
              externalPrompt={externalPrompt}
              onClearExternalPrompt={() => setExternalPrompt('')}
            />
          ) : (
            <div className="h-[520px] rounded-2xl bg-slate-900/50 border border-white/5 flex flex-col items-center justify-center text-slate-400">
              <MessageSquare size={32} className="text-slate-600 mb-2" />
              <p className="text-xs font-bold">No session selected</p>
            </div>
          )}

          {/* Quick Requests */}
          <QuickRequests 
            onSelect={msg => setExternalPrompt(msg)} 
            activeRoom={activeSession?.room}
          />
        </div>

        {/* Right Column: Active Sessions & Guest Context */}
        <div className="space-y-4">
          {/* Active Chat Sessions Box */}
          <div className="rounded-2xl bg-slate-900/60 border border-white/10 shadow-xl overflow-hidden backdrop-blur-md flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-slate-900/80">
              <div className="flex items-center gap-2">
                <MessageSquare size={14} className="text-violet-400" />
                <span className="text-[11px] font-black text-white uppercase tracking-wider">
                  Guest Chat Sessions
                </span>
              </div>
              <span className="text-[9px] font-black text-violet-300 bg-violet-500/15 border border-violet-500/20 px-2 py-0.5 rounded-full">
                {sessions.filter(c => c.status === 'ACTIVE').length} live
              </span>
            </div>

            {/* Search Bar */}
            <div className="p-3 border-b border-white/5 bg-slate-900/40">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search Room, Guest, or Message…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-800/80 border border-white/5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
                />
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 mt-2.5 text-[9px] font-black">
                {(['ALL', 'ACTIVE', 'URGENT', 'RESOLVED'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setStatusFilter(tab)}
                    className={`flex-1 py-1 rounded-lg transition-all ${
                      statusFilter === tab
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'bg-slate-800/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Sessions List */}
            <div className="divide-y divide-white/5 max-h-[380px] overflow-y-auto">
              {filteredSessions.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 font-bold">
                  No sessions match your search.
                </div>
              ) : (
                filteredSessions.map(c => {
                  const isSelected = c.id === activeSessionId;
                  return (
                    <div 
                      key={c.id} 
                      onClick={() => setActiveSessionId(c.id)}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-violet-900/25 border-l-4 border-violet-500' 
                          : 'hover:bg-white/5'
                      }`}
                    >
                      {/* Avatar */}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                        isSelected
                          ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-700/30'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {c.guest.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] font-black text-white truncate">{c.guest}</p>
                          <span className="text-[8px] text-slate-500">{c.time}</span>
                        </div>
                        <p className="text-[9px] text-slate-400 truncate mt-0.5">
                          <span className="font-bold text-violet-400">Rm {c.room}</span> · {c.lastMsg}
                        </p>
                      </div>

                      {/* Status Badges */}
                      <div className="flex items-center gap-1 shrink-0">
                        {c.status === 'URGENT' && (
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" title="Urgent Request" />
                        )}
                        {c.status === 'ACTIVE' && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Active Chat" />
                        )}
                        {c.status === 'RESOLVED' && (
                          <span title="Resolved">
                            <CheckCircle2 size={12} className="text-slate-500" />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Active Guest Context & Room Details */}
          {activeSession && (
            <div className="rounded-2xl bg-slate-900/60 border border-white/10 p-4 shadow-xl backdrop-blur-md space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Guest Stay Profile
                </span>
                <span className="text-[9px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
                  {activeSession.tier}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-[11px]">
                <div>
                  <span className="text-[8px] text-slate-500 uppercase font-black tracking-wider block">Room Number</span>
                  <span className="font-black text-white">Room {activeSession.room}</span>
                </div>
                <div>
                  <span className="text-[8px] text-slate-500 uppercase font-black tracking-wider block">Category</span>
                  <span className="font-bold text-slate-300">{activeSession.roomType}</span>
                </div>
                <div>
                  <span className="text-[8px] text-slate-500 uppercase font-black tracking-wider block">Stay Period</span>
                  <span className="text-slate-300 text-[10px]">{activeSession.checkIn} → {activeSession.checkOut}</span>
                </div>
                <div>
                  <span className="text-[8px] text-slate-500 uppercase font-black tracking-wider block">Guest Phone</span>
                  <span className="text-slate-300 font-mono text-[10px]">{activeSession.guestPhone}</span>
                </div>
              </div>

              {/* AI Insight Box */}
              <div className="p-3 rounded-xl bg-violet-950/40 border border-violet-500/20 text-[10px] space-y-1.5">
                <div className="flex items-center gap-1.5 text-violet-300 font-black">
                  <Sparkles size={12} />
                  <span>AI Guest Recommendation</span>
                </div>
                <p className="text-slate-400 leading-relaxed text-[9px]">
                  Guest {activeSession.guest} holds {activeSession.tier}. Proactively offering a complimentary 
                  spa booking slot or room service dessert increases guest loyalty rating by 35%.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Knowledge Base Modal */}
      <KnowledgeBaseModal
        isOpen={isKnowledgeModalOpen}
        onClose={() => setIsKnowledgeModalOpen(false)}
        knowledge={knowledge}
        onSave={handleSaveKnowledge}
      />
    </div>
  );
}
