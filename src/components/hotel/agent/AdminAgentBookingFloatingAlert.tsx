'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  Handshake,
  Bell,
  Clock,
  CheckCircle2,
  X,
  User,
  Phone,
  Calendar,
  IndianRupee,
  ChevronRight,
  ChevronUp,
  Minus,
  Sparkles,
  Volume2,
  VolumeX,
  ExternalLink,
  ShieldCheck,
  Waves,
  HeartHandshake,
  UtensilsCrossed,
  ChefHat,
  MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';
import {
  playNotificationSound,
  setupAudioUnlock,
  isSoundEnabled,
  setSoundEnabled
} from '@/lib/notification-sound';

interface AgentBooking {
  id: string;
  guestName: string;
  guestPhone?: string | null;
  guestEmail?: string | null;
  guestNationality?: string | null;
  adults: number;
  children: number;
  checkIn: string;
  checkOut: string;
  roomType: string;
  totalAmount: number;
  commission: number;
  commissionPaid: boolean;
  status: string;
  notes?: string | null;
  specialRequests?: string | null;
  includePoolAccess?: boolean;
  includeSpaPackage?: boolean;
  createdAt: string;
  agent: {
    id: string;
    name: string;
    agentCode: string;
    phone: string;
    companyName?: string | null;
    city?: string | null;
    commissionRate?: number;
  };
}

interface RoomOrder {
  id: string;
  orderNo: string;
  roomNumber: string;
  guestName?: string | null;
  status: string;
  totalAmount: number;
  items: Array<{
    id?: string;
    name: string;
    qty: number;
    unitPrice?: number;
    lineTotal?: number;
  }>;
  specialNote?: string;
  serveTiming?: string;
  createdAt: string;
}

interface GuestMessageAlert {
  id: string;
  roomNumber: string;
  guestName: string;
  content: string;
  time: string;
}

