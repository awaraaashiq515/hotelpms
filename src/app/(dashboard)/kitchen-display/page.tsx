'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Utensils, Clock, RefreshCw, Wifi, Bell, ChefHat,
  Layers, CheckCircle, Play, Send, AlertTriangle,
  User, ArrowRight, Flame, EyeOff, Volume2, VolumeX
} from 'lucide-react';
import { kotsApi, KotTicket } from '@/lib/api/kots';
import { useToast } from '@/components/ui/Toast';
import Link from 'next/link';

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const POLL_INTERVAL = 10; // seconds

const COLUMNS: {
  status: KotTicket['status'];
  label: string;
  next: KotTicket['status'] | null;
  nextLabel: string;
  icon: React.ElementType;
  headerCls: string;
  borderCls: string;
  badgeCls: string;
  btnCls: string;
  bgCls: string;
  dotColor: string;
}[] = [
  {
    status: 'NEW',
    label: 'New Orders',
    next: 'PREPARING',
    nextLabel: 'Accept & Start',
    icon: Flame,
    headerCls: 'bg-pos-primary-dark',
    borderCls: 'border-pos-primary/40',
    badgeCls: 'bg-pos-primary',
    btnCls: 'bg-pos-primary hover:bg-pos-primary-dark shadow-pos-primary/40',
    bgCls: 'bg-pos-primary/5',
    dotColor: 'bg-pos-primary',
  },
  {
    status: 'PREPARING',
    label: 'In Kitchen',
    next: 'READY',
    nextLabel: 'Mark Ready',
    icon: ChefHat,
    headerCls: 'bg-orange-700',
    borderCls: 'border-orange-500/40',
    badgeCls: 'bg-orange-600',
    btnCls: 'bg-orange-600 hover:bg-orange-500 shadow-orange-800/40',
    bgCls: 'bg-orange-950/40',
    dotColor: 'bg-orange-400',
  },
  {
    status: 'READY',
    label: 'Ready to Serve',
    next: 'SERVED',
    nextLabel: 'Mark Served',
    icon: Bell,
    headerCls: 'bg-emerald-700',
    borderCls: 'border-emerald-500/40',
    badgeCls: 'bg-emerald-600',
    btnCls: 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-800/40',
    bgCls: 'bg-emerald-950/40',
    dotColor: 'bg-emerald-400',
  },
  {
    status: 'SERVED',
    label: 'Served',
    next: null,
    nextLabel: '',
    icon: CheckCircle,
    headerCls: 'bg-slate-700',
    borderCls: 'border-slate-600/30',
    badgeCls: 'bg-slate-600',
    btnCls: '',
    bgCls: 'bg-slate-900/30',
    dotColor: 'bg-slate-500',
  },
];

// ─── UTILS ────────────────────────────────────────────────────────────────────
function getAgeSeconds(createdAt: string) {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
}

function getWaitMinutes(createdAt: string) {
  return Math.floor(getAgeSeconds(createdAt) / 60);
}

function getUrgency(minutes: number): 'low' | 'medium' | 'high' {
  if (minutes >= 20) return 'high';
  if (minutes >= 10) return 'medium';
  return 'low';
}

const URGENCY_STYLES = {
  low: 'text-emerald-400 bg-emerald-900/40 border-emerald-700/30',
  medium: 'text-orange-400 bg-orange-900/40 border-orange-700/30',
  high: 'text-red-400 bg-red-900/40 border-red-700/30 animate-pulse',
};

const ITEM_STATUS_DOT: Record<string, string> = {
  NEW: 'bg-pos-primary',
  PREPARING: 'bg-orange-400',
  READY: 'bg-emerald-400',
  SERVED: 'bg-slate-500',
  CANCELLED: 'bg-red-500',
};

const AUTO_ACCEPT_OPTIONS = [
  { label: 'Manual', value: 0 },
  { label: '5s', value: 5 },
  { label: '30s', value: 30 },
  { label: '1m', value: 60 },
  { label: '2m', value: 120 },
  { label: '5m', value: 300 },
];

const AUTO_READY_OPTIONS = [
  { label: 'Manual', value: 0 },
  { label: '5m', value: 300 },
  { label: '10m', value: 600 },
  { label: '15m', value: 900 },
  { label: '20m', value: 1200 },
  { label: '30m', value: 1800 },
];

