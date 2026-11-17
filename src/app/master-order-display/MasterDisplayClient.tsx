'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast, Toaster } from 'sonner';
import {
  playNotificationSound, setupAudioUnlock, isSoundEnabled, setSoundEnabled
} from '@/lib/notification-sound';
import {
  MasterTicket, MasterDisplayStats, StaffSummary, DispatchLogItem, SourceCategory, ViewMode
} from './components/types';
import { MasterDisplayHeader } from './components/MasterDisplayHeader';
import { MasterDisplayFilterBar } from './components/MasterDisplayFilterBar';
import { DualSplitView } from './components/DualSplitView';
import { SplitDepartmentView } from './components/SplitDepartmentView';
import { KanbanWorkflowView } from './components/KanbanWorkflowView';
import { MasterOrderCard } from './components/MasterOrderCard';
import { Utensils, RefreshCw, AlertTriangle } from 'lucide-react';

const POLL_INTERVAL = 6; // seconds

interface MasterDisplayClientProps {
  propertyCode?: string;
  initialPropertyName?: string;
}

export default function MasterDisplayClient({
  propertyCode = '',
  initialPropertyName = '',
}: MasterDisplayClientProps) {
  // Main Data States
  const [tickets, setTickets] = useState<MasterTicket[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffSummary[]>([]);
  const [dispatchLogs, setDispatchLogs] = useState<DispatchLogItem[]>([]);
  const [stats, setStats] = useState<MasterDisplayStats>({
    totalActive: 0,
    roomServiceCount: 0,
    restaurantCount: 0,
    barCount: 0,
    takeawayCount: 0,
    newCount: 0,
    preparingCount: 0,
    readyCount: 0,
    servedCount: 0,
    avgWaitMinutes: 0,
    totalStaffOnDuty: 0,
    staffDeliveringCount: 0,
  });
  const [propertyName, setPropertyName] = useState(initialPropertyName);
  const [resolvedPropertyCode, setResolvedPropertyCode] = useState(propertyCode);

  // View & Filter States (Default to DUAL_SPLIT as requested: "2 bar chalne chahiye aadhe aadhe: Room + Staff")
  const [viewMode, setViewMode] = useState<ViewMode>('DUAL_SPLIT');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | SourceCategory>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'ALL' | 'NEW' | 'PREPARING' | 'READY' | 'SERVED'>('ACTIVE');
  const [searchTerm, setSearchTerm] = useState('');

  // Audio & Fullscreen
  const [soundOn, setSoundOn] = useState(true);
  const [voiceOn, setVoiceOn] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Operational States
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(POLL_INTERVAL);
  const [updatingKotId, setUpdatingKotId] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // Audio & Change detection refs
  const prevTicketIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);

  // 1. Setup Audio & Load Preferences
  useEffect(() => {
    setupAudioUnlock();
    setSoundOn(isSoundEnabled());

    const savedView = localStorage.getItem('master_display_view') as ViewMode | null;
    if (savedView && ['DUAL_SPLIT', 'SPLIT', 'KANBAN', 'GRID'].includes(savedView)) {
      setViewMode(savedView);
    }

    const savedVoice = localStorage.getItem('master_display_voice_enabled');
    if (savedVoice) {
      setVoiceOn(savedVoice === 'true');
    }
  }, []);

  const handleToggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) playNotificationSound('ding');
  };

  const handleToggleVoice = () => {
    const next = !voiceOn;
    setVoiceOn(next);
    localStorage.setItem('master_display_voice_enabled', next ? 'true' : 'false');
    if (next) announceSpeech('Voice announcement enabled for Master Order Display');
  };

  const handleChangeViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('master_display_view', mode);
  };

  // Fullscreen Handler
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.warn('Fullscreen request failed:', err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false);
        }).catch(() => {});
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Voice Announcement helper
  const announceSpeech = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      const voices = window.speechSynthesis.getVoices();
      const engVoice = voices.find((v) => v.lang.startsWith('en')) || voices[0];
      if (engVoice) utterance.voice = engVoice;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis failed:', e);
    }
  };

  // 2. Fetch Tickets & Staff
  const fetchOrders = useCallback(async (manual = false) => {
    try {
      if (manual) setIsRefreshing(true);

      const params = new URLSearchParams();
      if (resolvedPropertyCode) params.set('propertyCode', resolvedPropertyCode);
      params.set('status', statusFilter);
      params.set('category', categoryFilter);
      if (searchTerm) params.set('search', searchTerm);

      const res = await fetch(`/api/master-display/orders?${params.toString()}`);
      const data = await res.json();

      if (data.success && data.data) {
        const incomingTickets: MasterTicket[] = data.data.tickets || [];
        setTickets(incomingTickets);
        if (data.data.staffMembers) setStaffMembers(data.data.staffMembers);
        if (data.data.dispatchLogs) setDispatchLogs(data.data.dispatchLogs);
        if (data.data.stats) setStats(data.data.stats);

        if (data.data.property) {
          if (!propertyName && data.data.property.name) {
            setPropertyName(data.data.property.name);
          }
          if (!resolvedPropertyCode && data.data.property.code) {
            setResolvedPropertyCode(data.data.property.code);
          }
        }

        // Check for new tickets
        if (!isInitialLoadRef.current && incomingTickets.length > 0) {
          const freshTickets = incomingTickets.filter(
            (t) => t.status === 'NEW' && !prevTicketIdsRef.current.has(t.id)
          );

          if (freshTickets.length > 0) {
            playNotificationSound('booking', 1.4);

            const firstFresh = freshTickets[0];
            toast.info(`🔔 New ${firstFresh.sourceBadge} Order!`, {
              description: `KOT #${firstFresh.kotNo} (${firstFresh.items.length} items) arrived.`,
              duration: 5000,
            });

            if (voiceOn) {
              const categoryVoiceText =
                firstFresh.sourceCategory === 'ROOM_SERVICE'
                  ? `New Room Service order for ${firstFresh.sourceBadge}`
                  : firstFresh.sourceCategory === 'BAR'
                  ? `New Bar order for ${firstFresh.sourceBadge}`
                  : `New Restaurant order for ${firstFresh.sourceBadge}`;
              announceSpeech(categoryVoiceText);
            }
          }
        }

        prevTicketIdsRef.current = new Set(incomingTickets.map((t) => t.id));
        isInitialLoadRef.current = false;
      }
    } catch (err) {
      console.error('Failed to fetch master display orders:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      setCountdown(POLL_INTERVAL);
    }
  }, [resolvedPropertyCode, statusFilter, categoryFilter, searchTerm, voiceOn, propertyName]);

  // Initial fetch and polling loop
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchOrders();
          return POLL_INTERVAL;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Item Checkbox Toggle
  const handleToggleCheckItem = (itemId: string) => {
    setCheckedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  // Staff Assignment
  const handleAssignStaff = async (
    kotId: string,
    staffMemberId: string,
    staffName: string
  ) => {
    try {
      // Optimistic update
      setTickets((prev) =>
        prev.map((t) =>
          t.id === kotId
            ? { ...t, assignedStaffId: staffMemberId, assignedStaffName: staffName, serverName: staffName }
            : t
        )
      );

      const res = await fetch('/api/master-display/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kotId,
          staffMemberId,
          staffName,
          remarks: `Assigned to ${staffName} for room delivery`,
        }),
      });

      const data = await res.json();
      if (data.success) {
        playNotificationSound('success', 0.8);
        toast.success(`Order assigned to ${staffName}`);
        fetchOrders(true);
      } else {
        toast.error(data.message || 'Failed to assign staff');
        fetchOrders(true);
      }
    } catch (err) {
      console.error('Error assigning staff:', err);
      toast.error('Network error assigning staff');
      fetchOrders(true);
    }
  };

  // Status Advancement
  const handleUpdateStatus = async (
    kotId: string,
    nextStatus: 'PREPARING' | 'READY' | 'SERVED'
  ) => {
    setUpdatingKotId(kotId);
    try {
      setTickets((prev) =>
        prev.map((t) => (t.id === kotId ? { ...t, status: nextStatus } : t))
      );

      const res = await fetch('/api/master-display/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kotId,
          status: nextStatus,
        }),
      });

      const data = await res.json();
      if (data.success) {
        playNotificationSound('success', 0.8);
        toast.success(`Ticket status updated to ${nextStatus}`);

        if (voiceOn && nextStatus === 'READY') {
          const updated = tickets.find((t) => t.id === kotId);
          if (updated) {
            announceSpeech(`Order for ${updated.sourceBadge} is now ready to serve!`);
          }
        }
        fetchOrders(true);
      } else {
        toast.error(data.message || 'Failed to update status');
        fetchOrders(true);
      }
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Network error updating order status');
      fetchOrders(true);
    } finally {
      setUpdatingKotId(null);
    }
  };

  // Thermal Print KOT
  const handlePrintTicket = (ticket: MasterTicket) => {
    const printWindow = window.open('', '_blank', 'width=380,height=600');
    if (!printWindow) return;

    const itemsHtml = ticket.items
      .map(
        (i) => `
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:14px;">
          <span><strong>${i.quantity}x</strong> ${i.itemName}</span>
          <span>${i.unit || ''}</span>
        </div>
        ${i.notes ? `<div style="font-size:11px;color:#555;margin-left:16px;">* ${i.notes}</div>` : ''}
      `
      )
      .join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>KOT #${ticket.kotNo}</title>
          <style>
            body { font-family: monospace; padding: 12px; margin: 0; color: #000; }
            h2 { margin: 0 0 4px 0; font-size: 18px; text-align: center; }
            .badge { text-align: center; font-size: 16px; font-weight: bold; margin: 8px 0; border: 1px dashed #000; padding: 4px; }
            hr { border: none; border-top: 1px dashed #000; margin: 8px 0; }
          </style>
        </head>
        <body>
          <h2>${propertyName || 'HOTEL PMS'}</h2>
          <div style="text-align:center;font-size:12px;">MASTER KOT #${ticket.kotNo}</div>
          <div class="badge">${ticket.sourceBadge} • ${ticket.sourceCategory}</div>
          <div style="font-size:11px;">
            <div>Location: ${ticket.sourceLocation}</div>
            <div>Time: ${new Date(ticket.createdAt).toLocaleTimeString()}</div>
            ${ticket.guestName ? `<div>Guest: ${ticket.guestName}</div>` : ''}
            ${ticket.assignedStaffName ? `<div>Staff: ${ticket.assignedStaffName}</div>` : ''}
          </div>
          <hr />
          ${itemsHtml}
          <hr />
          <div style="text-align:center;font-size:11px;margin-top:8px;">Total Items: ${ticket.totalItemsCount}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <div className="min-h-screen bg-[#040711] text-white flex flex-col font-sans select-none overflow-hidden">
      <Toaster position="top-right" richColors />

      {/* Top Header */}
      <MasterDisplayHeader
        propertyName={propertyName}
        propertyCode={resolvedPropertyCode}
        viewMode={viewMode}
        onChangeViewMode={handleChangeViewMode}
        soundEnabled={soundOn}
        onToggleSound={handleToggleSound}
        voiceEnabled={voiceOn}
        onToggleVoice={handleToggleVoice}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        onRefresh={() => fetchOrders(true)}
        isRefreshing={isRefreshing}
        countdown={countdown}
      />

      {/* Filter and Stats Bar */}
      <MasterDisplayFilterBar
        categoryFilter={categoryFilter}
        onSelectCategory={setCategoryFilter}
        statusFilter={statusFilter}
        onSelectStatus={setStatusFilter}
        stats={stats}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        viewMode={viewMode}
        onChangeViewMode={handleChangeViewMode}
      />

      {/* Main Board Content */}
      <main className="flex-1 p-3 overflow-hidden">
        {loading ? (
          <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center">
            <RefreshCw size={40} className="text-indigo-500 animate-spin mb-3" />
            <h2 className="text-lg font-bold text-slate-200">Loading Master Orders...</h2>
            <p className="text-xs text-slate-500 mt-1">Connecting to live Room, Restaurant &amp; Bar feed</p>
          </div>
        ) : (
          <>
            {/* 1. DUAL 50/50 SPLIT: ROOM ORDERS + STAFF DISPATCH TRACKER (User Requested Primary View) */}
            {viewMode === 'DUAL_SPLIT' && (
              <DualSplitView
                tickets={tickets}
                staffMembers={staffMembers}
                dispatchLogs={dispatchLogs}
                checkedItems={checkedItems}
                updatingKotId={updatingKotId}
                onToggleCheckItem={handleToggleCheckItem}
                onUpdateStatus={handleUpdateStatus}
                onAssignStaff={handleAssignStaff}
                onPrintTicket={handlePrintTicket}
              />
            )}

            {/* 2. Multi-Department Split View (Rooms | Restaurant | Bar | Takeaway) */}
            {viewMode === 'SPLIT' && (
              <SplitDepartmentView
                tickets={tickets}
                checkedItems={checkedItems}
                updatingKotId={updatingKotId}
                onToggleCheckItem={handleToggleCheckItem}
                onUpdateStatus={handleUpdateStatus}
                onPrintTicket={handlePrintTicket}
              />
            )}

            {/* 3. Status Workflow Pipeline (Kanban) */}
            {viewMode === 'KANBAN' && (
              <KanbanWorkflowView
                tickets={tickets}
                checkedItems={checkedItems}
                updatingKotId={updatingKotId}
                onToggleCheckItem={handleToggleCheckItem}
                onUpdateStatus={handleUpdateStatus}
                onPrintTicket={handlePrintTicket}
              />
            )}

            {/* 4. Master Responsive Grid View */}
            {viewMode === 'GRID' && (
              <div className="h-[calc(100vh-190px)] min-h-[500px] overflow-y-auto pr-1">
                {tickets.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center py-20 text-center opacity-40">
                    <Utensils size={48} className="text-slate-500 mb-3" />
                    <h3 className="text-base font-bold text-slate-200">No Orders in this View</h3>
                    <p className="text-xs text-slate-500 mt-1">Try clearing filters or search term.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {tickets.map((ticket) => (
                      <MasterOrderCard
                        key={ticket.id}
                        ticket={ticket}
                        checkedItems={checkedItems}
                        isUpdating={updatingKotId === ticket.id}
                        onToggleCheckItem={handleToggleCheckItem}
                        onUpdateStatus={handleUpdateStatus}
                        onPrintTicket={handlePrintTicket}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