export const AdminAgentBookingFloatingAlert: React.FC = () => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [pendingBookings, setPendingBookings] = useState<AgentBooking[]>([]);
  const [pendingOrders, setPendingOrders] = useState<RoomOrder[]>([]);
  const [pendingMessages, setPendingMessages] = useState<GuestMessageAlert[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'messages' | 'agent'>('orders');
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [soundActive, setSoundActive] = useState(true);

  // Track known IDs so only genuinely newly-arrived items ring the bell
  const knownBookingIdsRef = useRef<Set<string>>(new Set());
  const isFirstBookingsLoadRef = useRef(true);

  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const isFirstOrdersLoadRef = useRef(true);

  const knownMessageIdsRef = useRef<Set<string>>(new Set());
  const isFirstMessagesLoadRef = useRef(true);

  useEffect(() => {
    setMounted(true);
    setupAudioUnlock();
    setSoundActive(isSoundEnabled());
  }, []);

  const handleToggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !soundActive;
    setSoundActive(next);
    setSoundEnabled(next);
    if (next) {
      playNotificationSound('agent_booking', 1.3);
      toast.success('🔊 Front Desk Alert Bell Enabled! (Chime Tested)');
    } else {
      toast.info('🔇 Front Desk Bell Muted');
    }
  };

  const fetchPendingBookings = useCallback(async () => {
    try {
      const res = await fetch('/api/hotel/agent-bookings?status=PENDING');
      if (!res.ok) return;

      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const bookings: AgentBooking[] = json.data;

        // Check for newly arrived bookings
        if (!isFirstBookingsLoadRef.current) {
          const newBookings = bookings.filter(b => !knownBookingIdsRef.current.has(b.id));

          if (newBookings.length > 0) {
            playNotificationSound('agent_booking', 1.4);
            setIsExpanded(true);
            setIsDismissed(false);
            setActiveTab('agent');

            const latest = newBookings[0];
            const isGroup = latest.roomType?.includes('[GROUP]') || latest.notes?.includes('[GROUP');

            toast.info(isGroup ? '🛎️ New Agent Group Enquiry Received!' : '🛎️ New Agent Booking Received!', {
              description: `${latest.guestName} (${latest.roomType}) from Agent ${latest.agent?.name || 'Partner'} • ₹${Number(latest.totalAmount).toLocaleString()}`,
              duration: 9000,
              action: {
                label: 'View Booking',
                onClick: () => router.push('/hotel/agent-bookings'),
              },
            });

            const originalTitle = document.title;
            document.title = `(1) 🛎️ New Agent Booking! - Hotel PMS`;
            setTimeout(() => {
              document.title = originalTitle;
            }, 10000);
          }
        }

        bookings.forEach(b => knownBookingIdsRef.current.add(b.id));
        setPendingBookings(bookings);
        isFirstBookingsLoadRef.current = false;
      }
    } catch {}
  }, [router]);

  const fetchPendingOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/hotel/room-service?date=all&status=PENDING');
      if (!res.ok) return;

      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const orders: RoomOrder[] = json.data;

        // Check for newly arrived room orders
        if (!isFirstOrdersLoadRef.current) {
          const newOrders = orders.filter(o => !knownOrderIdsRef.current.has(o.id));

          if (newOrders.length > 0) {
            playNotificationSound('agent_booking', 1.4);
            setIsExpanded(true);
            setIsDismissed(false);
            setActiveTab('orders');

            const latest = newOrders[0];
            const itemsSummary = latest.items?.map(i => `${i.name} x${i.qty}`).join(', ') || 'Room Service Items';

            toast.info(`🛎️ New Room Order — Room ${latest.roomNumber || 'In-House'}!`, {
              description: `${itemsSummary} • ₹${Number(latest.totalAmount).toLocaleString()}`,
              duration: 9000,
              action: {
                label: 'View Orders',
                onClick: () => router.push('/hotel/pos/room-orders'),
              },
            });

            const originalTitle = document.title;
            document.title = `(1) 🛎️ Room ${latest.roomNumber || ''} Order! - Hotel PMS`;
            setTimeout(() => {
              document.title = originalTitle;
            }, 10000);
          }
        }

        orders.forEach(o => knownOrderIdsRef.current.add(o.id));
        setPendingOrders(orders);
        isFirstOrdersLoadRef.current = false;
      }
    } catch {}
  }, [router]);

  const handleNewGuestMessage = useCallback((msg: {
    id: string;
    roomNumber: string;
    guestName: string;
    content: string;
    time?: string;
  }) => {
    if (knownMessageIdsRef.current.has(msg.id)) return;
    knownMessageIdsRef.current.add(msg.id);

    playNotificationSound('agent_booking', 1.4);
    setIsExpanded(true);
    setIsDismissed(false);
    setActiveTab('messages');

    setPendingMessages(prev => {
      if (prev.some(m => m.id === msg.id)) return prev;
      return [{
        id: msg.id,
        roomNumber: String(msg.roomNumber),
        guestName: msg.guestName || `Room ${msg.roomNumber} Guest`,
        content: msg.content,
        time: msg.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }, ...prev];
    });

    toast.info(`💬 New Guest Message — Room ${msg.roomNumber}!`, {
      description: `"${msg.content.slice(0, 60)}" • From ${msg.guestName || 'Guest'}`,
      duration: 9000,
      action: {
        label: 'Open Chat',
        onClick: () => router.push('/hotel/ai-concierge'),
      },
    });

    const originalTitle = document.title;
    document.title = `(1) 💬 Room ${msg.roomNumber} Message! - Hotel PMS`;
    setTimeout(() => {
      document.title = originalTitle;
    }, 10000);
  }, [router]);

  const fetchPendingMessages = useCallback(async () => {
    try {
      const res = await fetch('/api/hotel/ai-concierge');
      if (!res.ok) return;
      const json = await res.json();
      if (json.success && Array.isArray(json.recentGuestMessages)) {
        const msgs = json.recentGuestMessages;

        if (!isFirstMessagesLoadRef.current) {
          const newMsgs = msgs.filter((m: any) => !knownMessageIdsRef.current.has(m.id));
          if (newMsgs.length > 0) {
            newMsgs.forEach((nm: any) => {
              handleNewGuestMessage({
                id: nm.id,
                roomNumber: nm.roomNumber || '101',
                guestName: nm.guest || 'In-House Guest',
                content: nm.content,
                time: nm.time,
              });
            });
          }
        }

        msgs.forEach((m: any) => knownMessageIdsRef.current.add(m.id));
        isFirstMessagesLoadRef.current = false;
      }
    } catch {}
  }, [handleNewGuestMessage]);

  const handleQuickSendStaffReply = async (roomNumber: string, messageText: string, alertId: string) => {
    try {
      await fetch('/api/hotel/ai-concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'STAFF_MESSAGE',
          isStaffReply: true,
          roomNumber,
          message: messageText,
          senderName: 'Front Desk Associate',
        }),
      });

      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const channel = new BroadcastChannel('concierge_chat_channel');
        channel.postMessage({
          type: 'STAFF_REPLY',
          room: String(roomNumber),
          roomNumber: String(roomNumber),
          message: messageText,
          senderName: 'Front Desk Associate',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
        setTimeout(() => channel.close(), 1000);
      }

      playNotificationSound('success');
      toast.success(`✅ Reply sent to Room ${roomNumber}!`);
      setPendingMessages(prev => prev.filter(m => m.id !== alertId));
    } catch (err) {
      toast.error('Failed to send reply');
    }
  };

  useEffect(() => {
    fetchPendingBookings();
    fetchPendingOrders();
    fetchPendingMessages();

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'hotel_room_service_order_placed') {
        fetchPendingOrders();
      }
    };
    window.addEventListener('storage', handleStorage);

    // BroadcastChannel for instant 0ms guest message alert across tabs!
    let bc: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      bc = new BroadcastChannel('concierge_chat_channel');
      bc.onmessage = (event) => {
        const payload = event.data;
        if (!payload) return;
        if (payload.type === 'GUEST_MESSAGE') {
          handleNewGuestMessage({
            id: `msg-${Date.now()}-${Math.random()}`,
            roomNumber: String(payload.room || payload.roomNumber || '101'),
            guestName: payload.guest || payload.guestName || 'In-House Guest',
            content: payload.content || payload.message || '',
            time: payload.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          });
        }
      };
    }

    const interval = setInterval(() => {
      fetchPendingBookings();
      fetchPendingOrders();
      fetchPendingMessages();
    }, 6000);

    return () => {
      window.removeEventListener('storage', handleStorage);
      if (bc) bc.close();
      clearInterval(interval);
    };
  }, [fetchPendingBookings, fetchPendingOrders, fetchPendingMessages, handleNewGuestMessage]);

  // Adjust default tab when items update
  useEffect(() => {
    if (pendingMessages.length > 0 && pendingOrders.length === 0) {
      setActiveTab('messages');
    } else if (pendingOrders.length > 0 && pendingMessages.length === 0 && pendingBookings.length === 0) {
      setActiveTab('orders');
    } else if (pendingBookings.length > 0 && pendingOrders.length === 0 && pendingMessages.length === 0) {
      setActiveTab('agent');
    }
  }, [pendingOrders.length, pendingBookings.length, pendingMessages.length]);

  // Quick confirm agent booking
  const handleQuickConfirmBooking = async (e: React.MouseEvent, bookingId: string, guestName: string) => {
    e.stopPropagation();
    setActionLoadingId(bookingId);
    try {
      const res = await fetch('/api/hotel/agent-bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: bookingId, status: 'CONFIRMED' }),
      });
      const data = await res.json();
      if (data.success) {
        playNotificationSound('success');
        toast.success(`Booking for ${guestName} confirmed!`);
        setPendingBookings(prev => prev.filter(b => b.id !== bookingId));
      } else {
        toast.error(data.message || 'Failed to confirm booking.');
      }
    } catch {
      toast.error('Network error confirming booking.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Quick accept room service order
  const handleQuickAcceptOrder = async (e: React.MouseEvent, orderId: string, roomNumber: string) => {
    e.stopPropagation();
    setActionLoadingId(orderId);
    try {
      const res = await fetch('/api/hotel/room-service', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: 'PREPARING' }),
      });
      const data = await res.json();
      if (data.success) {
        // Instant 0ms Kitchen Display sync across tabs & windows
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('kds_order_updated', Date.now().toString());
            if ('BroadcastChannel' in window) {
              const kdsChannel = new BroadcastChannel('kds_orders_sync');
              kdsChannel.postMessage({ type: 'ORDER_ACCEPTED', orderId, roomNumber });
              setTimeout(() => kdsChannel.close(), 1000);
            }
          } catch {}
        }

        playNotificationSound('success');
        toast.success(`Room ${roomNumber} order accepted & kitchen notified!`);
        setPendingOrders(prev => prev.filter(o => o.id !== orderId));
      } else {
        toast.error(data.message || 'Failed to accept order.');
      }
    } catch {
      toast.error('Network error accepting order.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const totalCount = pendingBookings.length + pendingOrders.length + pendingMessages.length;

  if (!mounted || totalCount === 0 || isDismissed) {
    return null;
  }

  const latestBooking = pendingBookings[0];
  const latestOrder = pendingOrders[0];
  const latestMessage = pendingMessages[0];

  const content = (
    <div className="fixed bottom-5 right-5 z-[9999] max-w-sm sm:max-w-md w-full animate-in fade-in slide-in-from-bottom-5 duration-300 pointer-events-auto">
      {/* ── MINIMIZED PILL ── */}
      {!isExpanded ? (
        <div
          onClick={() => setIsExpanded(true)}
          className="ml-auto w-fit flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-gradient-to-r from-violet-900/95 via-indigo-900/95 to-slate-900/95 border border-violet-500/50 shadow-2xl backdrop-blur-md cursor-pointer hover:scale-105 transition-all text-white group"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <Bell size={15} className="text-violet-300 group-hover:rotate-12 transition-transform" />
          <span className="text-xs font-black tracking-wide">
            {totalCount} New Alert{totalCount === 1 ? '' : 's'}
            {pendingOrders.length > 0 && ` (${pendingOrders.length} Orders)`}
            {pendingMessages.length > 0 && ` (${pendingMessages.length} Messages)`}
            {pendingBookings.length > 0 && ` (${pendingBookings.length} Agents)`}
          </span>
          <span className="text-[10px] bg-violet-500/30 text-violet-200 px-2 py-0.5 rounded-full font-bold">
            Open
          </span>
        </div>
      ) : (
        /* ── EXPANDED FLOATING NOTIFICATION CARD ── */
        <div className="relative rounded-2xl bg-[#090d19]/95 border-2 border-violet-500/40 shadow-[0_20px_50px_rgba(124,58,237,0.25)] backdrop-blur-xl overflow-hidden text-slate-100 ring-1 ring-white/10">
          
          {/* Top Decorative Glowing Bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-emerald-500 to-indigo-500 animate-pulse" />

          {/* Header */}
          <div className="px-4 py-2.5 bg-violet-950/40 border-b border-violet-500/20 flex items-center justify-between gap-2">
            {/* Tab switchers if multiple types exist */}
            {(Number(pendingOrders.length > 0) + Number(pendingMessages.length > 0) + Number(pendingBookings.length > 0)) > 1 ? (
              <div className="flex items-center gap-1 bg-slate-900/80 p-0.5 rounded-xl border border-slate-700/60 overflow-x-auto no-scrollbar">
                {pendingOrders.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('orders')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
                      activeTab === 'orders'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <UtensilsCrossed size={12} className="text-amber-400" />
                    <span>Orders ({pendingOrders.length})</span>
                  </button>
                )}
                {pendingMessages.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('messages')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
                      activeTab === 'messages'
                        ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <MessageSquare size={12} className="text-violet-400" />
                    <span>Messages ({pendingMessages.length})</span>
                  </button>
                )}
                {pendingBookings.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('agent')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
                      activeTab === 'agent'
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Handshake size={12} className="text-indigo-400" />
                    <span>Enquiries ({pendingBookings.length})</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  activeTab === 'orders' 
                    ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300' 
                    : activeTab === 'messages'
                    ? 'bg-violet-500/20 border border-violet-500/40 text-violet-300'
                    : 'bg-indigo-500/20 border border-indigo-500/40 text-indigo-300'
                }`}>
                  {activeTab === 'orders' ? (
                    <UtensilsCrossed size={14} className="animate-bounce" />
                  ) : activeTab === 'messages' ? (
                    <MessageSquare size={14} className="animate-bounce" />
                  ) : (
                    <Bell size={14} className="animate-bounce" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                      {activeTab === 'orders' 
                        ? 'Room Order Alert' 
                        : activeTab === 'messages'
                        ? 'Guest Message Alert'
                        : (latestBooking?.roomType?.includes('[GROUP]') ? 'Group Enquiry' : 'Agent Booking')}
                    </span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[9px] font-bold border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      LIVE
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {activeTab === 'orders'
                      ? `${pendingOrders.length} active room order awaiting kitchen / prep`
                      : activeTab === 'messages'
                      ? `${pendingMessages.length} active guest message awaiting reply`
                      : `${pendingBookings.length} booking awaiting front-desk confirmation`}
                  </p>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleToggleSound}
                title={soundActive ? 'Sound is ON (Click to mute)' : 'Sound is MUTED (Click to enable)'}
                className={`p-1.5 rounded-lg border transition-all ${
                  soundActive
                    ? 'bg-violet-500/20 border-violet-500/40 text-violet-300 hover:bg-violet-500/30'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {soundActive ? <Volume2 size={13} /> : <VolumeX size={13} />}
              </button>

              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                title="Minimize alert"
                className="p-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <Minus size={13} />
              </button>

              <button
                type="button"
                onClick={() => setIsDismissed(true)}
                title="Dismiss alert"
                className="p-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {/* ── TAB: GUEST CHAT MESSAGES ── */}
          {activeTab === 'messages' && latestMessage && (
            <div className="p-4 space-y-3 animate-in fade-in duration-200">
              {/* Room & Guest Badge Card */}
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-violet-500/10 via-indigo-500/10 to-slate-900 border border-violet-500/30 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-violet-500/20 border border-violet-500/40 flex items-center justify-center text-violet-300 shrink-0 font-black text-xs">
                    💬
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-black">
                        Room {latestMessage.roomNumber}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        #{latestMessage.time}
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold text-slate-200 mt-0.5 truncate">
                      Guest: <span className="text-white font-bold">{latestMessage.guestName}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Status</span>
                  <span className="text-xs font-black text-violet-300">NEW CHAT</span>
                </div>
              </div>

              {/* Message Content Box */}
              <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Guest Inquiry:
                  </span>
                  <span className="text-[9px] text-violet-300 font-medium">
                    {latestMessage.time}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-800/90 border border-violet-500/25 text-xs text-slate-100 font-medium leading-relaxed italic whitespace-pre-line shadow-inner">
                  "{latestMessage.content}"
                </div>

                {/* 1-Click Quick Front Desk Reply Chips */}
                <div className="pt-1 space-y-1">
                  <span className="text-[9px] font-black uppercase tracking-wider text-amber-400 block flex items-center gap-1">
                    <span>⚡ Quick Front Desk Reply:</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      '✅ Housekeeping Sent!',
                      '🍽️ Dining Order Confirmed',
                      '👨‍🔧 Technician on the way',
                      '🛎️ Bellboy Arriving',
                    ].map((replyText, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleQuickSendStaffReply(latestMessage.roomNumber, replyText, latestMessage.id)}
                        className="px-2 py-1 rounded-md bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/30 text-[10px] font-semibold text-amber-200 transition-all hover:scale-105 active:scale-95 shadow-sm cursor-pointer"
                      >
                        {replyText}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    router.push('/hotel/ai-concierge');
                    setIsExpanded(false);
                  }}
                  className="flex-1 h-9 px-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-violet-600/25 active:scale-95 transition-all cursor-pointer"
                >
                  <MessageSquare size={14} />
                  <span>Open Chat & Reply</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPendingMessages((prev) => prev.filter((m) => m.id !== latestMessage.id));
                  }}
                  className="h-9 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white font-bold text-xs flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                  title="Mark handled and dismiss"
                >
                  <span>Dismiss</span>
                  <CheckCircle2 size={13} className="text-emerald-400" />
                </button>
              </div>
            </div>
          )}

          {/* ── TAB 1: ROOM ORDERS ── */}
          {activeTab === 'orders' && latestOrder && (
            <div className="p-4 space-y-3 animate-in fade-in duration-200">
              {/* Room & Order Badge Card */}
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-slate-900 border border-amber-500/30 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0 font-black text-xs">
                    🛎️
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-black">
                        Room {latestOrder.roomNumber || 'Room Order'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        #{latestOrder.orderNo}
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold text-slate-200 mt-0.5 truncate">
                      Guest: <span className="text-white font-bold">{latestOrder.guestName || 'In-House Guest'}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Total</span>
                  <span className="text-sm font-black text-emerald-400">₹{Number(latestOrder.totalAmount || 0).toLocaleString()}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800/80 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Ordered Items:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {latestOrder.items && latestOrder.items.length > 0 ? (
                    latestOrder.items.map((item, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700/80 text-xs font-semibold text-slate-200"
                      >
                        <span>{item.name}</span>
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                          x{item.qty}
                        </span>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">Room Service items</span>
                  )}
                </div>

                {latestOrder.specialNote && (
                  <p className="text-[10.5px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2.5 py-1.5 mt-1 font-medium">
                    📝 <span className="font-semibold">Note:</span> {latestOrder.specialNote}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={actionLoadingId === latestOrder.id}
                  onClick={(e) => handleQuickAcceptOrder(e, latestOrder.id, latestOrder.roomNumber || 'Room')}
                  className="flex-1 h-9 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/25 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <ChefHat size={14} />
                  <span>{actionLoadingId === latestOrder.id ? 'Accepting...' : 'Accept & Send to Kitchen'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    router.push('/hotel/pos/room-orders');
                    setIsExpanded(false);
                  }}
                  className="h-9 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white font-bold text-xs flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                  title="View all room service orders"
                >
                  <span>View All</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}

          {/* ── TAB 2: AGENT BOOKING / GROUP ENQUIRY ── */}
          {activeTab === 'agent' && latestBooking && (
            <div className="p-4 space-y-3 animate-in fade-in duration-200">
              {/* Agent Info Card */}
              <div className="p-2.5 rounded-xl bg-violet-900/20 border border-violet-500/20 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-300 shrink-0">
                    <Handshake size={13} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-white truncate">
                      {latestBooking.agent?.name || 'Travel Agent'}
                      {latestBooking.agent?.companyName ? ` • ${latestBooking.agent.companyName}` : ''}
                    </p>
                    <p className="text-[9px] text-violet-300 font-mono">
                      Code: {latestBooking.agent?.agentCode || 'PORTAL'}
                      {latestBooking.agent?.phone ? ` • Ph: ${latestBooking.agent.phone}` : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Commission</span>
                  <span className="text-xs font-black text-amber-300">₹{Number(latestBooking.commission || 0).toLocaleString()}</span>
                </div>
              </div>

              {/* Guest & Room Details */}
              <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800/80 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-black text-white leading-tight">
                      {latestBooking.guestName}
                    </h4>
                    <p className="text-[11px] font-semibold text-violet-300 mt-0.5">
                      {latestBooking.roomType}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[9px] text-slate-400 block font-semibold uppercase">Total Amount</span>
                    <span className="text-sm font-black text-emerald-400">₹{Number(latestBooking.totalAmount).toLocaleString()}</span>
                  </div>
                </div>

                {/* Stay Dates & Pax */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] text-slate-300">
                  <span className="flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/60">
                    <Calendar size={10} className="text-indigo-400" />
                    {latestBooking.checkIn ? new Date(latestBooking.checkIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''} → {latestBooking.checkOut ? new Date(latestBooking.checkOut).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}
                  </span>
                  <span className="flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/60">
                    <User size={10} className="text-sky-400" />
                    {latestBooking.adults} Adults {latestBooking.children > 0 ? `+ ${latestBooking.children} Kids` : ''}
                  </span>
                  {latestBooking.includePoolAccess && (
                    <span className="flex items-center gap-1 bg-sky-500/15 text-sky-300 px-2 py-0.5 rounded-md border border-sky-500/30 font-bold">
                      <Waves size={10} /> Pool
                    </span>
                  )}
                  {latestBooking.includeSpaPackage && (
                    <span className="flex items-center gap-1 bg-rose-500/15 text-rose-300 px-2 py-0.5 rounded-md border border-rose-500/30 font-bold">
                      <HeartHandshake size={10} /> Spa
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={actionLoadingId === latestBooking.id}
                  onClick={(e) => handleQuickConfirmBooking(e, latestBooking.id, latestBooking.guestName)}
                  className="flex-1 h-9 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/25 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 size={14} />
                  <span>{actionLoadingId === latestBooking.id ? 'Confirming...' : 'Confirm Booking'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    router.push('/hotel/agent-bookings');
                    setIsExpanded(false);
                  }}
                  className="h-9 px-3.5 rounded-xl bg-violet-600/30 hover:bg-violet-600/40 border border-violet-500/40 text-violet-200 hover:text-white font-bold text-xs flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                  title="Open Agent Bookings Portal"
                >
                  <span>View All</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return createPortal(content, document.body);
};