// ─── SERVED HIDE OPTIONS ──────────────────────────────────────────────────────
// value = minutes after which served order is hidden; 0 = keep all day; -1 = today only (no timer)
const SERVED_HIDE_OPTIONS = [
  { label: 'All Day', value: 0 },       // show served all day, next day hide
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
  { label: '4 hours', value: 240 },
];

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function KitchenDisplayPage() {
  const { showToast } = useToast();
  const [kots, setKots] = useState<KotTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(POLL_INTERVAL);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  // Voice Settings
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const prevKotsRef = useRef<KotTicket[]>([]);
  const initialLoadRef = useRef(true);

  // Auto-Accept Settings
  const [autoAcceptTime, setAutoAcceptTime] = useState<number>(0); // 0 = Manual
  // Auto-Ready Settings
  const [autoReadyTime, setAutoReadyTime] = useState<number>(0); // 0 = Manual
  // Served-Hide Settings (minutes; 0 = show all day, hide next day only)
  const [servedHideMinutes, setServedHideMinutes] = useState<number>(0);

  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');
  const [language, setLanguage] = useState<'en' | 'pa'>('en');

  // Load settings from localStorage
  useEffect(() => {
    const savedAccept = localStorage.getItem('kds_auto_accept_time');
    if (savedAccept) setAutoAcceptTime(parseInt(savedAccept, 10));
    const savedReady = localStorage.getItem('kds_auto_ready_time');
    if (savedReady) setAutoReadyTime(parseInt(savedReady, 10));
    const savedHide = localStorage.getItem('kds_served_hide_minutes');
    if (savedHide) setServedHideMinutes(parseInt(savedHide, 10));
    const savedVoice = localStorage.getItem('kds_voice_enabled');
    if (savedVoice === 'true') setVoiceEnabled(true);
    const savedVoiceName = localStorage.getItem('kds_selected_voice');
    if (savedVoiceName) setSelectedVoiceName(savedVoiceName);
    const savedLang = localStorage.getItem('kds_language');
    if (savedLang === 'pa' || savedLang === 'en') setLanguage(savedLang);
  }, []);

  // Load system voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      
      // Default to first English voice if none selected
      if (!selectedVoiceName && availableVoices.length > 0) {
        const defaultVoice = availableVoices.find(v => v.lang.startsWith('en')) || availableVoices[0];
        setSelectedVoiceName(defaultVoice.name);
      }
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [selectedVoiceName]);

  const handleAutoAcceptChange = (val: number) => {
    setAutoAcceptTime(val);
    localStorage.setItem('kds_auto_accept_time', val.toString());
    showToast(`Auto-Accept: ${val === 0 ? 'Disabled' : `${val}s`}`, 'success');
  };

  const handleAutoReadyChange = (val: number) => {
    setAutoReadyTime(val);
    localStorage.setItem('kds_auto_ready_time', val.toString());
    const label = AUTO_READY_OPTIONS.find(o => o.value === val)?.label || 'Manual';
    showToast(`Auto-Ready: ${label}`, 'success');
  };

  const handleServedHideChange = (val: number) => {
    setServedHideMinutes(val);
    localStorage.setItem('kds_served_hide_minutes', val.toString());
    const label = SERVED_HIDE_OPTIONS.find(o => o.value === val)?.label || 'All Day';
    showToast(`Served Hide: ${label}`, 'success');
  };

  const playVoice = useCallback((text: string) => {
    if (!voiceEnabled) return;
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      
      // Set language for the utterance
      if (language === 'pa') {
        utterance.lang = 'hi-IN'; // Most engines use Hindi voice for Punjabi text if pa-IN is missing
      } else {
        utterance.lang = 'en-US';
      }
      
      const voice = voices.find(v => v.name === selectedVoiceName);
      if (voice) {
        utterance.voice = voice;
        // If we found a voice, use its specific language
        utterance.lang = voice.lang;
      }
      
      // Fix for Chrome garbage collection bug that stops speech early
      const w = window as any;
      w._utterances = w._utterances || [];
      w._utterances.push(utterance);
      utterance.onend = () => {
        const index = w._utterances.indexOf(utterance);
        if (index > -1) w._utterances.splice(index, 1);
      };

      window.speechSynthesis.speak(utterance);
    }
  }, [voiceEnabled, voices, selectedVoiceName, language]);

  const handleVoiceChange = (name: string) => {
    setSelectedVoiceName(name);
    localStorage.setItem('kds_selected_voice', name);
    
    // Play test sound
    if ('speechSynthesis' in window) {
      const voice = voices.find(v => v.name === name);
      const testText = language === 'pa' ? "ਆਵਾਜ਼ ਸੈੱਟ ਹੋ ਗਈ ਹੈ" : "Voice Selected";
      const utterance = new SpeechSynthesisUtterance(testText);
      if (voice) utterance.voice = voice;
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'pa' : 'en';
    setLanguage(newLang);
    localStorage.setItem('kds_language', newLang);
    
    // Auto-select a suitable voice if switching to Punjabi
    if (newLang === 'pa') {
      const paVoice = voices.find(v => v.lang.includes('pa') || v.lang.includes('hi'));
      if (paVoice) {
        setSelectedVoiceName(paVoice.name);
        localStorage.setItem('kds_selected_voice', paVoice.name);
      }
    }
    
    showToast(`Language set to ${newLang === 'pa' ? 'Punjabi' : 'English'}`, 'success');
  };

  const toggleVoice = () => {
    const newVal = !voiceEnabled;
    setVoiceEnabled(newVal);
    localStorage.setItem('kds_voice_enabled', String(newVal));
    if (newVal) {
      showToast('Voice notifications enabled', 'success');
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance("Voice enabled");
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
      }
    } else {
      showToast('Voice notifications disabled', 'success');
    }
  };

  // Effect for voice notifications
  useEffect(() => {
    if (initialLoadRef.current) {
      if (!loading) {
        prevKotsRef.current = kots;
        initialLoadRef.current = false;
      }
      return;
    }

    const prevMap = new Map(prevKotsRef.current.map(k => [k.id, k.status]));
    const newOrdersList: any[] = [];
    const statusChanges: { kotNo: string, status: string, itemsString: string }[] = [];

    kots.forEach(kot => {
      const prevStatus = prevMap.get(kot.id);
      
      const activeItems = kot.items ? kot.items.filter((i: any) => i.status !== 'CANCELLED') : [];
      let itemsString = activeItems.map((i: any) => {
        const name = i.product?.name || i.itemName || 'Unknown Item';
        const qty = i.quantity || 1;
        return `${qty} ${name}`;
      }).join(', and ');

      if (!itemsString) {
        itemsString = "some items";
      }

      if (!prevStatus) {
        if (kot.status === 'NEW') {
          newOrdersList.push({ ...kot, itemsString });
        }
      } else if (prevStatus !== kot.status) {
        statusChanges.push({ kotNo: kot.kotNo, status: kot.status, itemsString });
      }
    });

    if (newOrdersList.length > 0) {
      if (newOrdersList.length === 1) {
        let textToSay = "";
        if (language === 'pa') {
          textToSay = `ਧਿਆਨ ਦਿਓ! ਨਵਾਂ ਆਰਡਰ ਆਇਆ ਹੈ: ${newOrdersList[0].itemsString}`;
        } else {
          textToSay = `Attention! New order received for ${newOrdersList[0].itemsString}`;
        }
        console.log('Voice Announcing:', textToSay);
        playVoice(textToSay);
      } else {
        let textToSay = "";
        if (language === 'pa') {
          textToSay = `ਧਿਆਨ ਦਿਓ! ${newOrdersList.length} ਨਵੇਂ ਆਰਡਰ ਆਏ ਹਨ।`;
        } else {
          textToSay = `Attention! ${newOrdersList.length} new orders received`;
        }
        console.log('Voice Announcing:', textToSay);
        playVoice(textToSay);
        newOrdersList.forEach(kot => {
          const itemText = language === 'pa' ? `ਆਰਡਰ ਵਿੱਚ ${kot.itemsString} ਹਨ` : `Order has ${kot.itemsString}`;
          playVoice(itemText);
        });
      }
    }

    statusChanges.forEach(change => {
      let statusText = "";
      if (language === 'pa') {
        statusText = change.status === 'PREPARING' ? 'ਕਿਚਨ ਵਿੱਚ' 
                   : change.status === 'READY' ? 'ਤਿਆਰ ਹੈ' 
                   : change.status === 'SERVED' ? 'ਸਰਵ ਹੋ ਗਿਆ' 
                   : change.status;
      } else {
        statusText = change.status === 'PREPARING' ? 'In Kitchen' 
                   : change.status === 'READY' ? 'Ready to Serve' 
                   : change.status === 'SERVED' ? 'Served' 
                   : change.status;
      }
      
      const updateText = language === 'pa' ? `Update: ${change.itemsString} ${statusText}` : `Update: ${statusText} for ${change.itemsString}`;
      console.log('Voice Announcing:', updateText);
      playVoice(updateText);
    });

    prevKotsRef.current = kots;
  }, [kots, loading, playVoice, language]);

  // ─── Filter helper for SERVED orders ──────────────────────────────────────
  // - Always hide SERVED orders from previous days (today only on KDS)
  // - If servedHideMinutes > 0, also hide after that many minutes post-serving
  const filterServedOrders = useCallback((data: KotTicket[]): KotTicket[] => {
    const hideMinutes = parseInt(localStorage.getItem('kds_served_hide_minutes') || '0', 10);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    return data.filter((k) => {
      if (!['NEW', 'PREPARING', 'READY', 'SERVED'].includes(k.status)) return false;
      if (k.status !== 'SERVED') return true;

      // Must be from today
      const servedAt = new Date(k.updatedAt || k.createdAt);
      if (servedAt < todayStart) return false;

      // If a hide timer is set, check elapsed time since updatedAt
      if (hideMinutes > 0) {
        const minutesElapsed = (Date.now() - servedAt.getTime()) / 60000;
        if (minutesElapsed >= hideMinutes) return false;
      }

      return true;
    });
  }, []);

  const fetchKots = useCallback(async (silent = true) => {
    if (!silent) setRefreshing(true);
    try {
      const data = await kotsApi.list();
      const active = filterServedOrders(data || []);
      setKots(active);
      setLastRefresh(new Date());
    } catch {
      // silent fail on auto-poll
    } finally {
      if (!silent) {
        setRefreshing(false);
      }
      setLoading(false);
    }
  }, [filterServedOrders]);

  const handleStatusUpdate = async (kotId: string, nextStatus: KotTicket['status']) => {
    // Prevent double updates
    if (updatingIds.has(kotId)) return;

    setUpdatingIds((prev) => new Set(prev).add(kotId));
    try {
      await kotsApi.updateStatus(kotId, nextStatus);
      showToast(`Updated → ${nextStatus}`, 'success');
      fetchKots(true);
    } catch {
      showToast('Update failed', 'error');
    } finally {
      setUpdatingIds((prev) => {
        const s = new Set(prev);
        s.delete(kotId);
        return s;
      });
    }
  };

  const startCountdown = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setCountdown(POLL_INTERVAL);

    countdownRef.current = setInterval(() => {
      // 1. Update countdown
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchKots(true);
          return POLL_INTERVAL;
        }
        return prev - 1;
      });

      // 2. Check for auto-accept and auto-ready
      setKots(currentKots => {
        const acceptSettingsTime = parseInt(localStorage.getItem('kds_auto_accept_time') || '0', 10);
        const readySettingsTime = parseInt(localStorage.getItem('kds_auto_ready_time') || '0', 10);

        currentKots.forEach(kot => {
          // Auto Accept
          if (acceptSettingsTime > 0 && kot.status === 'NEW') {
            if (getAgeSeconds(kot.createdAt) >= acceptSettingsTime) {
              handleStatusUpdate(kot.id, 'PREPARING');
            }
          }
          // Auto Ready
          if (readySettingsTime > 0 && kot.status === 'PREPARING') {
            // Use updatedAt for ready timer if available, otherwise createdAt
            if (getAgeSeconds(kot.updatedAt || kot.createdAt) >= readySettingsTime) {
              handleStatusUpdate(kot.id, 'READY');
            }
          }
        });
        return currentKots;
      });

      // 3. Re-apply served hide filter every tick (so cards disappear on schedule)
      setKots(currentKots => filterServedOrders(currentKots));
    }, 1000);
  }, [fetchKots, filterServedOrders]);

  useEffect(() => {
    setMounted(true);
    fetchKots(false);
    startCountdown();
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const handleManualRefresh = () => {
    fetchKots(false);
    startCountdown();
  };

  const handleItemStatus = async (kotId: string, itemId: string, nextStatus: string) => {
    try {
      await kotsApi.updateItemStatus(kotId, itemId, nextStatus);
      fetchKots(true);
    } catch {
      showToast('Item update failed', 'error');
    }
  };

  const totalActive = kots.filter((k) => k.status !== 'SERVED').length;

  // ─── Column sort ───────────────────────────────────────────────────────────
  // NEW column: newest first (so new order appears at top)
  // All other columns: oldest first (kitchen works top-to-bottom)
  function getSortedColKots(status: KotTicket['status'], allKots: KotTicket[]) {
    const filtered = allKots.filter((k) => k.status === status);
    if (status === 'NEW') {
      return [...filtered].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    return [...filtered].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }

  return (
    <div className="-m-6 lg:-m-8 min-h-[calc(100vh-64px)] bg-[#080d1a] text-white flex flex-col overflow-hidden">

      {/* ── TOP BAR ───────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-[#0c1221]">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pos-primary to-pos-primary-dark flex items-center justify-center shadow-lg">
            <Utensils size={19} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black uppercase tracking-[0.15em] leading-none">
              Kitchen Display
            </h1>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-0.5">
              {totalActive} active · {kots.filter((k) => k.status === 'SERVED').length} served today
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap justify-end">

          {/* Auto Accept Settings */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-pos-primary/10 rounded-xl border border-pos-primary/20">
            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase tracking-widest text-pos-primary">Auto Accept</span>
              <select
                value={autoAcceptTime}
                onChange={(e) => handleAutoAcceptChange(parseInt(e.target.value, 10))}
                className="bg-transparent text-[10px] font-black text-white outline-none cursor-pointer focus:text-pos-primary"
              >
                {AUTO_ACCEPT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value} className="bg-slate-900">{opt.label}</option>
                ))}
              </select>
            </div>
            {autoAcceptTime > 0 && (
              <div className="w-1.5 h-1.5 rounded-full bg-pos-primary animate-pulse mt-3" />
            )}
          </div>

          {/* Auto Ready Settings */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 rounded-xl border border-orange-500/20">
            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase tracking-widest text-orange-500">Auto Ready</span>
              <select
                value={autoReadyTime}
                onChange={(e) => handleAutoReadyChange(parseInt(e.target.value, 10))}
                className="bg-transparent text-[10px] font-black text-white outline-none cursor-pointer focus:text-orange-500"
              >
                {AUTO_READY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value} className="bg-slate-900">{opt.label}</option>
                ))}
              </select>
            </div>
            {autoReadyTime > 0 && (
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse mt-3" />
            )}
          </div>

          {/* Served Hide Settings */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/30 rounded-xl border border-slate-600/30">
            <EyeOff size={11} className="text-slate-400 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Served Hide</span>
              <select
                value={servedHideMinutes}
                onChange={(e) => handleServedHideChange(parseInt(e.target.value, 10))}
                className="bg-transparent text-[10px] font-black text-white outline-none cursor-pointer focus:text-slate-300"
              >
                {SERVED_HIDE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value} className="bg-slate-900">{opt.label}</option>
                ))}
              </select>
            </div>
            {servedHideMinutes > 0 && (
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse mt-3" />
            )}
          </div>

          {/* Last refresh */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-slate-800/60 rounded-lg border border-slate-700 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
            <Clock size={10} />
            {mounted && lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>

          {/* Live dot */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-800/60 rounded-lg border border-slate-700">
            <Wifi size={11} className="text-emerald-400" />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Live</span>
          </div>

          {/* Countdown ring */}

          <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/60 rounded-lg border border-slate-700">
            <div className="relative w-5 h-5">
              <svg viewBox="0 0 24 24" className="w-5 h-5 -rotate-90">
                <circle cx="12" cy="12" r="10" fill="none" stroke="#1e293b" strokeWidth="3" />
                <circle
                  cx="12" cy="12" r="10"
                  fill="none" stroke="#e8a0a0" strokeWidth="3"
                  strokeDasharray={62.83}
                  strokeDashoffset={62.83 * (1 - countdown / POLL_INTERVAL)}
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <span className="text-[11px] font-black text-slate-400 tabular-nums w-5">{countdown}s</span>
          </div>

          {/* Voice Settings */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
            <Volume2 size={11} className="text-indigo-400 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase tracking-widest text-indigo-400">Select Voice</span>
              <select
                value={selectedVoiceName}
                onChange={(e) => handleVoiceChange(e.target.value)}
                className="bg-transparent text-[10px] font-black text-white outline-none cursor-pointer focus:text-indigo-400 w-24 truncate"
              >
                {voices.map((v, i) => (
                  <option key={i} value={v.name} className="bg-slate-900">
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Voice Toggle button */}
          <button
            onClick={toggleVoice}
            className={`p-2.5 rounded-lg border transition-all ${
              voiceEnabled 
                ? 'bg-pos-primary/10 border-pos-primary/30 text-pos-primary' 
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
            }`}
            title={voiceEnabled ? 'Disable Voice Alerts' : 'Enable Voice Alerts'}
          >
            {voiceEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>

          {/* Refresh button */}
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-all disabled:opacity-50"
            title="Refresh Now"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin text-pos-primary' : 'text-slate-400'} />
          </button>
        </div>
      </div>

      {/* ── COLUMNS ───────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <RefreshCw size={40} className="animate-spin text-pos-primary mx-auto" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">
              Syncing Kitchen…
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-2 xl:grid-cols-4 gap-0 min-h-0 overflow-hidden">
          {COLUMNS.map((col) => {
            const ColIcon = col.icon;
            const colKots = getSortedColKots(col.status, kots);

            return (
              <div key={col.status} className={`flex flex-col border-r border-slate-800 last:border-r-0 ${col.bgCls}`}>

                {/* Column Header */}
                <div className={`shrink-0 ${col.headerCls} px-4 py-3 flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <ColIcon size={16} className="text-white/80" />
                    <span className="text-sm font-black uppercase tracking-wider text-white">
                      {col.label}
                    </span>
                    {col.status === 'NEW' && colKots.length > 0 && (
                      <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-white/20 text-white rounded-full animate-pulse">
                        NEW↑
                      </span>
                    )}
                  </div>
                  <span className="text-2xl font-black text-white/90 tabular-nums">
                    {colKots.length}
                  </span>
                </div>

                {/* KOT Cards */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3 no-scrollbar">
                  {colKots.length === 0 && (
                    <div className="flex items-center justify-center h-32">
                      <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
                        No tickets
                      </p>
                    </div>
                  )}

                  {colKots.map((kot) => {
                    const waitMin = getWaitMinutes(kot.createdAt);
                    const urgency = getUrgency(waitMin);
                    const isUpdating = updatingIds.has(kot.id);
                    const activeItems = kot.items.filter((i) => i.status !== 'CANCELLED');
                    const readyItems = activeItems.filter((i) => i.status === 'READY' || i.status === 'SERVED');
                    const allReady = activeItems.length > 0 && readyItems.length === activeItems.length;
                    const source = kot.tableNo
                      ? `Table ${kot.tableNo}`
                      : kot.order?.tableNo
                      ? `Table ${kot.order.tableNo}`
                      : kot.roomId
                      ? `Room ${kot.roomId}`
                      : kot.order?.orderType || 'Takeaway';

                    return (
                      <div
                        key={kot.id}
                        className={`bg-slate-800/80 border-2 rounded-2xl overflow-hidden transition-all ${col.borderCls} ${isUpdating ? 'opacity-60' : ''}`}
                      >
                        {/* Card Header */}
                        <div className="px-4 py-3 border-b border-slate-700/50 flex items-start gap-2">
                          <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${col.dotColor}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-black tracking-tight">{kot.kotNo}</span>
                              {allReady && col.status === 'PREPARING' && (
                                <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-emerald-700 text-white rounded-full">
                                  All Ready!
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                {source}
                              </span>
                              {kot.order?.orderType && (
                                <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-slate-700 text-slate-400 rounded">
                                  {kot.order.orderType}
                                </span>
                              )}
                            </div>
                          </div>
                          {/* Wait time badge */}
                          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[9px] font-black shrink-0 ${URGENCY_STYLES[urgency]}`}>
                            {urgency === 'high' && <AlertTriangle size={9} />}
                            <Clock size={9} />
                            {waitMin}m
                          </div>
                        </div>

                        {/* Items */}
                        <div className="px-4 py-3 space-y-2 max-h-[260px] overflow-y-auto no-scrollbar">
                          {activeItems.map((item) => {
                            const itemDone = item.status === 'READY' || item.status === 'SERVED';
                            const nextItemStatus =
                              item.status === 'NEW' ? 'PREPARING'
                              : item.status === 'PREPARING' ? 'READY'
                              : null;

                            return (
                              <div key={item.id} className={`flex items-start gap-2 group ${itemDone ? 'opacity-50' : ''}`}>
                                {/* Item status dot */}
                                <button
                                  disabled={!nextItemStatus || col.status === 'SERVED'}
                                  onClick={() => nextItemStatus && handleItemStatus(kot.id, item.id, nextItemStatus)}
                                  className={`w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                                    itemDone
                                      ? 'border-emerald-500 bg-emerald-900/50'
                                      : 'border-slate-600 hover:border-orange-400 bg-transparent cursor-pointer'
                                  }`}
                                  title={nextItemStatus ? `Mark ${nextItemStatus}` : undefined}
                                >
                                  {itemDone && <CheckCircle size={11} className="text-emerald-400" />}
                                </button>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-baseline gap-2">
                                    <span className="text-base font-black text-white tabular-nums shrink-0">
                                      {item.quantity}×
                                    </span>
                                    <span className={`text-sm font-bold text-gray-200 leading-snug ${itemDone ? 'line-through text-slate-500' : ''}`}>
                                      {item.product?.name || item.itemName}
                                    </span>
                                  </div>
                                  {item.notes && (
                                    <p className="text-[10px] text-orange-400 font-bold italic mt-0.5 leading-tight">
                                      ⚠ {item.notes}
                                    </p>
                                  )}
                                </div>

                                {/* Item status tag */}
                                <div className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${ITEM_STATUS_DOT[item.status] || 'bg-slate-500'}`} />
                              </div>
                            );
                          })}
                        </div>

                        {/* Captain + Action Footer */}
                        <div className="px-4 pt-2 pb-3 border-t border-slate-700/50 space-y-2">
                          {/* Captain info */}
                          {(kot.createdBy || (kot as any).order?.createdBy) && (
                            <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                              <User size={9} />
                              {kot.createdBy || (kot as any).order?.createdBy}
                            </div>
                          )}

                          {/* Item progress bar */}
                          {activeItems.length > 0 && (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                  style={{ width: `${(readyItems.length / activeItems.length) * 100}%` }}
                                />
                              </div>
                              <span className="text-[8px] font-black text-slate-500">
                                {readyItems.length}/{activeItems.length}
                              </span>
                            </div>
                          )}

                          {/* Action button */}
                          {col.next && (
                            <button
                              disabled={isUpdating}
                              onClick={() => handleStatusUpdate(kot.id, col.next!)}
                              className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[11px] text-white transition-all active:scale-95 shadow-lg disabled:opacity-40 ${col.btnCls}`}
                            >
                              {col.status === 'NEW' && <Play size={14} fill="currentColor" />}
                              {col.status === 'PREPARING' && <CheckCircle size={14} />}
                              {col.status === 'READY' && <Send size={14} />}
                              {col.nextLabel}
                              <ArrowRight size={12} className="opacity-60" />
                            </button>
                          )}

                          {/* View link */}
                          <Link
                            href={`/kots/${kot.id}`}
                            className="block text-center text-[8px] font-black uppercase tracking-[0.2em] text-slate-700 hover:text-slate-500 transition-colors"
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── ALL CLEAR ─────────────────────────────────────────────── */}
      {!loading && kots.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center space-y-4">
            <div className="w-24 h-24 rounded-[2rem] bg-slate-800/60 border-2 border-slate-700 flex items-center justify-center mx-auto">
              <Layers size={44} className="text-slate-700" />
            </div>
            <h2 className="text-xl font-black text-slate-600 uppercase tracking-widest">
              Kitchen Clear
            </h2>
            <p className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">
              No active orders
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
