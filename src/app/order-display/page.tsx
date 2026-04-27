'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Utensils, Bell, ChefHat, Wifi, Volume2, VolumeX, Settings, X, Clock } from 'lucide-react';

const POLL_INTERVAL = 8; // seconds

export default function OrderDisplayPage() {
  const [kots, setKots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const prevReadyIds = useRef<Set<string>>(new Set());
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');
  const [language, setLanguage] = useState<'en' | 'pa'>('en');
  const [expiryMinutes, setExpiryMinutes] = useState(5);
  const [showSettings, setShowSettings] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/order-display');
      const data = await res.json();
      if (data.success) {
        let newKots = data.data;
        
        // Filter out expired READY orders
        const now = new Date().getTime();
        newKots = newKots.filter((k: any) => {
          if (k.status !== 'READY') return true;
          const updatedTime = new Date(k.updatedAt).getTime();
          return (now - updatedTime) < (expiryMinutes * 60 * 1000);
        });

        // Voice Announcement Logic
        if (voiceEnabled) {
          const readyNow = newKots.filter((k: any) => k.status === 'READY');
          readyNow.forEach((k: any) => {
            if (!prevReadyIds.current.has(k.id)) {
              announceOrder(k.kotNo);
              prevReadyIds.current.add(k.id);
            }
          });
        }
        
        setKots(newKots);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  }, [voiceEnabled, voices, selectedVoiceName, language, expiryMinutes]);

  // Load preferences
  useEffect(() => {
    const savedVoiceName = localStorage.getItem('order_display_voice');
    if (savedVoiceName) setSelectedVoiceName(savedVoiceName);
    const savedLang = localStorage.getItem('order_display_lang');
    if (savedLang === 'pa' || savedLang === 'en') setLanguage(savedLang);
    const savedExpiry = localStorage.getItem('order_display_expiry');
    if (savedExpiry) setExpiryMinutes(parseInt(savedExpiry));
  }, []);

  // Load system voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
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

  const handleVoiceChange = (name: string) => {
    setSelectedVoiceName(name);
    localStorage.setItem('order_display_voice', name);
    
    // Test
    if ('speechSynthesis' in window) {
      const voice = voices.find(v => v.name === name);
      const testText = language === 'pa' ? "Awaaz select ho gayi hai" : "Voice Selected";
      const utterance = new SpeechSynthesisUtterance(testText);
      if (voice) utterance.voice = voice;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleExpiryChange = (val: number) => {
    setExpiryMinutes(val);
    localStorage.setItem('order_display_expiry', val.toString());
  };

  const announceOrder = (kotNo: string) => {
    if (!('speechSynthesis' in window)) return;
    const numberOnly = kotNo.replace(/\D/g, '');
    
    let text = "";
    if (language === 'pa') {
      text = `ਆਰਡਰ ਨੰਬਰ ${numberOnly || kotNo} ਤਿਆਰ ਹੈ, ਕਿਰਪਾ ਕਰਕੇ ਆਪਣਾ ਆਰਡਰ ਲੈ ਲਵੋ।`;
    } else {
      text = `Order number ${numberOnly || kotNo} is now ready for pickup!`;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set language for the utterance
    if (language === 'pa') {
      utterance.lang = 'hi-IN'; // Fallback to Hindi if pa-IN not available
    } else {
      utterance.lang = 'en-US';
    }

    const voice = voices.find(v => v.name === selectedVoiceName);
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    }
    
    utterance.rate = 0.85;
    utterance.pitch = 1.0;
    
    // Fix for Chrome bug
    const w = window as any;
    w._utterances = w._utterances || [];
    w._utterances.push(utterance);
    utterance.onend = () => {
      const index = w._utterances.indexOf(utterance);
      if (index > -1) w._utterances.splice(index, 1);
    };

    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, POLL_INTERVAL * 1000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const preparing = kots.filter(k => k.status === 'NEW' || k.status === 'PREPARING');
  const ready = kots.filter(k => k.status === 'READY');

  const getDisplayName = (kot: any) => {
    const digits = kot.kotNo.replace(/\D/g, '').slice(-4);
    const orderNo = digits || kot.kotNo;
    
    const guestName = kot.order?.guest 
      ? `${kot.order.guest.firstName} ${kot.order.guest.lastName || ''}`.trim()
      : null;
    
    const tableLabel = (kot.tableNo && kot.tableNo !== 'null' && kot.tableNo !== '') ? `Table ${kot.tableNo}` : null;
    
    return {
      primary: orderNo,
      secondary: guestName || tableLabel || 'Walk-in',
      type: guestName ? 'CUSTOMER' : (tableLabel ? 'TABLE' : 'ORDER')
    };
  };

  return (
    <div className="fixed inset-0 bg-[#000000] text-white flex flex-col font-sans overflow-hidden select-none">
      
      {/* HEADER */}
      <header className="h-[10vh] px-[4vw] flex items-center justify-between border-b border-white/10 bg-[#0a0a0c] z-30">
        <div className="flex items-center gap-[2vw]">
          <div className="w-[5vw] h-[5vw] max-w-[60px] max-h-[60px] rounded-[1vw] bg-blue-600 flex items-center justify-center shadow-lg">
            <Utensils className="text-white w-[3vw] h-[3vw] max-w-[32px] max-h-[32px]" />
          </div>
          <div>
            <h1 className="text-[3.5vh] font-black tracking-tight text-white uppercase">Order Status</h1>
            <p className="text-blue-500 text-[1.2vh] font-black uppercase tracking-[0.3em] flex items-center gap-[1vw]">
              <span className="w-[0.8vh] h-[0.8vh] rounded-full bg-blue-500 animate-pulse" />
              Live Sync
            </p>
          </div>
        </div>

        <div className="flex items-center gap-[3vw]">
          <div className="flex flex-col">
            <span className="text-[1.2vh] font-black uppercase tracking-widest text-blue-500 mb-1">Select Voice</span>
            <select
              value={selectedVoiceName}
              onChange={(e) => handleVoiceChange(e.target.value)}
              className="bg-white/5 text-[1.5vh] font-bold text-white border border-white/10 rounded-[0.5vw] px-[1vw] py-[0.5vh] outline-none cursor-pointer hover:bg-white/10 w-[12vw] truncate"
            >
              {voices.map((v, i) => (
                <option key={i} value={v.name} className="bg-[#0a0a0c]">
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>

          <button 
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`flex items-center gap-[1vw] px-[2vw] py-[1.2vh] rounded-[1vw] border-2 transition-all ${
              voiceEnabled 
                ? 'bg-blue-600 border-blue-600 text-white' 
                : 'bg-white/5 border-white/10 text-gray-500 hover:text-gray-300'
            }`}
          >
            {voiceEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
            <span className="text-[1.5vh] font-bold uppercase tracking-wider">Sound</span>
          </button>

          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
          >
            <Settings size={24} />
          </button>
          
          <div className="text-right">
            <div className="text-[4vh] font-black tabular-nums">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      </header>

      {/* SETTINGS MODAL */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
          <div className="bg-[#0a0a0c] border border-white/10 rounded-[2vw] p-8 w-full max-w-md space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black uppercase tracking-wider">Display Settings</h3>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  <Clock size={14} />
                  Ready Order Expiry (Minutes)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[2, 5, 10, 20].map(m => (
                    <button
                      key={m}
                      onClick={() => handleExpiryChange(m)}
                      className={`py-3 rounded-xl font-black text-sm transition-all ${
                        expiryMinutes === m ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      {m}m
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-gray-600 font-bold italic">Orders will hide from 'Ready' column after this time.</p>
              </div>
            </div>

            <button 
              onClick={() => setShowSettings(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all"
            >
              Save & Close
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 flex overflow-hidden p-[2vw] gap-[2vw]">
        
        {/* PREPARING COLUMN */}
        <section className="flex-1 flex flex-col bg-[#0a0a0c] border border-white/5 rounded-[2vw] overflow-hidden">
          <div className="h-[8vh] flex items-center px-[3vw] bg-white/5 border-b border-white/5">
            <ChefHat className="text-orange-500 mr-[1vw] w-[2vh] h-[2vh]" />
            <h2 className="text-[2vh] font-black uppercase tracking-[0.2em] text-gray-500">Preparing</h2>
            <div className="ml-auto bg-orange-600 text-white px-[1.5vw] py-[0.5vh] rounded-full text-[1.5vh] font-black">
              {preparing.length}
            </div>
          </div>
          
          <div className="flex-1 p-[2vw] overflow-y-auto no-scrollbar grid grid-cols-2 gap-[2vw] content-start">
            {preparing.map(kot => {
              const display = getDisplayName(kot);
              return (
                <div 
                  key={kot.id}
                  className="bg-white/[0.03] border border-white/5 rounded-[1.5vw] p-[2vw] flex flex-col space-y-[1.5vh] hover:bg-white/5 transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="text-[1.2vh] font-black text-orange-500/60 uppercase tracking-[0.2em] mb-1">Order #{display.primary}</span>
                    <span className="text-[3.5vh] font-black text-white truncate leading-tight uppercase tracking-tight">
                      {display.secondary}
                    </span>
                  </div>

                  <div className="pt-[1.5vh] border-t border-white/10">
                    <div className="space-y-[0.8vh]">
                      {kot.order?.items?.slice(0, 3).map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-gray-400">
                          <span className="text-[1.4vh] font-bold truncate flex-1 pr-2 uppercase tracking-tight">{item.product.name}</span>
                          <span className="text-[1.2vh] font-black bg-white/10 px-1.5 rounded text-white/80">x{item.quantity}</span>
                        </div>
                      ))}
                      {kot.order?.items?.length > 3 && (
                        <p className="text-[1.1vh] text-blue-500 font-black uppercase mt-1">+{kot.order.items.length - 3} More Items</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {preparing.length === 0 && (
              <div className="col-span-2 h-full flex flex-col items-center justify-center opacity-5 mt-[10vh]">
                <ChefHat size={160} />
                <p className="mt-[2vh] font-black uppercase tracking-widest text-[3vh]">Kitchen Clear</p>
              </div>
            )}
          </div>
        </section>

        {/* READY COLUMN */}
        <section className="flex-1 flex flex-col bg-[#0a0a0c] border-2 border-green-600/20 rounded-[2vw] overflow-hidden shadow-[0_0_50px_rgba(22,163,74,0.05)]">
          <div className="h-[8vh] flex items-center px-[3vw] bg-green-600/10 border-b border-green-600/20">
            <Bell className="text-green-500 mr-[1vw] w-[2vh] h-[2vh]" />
            <h2 className="text-[2vh] font-black uppercase tracking-[0.2em] text-green-500">Ready</h2>
            <div className="ml-auto bg-green-600 text-white px-[1.5vw] py-[0.5vh] rounded-full text-[1.5vh] font-black">
              {ready.length}
            </div>
          </div>
          
          <div className="flex-1 p-[2vw] overflow-y-auto no-scrollbar grid grid-cols-2 gap-[2vw] content-start">
            {ready.map(kot => {
              const display = getDisplayName(kot);
              return (
                <div 
                  key={kot.id}
                  className="bg-green-600/10 border-2 border-green-600/30 rounded-[2vw] p-[2vw] flex flex-col space-y-[2vh] animate-ready-pulse"
                >
                  <div className="flex flex-col">
                    <span className="text-[1.2vh] font-black text-green-500/60 uppercase tracking-[0.2em] mb-1">Order #{display.primary}</span>
                    <span className="text-[4.5vh] leading-none font-black text-white drop-shadow-lg truncate uppercase tracking-tight">
                      {display.secondary}
                    </span>
                  </div>

                  <div className="pt-[1.5vh] border-t border-green-600/20">
                    <div className="space-y-[0.8vh]">
                      {kot.order?.items?.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center">
                          <span className="text-[1.6vh] font-bold text-white/80 truncate flex-1 pr-2 uppercase tracking-tight">{item.product.name}</span>
                          <span className="text-[1.3vh] font-black bg-green-600/20 text-green-400 px-2 rounded">x{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-auto flex items-center justify-center gap-[1vw] bg-green-600 text-white px-[2vw] py-[1.2vh] rounded-[1vw] shadow-lg shadow-green-600/20">
                    <span className="text-[1.8vh] font-black uppercase tracking-[0.2em]">Collect Now</span>
                  </div>
                </div>
              );
            })}
            {ready.length === 0 && (
              <div className="col-span-2 h-full flex flex-col items-center justify-center opacity-5 mt-[10vh]">
                <Bell size={160} />
                <p className="mt-[2vh] font-black uppercase tracking-widest text-[3vh]">Waiting</p>
              </div>
            )}
          </div>
        </section>

      </main>

      <footer className="h-[8vh] bg-blue-700 flex items-center justify-center px-[4vw] shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <p className="text-white text-[1.6vh] font-black uppercase tracking-[0.4em] text-center">
          Please have your receipt ready for collection
        </p>
      </footer>

      <style jsx global>{`
        @keyframes ready-pulse {
          0%, 100% { transform: scale(1); background-color: rgba(22, 163, 74, 0.1); }
          50% { transform: scale(0.97); background-color: rgba(22, 163, 74, 0.15); }
        }
        .animate-ready-pulse {
          animation: ready-pulse 2.5s ease-in-out infinite;
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        body { background-color: #000000; }
      `}</style>
    </div>
  );
}
