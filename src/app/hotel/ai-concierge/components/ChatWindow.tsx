'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Bot, User, Loader2, Sparkles, Mic, MicOff, Volume2, 
  CheckCircle2, AlertTriangle, Clock, Wrench, Shield, Check,
  UserCheck, Zap, Copy, Download, RefreshCw
} from 'lucide-react';
import { 
  HotelSession, ChatMessage, HotelKnowledge, 
  processHotelConciergeQuery, ChatAction 
} from '@/lib/ai-concierge-engine';
import { playNotificationSound } from '@/lib/notification-sound';
import { toast } from 'sonner';

interface ChatWindowProps {
  session: HotelSession;
  knowledge: HotelKnowledge;
  language: string;
  onUpdateSessionHistory: (sessionId: string, history: ChatMessage[], newStatus?: 'ACTIVE' | 'RESOLVED' | 'URGENT') => void;
  onToggleStatus: (sessionId: string, status: 'ACTIVE' | 'RESOLVED') => void;
  externalPrompt?: string;
  onClearExternalPrompt?: () => void;
}

export function ChatWindow({
  session,
  knowledge,
  language,
  onUpdateSessionHistory,
  onToggleStatus,
  externalPrompt,
  onClearExternalPrompt
}: ChatWindowProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCoPilotMode, setIsCoPilotMode] = useState(false);
  const [coPilotDraft, setCoPilotDraft] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Only scroll the inner messages container, never the entire page
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [session?.history, loading]);

  // Handle external prompts (from QuickRequests or parent)
  useEffect(() => {
    if (externalPrompt) {
      sendMessage(externalPrompt);
      if (onClearExternalPrompt) onClearExternalPrompt();
    }
  }, [externalPrompt]);

  // Speech Recognition setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const reco = new SpeechRecognition();
        reco.continuous = false;
        reco.interimResults = false;
        reco.lang = language === 'hi' ? 'hi-IN' : 'en-US';
        reco.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setInput(prev => (prev ? `${prev} ${transcript}` : transcript));
          }
          setIsListening(false);
        };
        reco.onerror = () => setIsListening(false);
        reco.onend = () => setIsListening(false);
        recognitionRef.current = reco;
      }
    }
  }, [language]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        setIsListening(false);
      }
    }
  };

  // Text to speech
  const speakText = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const clean = text.replace(/[*#•_]/g, '');
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      if (language === 'hi') utterance.lang = 'hi-IN';
      window.speechSynthesis.speak(utterance);
    }
  };

  // Quick staff response templates
  const QUICK_STAFF_TEMPLATES = [
    `✅ Noted sir! Housekeeping has been dispatched to Room ${session.room}.`,
    `🍽️ Your in-room dining order is being prepared and will arrive in 20 mins.`,
    `👨‍🔧 Engineering technician is on their way to inspect Room ${session.room}.`,
    `🛎️ A bellboy is arriving at your door to assist with your luggage.`,
    `📞 Our Duty Manager will contact your room phone shortly.`
  ];

  // Send manual staff reply from Reception to Room Portal
  const handleSendStaffReply = async (customText?: string) => {
    const textToSend = (customText || input).trim();
    if (!textToSend || loading) return;
    await sendManualStaffReply(textToSend);
    setInput('');
  };

  // Direct manual reply from Receptionist / Front Desk to Guest
  async function sendManualStaffReply(content: string) {
    if (!content.trim()) return;
    const currentTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const staffMessage: ChatMessage = {
      id: `msg-staff-${Date.now()}`,
      role: 'assistant',
      content: content.trim(),
      time: currentTimeStr,
      senderName: 'Front Desk Associate',
      isStaffReply: true
    };

    onUpdateSessionHistory(session.id, [...session.history, staffMessage], 'ACTIVE');
    setInput('');
    playNotificationSound('success');
    toast.success(`✅ Staff reply sent to Room ${session.room}!`);

    // Persist to database and broadcast to guest room portal
    try {
      fetch('/api/hotel/ai-concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'STAFF_MESSAGE',
          isStaffReply: true,
          roomNumber: session.room,
          message: content.trim(),
          senderName: 'Front Desk Associate'
        })
      }).catch((err) => {
        console.error('[Send Staff Message Error]:', err);
      });

      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('concierge_chat_channel');
        bc.postMessage({
          type: 'STAFF_REPLY',
          room: String(session.room),
          roomNumber: String(session.room),
          message: content.trim(),
          senderName: 'Front Desk Associate',
          time: currentTimeStr,
        });
        setTimeout(() => bc.close(), 1000);
      }
    } catch (e) {}
  }

  // Dispatch AI or Staff message
  async function sendMessage(textToSend?: string) {
    const rawText = (textToSend || input).trim();
    if (!rawText || loading) return;

    // If textToSend is provided from 1-click test buttons: simulate guest inquiry
    if (textToSend) {
      const userMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: rawText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        senderName: session.guest
      };

      const updatedHistory = [...session.history, userMessage];
      onUpdateSessionHistory(session.id, updatedHistory, 'ACTIVE');
      setInput('');
      setLoading(true);

      try {
        let aiResult: any = null;
        try {
          const res = await fetch('/api/hotel/ai-concierge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: rawText,
              guestName: session.guest,
              roomNumber: session.room,
              language,
              knowledgeSettings: knowledge
            })
          });
          if (res.ok) {
            const json = await res.json();
            if (json.success && json.data) {
              aiResult = json.data;
            }
          }
        } catch (e) {}

        if (!aiResult) {
          await new Promise(r => setTimeout(r, 650 + Math.random() * 400));
          aiResult = processHotelConciergeQuery(rawText, session.guest, session.room, knowledge, language);
        }

        if (isCoPilotMode) {
          setCoPilotDraft(aiResult.reply);
          setLoading(false);
        } else {
          const aiMessage: ChatMessage = {
            id: `msg-ai-${Date.now()}`,
            role: 'assistant',
            content: aiResult.reply,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            action: aiResult.action,
            quickReplies: aiResult.quickReplies
          };

          const finalStatus = aiResult.sentiment === 'URGENT' ? 'URGENT' : 'ACTIVE';
          onUpdateSessionHistory(session.id, [...updatedHistory, aiMessage], finalStatus);
          setLoading(false);

          // Broadcast to Guest Room Portal tab
          try {
            if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
              const bc = new BroadcastChannel('concierge_chat_channel');
              bc.postMessage({
                type: 'STAFF_REPLY',
                roomNumber: String(session.room),
                message: aiResult.reply,
                senderName: 'AI Concierge',
                time: aiMessage.time,
              });
              setTimeout(() => bc.close(), 500);
            }
          } catch (e) {}
        }
      } catch (err) {
        console.error('[Chat Error]:', err);
        setLoading(false);
      }
    } else {
      // 💬 Receptionist typed in bottom input -> Direct Manual Staff Reply to Guest!
      await sendManualStaffReply(rawText);
    }
  }

  // Quick Action Buttons
  const handleTriggerAction = (prompt: string) => {
    sendMessage(prompt);
  };

  const copyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const latestQuickReplies = session.history[session.history.length - 1]?.role === 'assistant' 
    ? session.history[session.history.length - 1]?.quickReplies 
    : undefined;

  return (
    <div className="flex flex-col h-[560px] rounded-2xl bg-slate-900/70 border border-white/10 shadow-2xl overflow-hidden backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-violet-950/40 via-slate-900 to-indigo-950/30">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-300">
              <Sparkles size={16} />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-black text-white">Room {session.room} · {session.guest}</p>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-violet-500/15 text-violet-300 border border-violet-500/25">
                {session.tier}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5">
              <span>{session.roomType}</span>
              <span>•</span>
              <span className="text-emerald-400 font-bold">Live AI Active</span>
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Co-Pilot Mode Toggle */}
          <button
            onClick={() => setIsCoPilotMode(!isCoPilotMode)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all border ${
              isCoPilotMode 
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
                : 'bg-slate-800 text-slate-400 border-white/5 hover:text-white'
            }`}
            title={isCoPilotMode ? 'Staff Co-Pilot active: Review AI responses before sending' : 'AI Auto-Pilot active'}
          >
            {isCoPilotMode ? <UserCheck size={12} className="text-amber-400" /> : <Bot size={12} />}
            <span>{isCoPilotMode ? 'Staff Co-Pilot' : 'Auto-Pilot'}</span>
          </button>

          {/* Mark Resolved Toggle */}
          <button
            onClick={() => onToggleStatus(session.id, session.status === 'RESOLVED' ? 'ACTIVE' : 'RESOLVED')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all border ${
              session.status === 'RESOLVED'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-slate-800 text-slate-400 border-white/5 hover:text-emerald-400 hover:border-emerald-500/20'
            }`}
          >
            <CheckCircle2 size={12} />
            <span>{session.status === 'RESOLVED' ? 'Resolved' : 'Mark Done'}</span>
          </button>
        </div>
      </div>

      {/* Quick Action Shortcut Bar */}
      <div className="px-3 py-1.5 border-b border-white/5 bg-slate-900/40 flex items-center gap-1.5 overflow-x-auto text-[9px] font-bold">
        <span className="text-slate-500 uppercase tracking-widest text-[8px] shrink-0">1-Click Actions:</span>
        <button 
          onClick={() => handleTriggerAction('Request extra bath towels and toiletries')}
          className="px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-white/5 text-slate-300 hover:text-white shrink-0 transition-colors"
        >
          🛁 Extra Towels
        </button>
        <button 
          onClick={() => handleTriggerAction('My AC is not cooling properly')}
          className="px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-white/5 text-slate-300 hover:text-white shrink-0 transition-colors"
        >
          ❄️ AC Issue
        </button>
        <button 
          onClick={() => handleTriggerAction('Can I get late checkout till 1 PM?')}
          className="px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-white/5 text-slate-300 hover:text-white shrink-0 transition-colors"
        >
          🕒 Late Checkout
        </button>
        <button 
          onClick={() => handleTriggerAction('Book airport taxi sedan for departure')}
          className="px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-white/5 text-slate-300 hover:text-white shrink-0 transition-colors"
        >
          🚖 Book Taxi
        </button>
        <button 
          onClick={() => handleTriggerAction('What is the WiFi password?')}
          className="px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-white/5 text-slate-300 hover:text-white shrink-0 transition-colors"
        >
          📶 Wi-Fi Details
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {session.history.map(msg => (
          <div 
            key={msg.id} 
            className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            {/* Avatar */}
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs shadow-md ${
              msg.role === 'assistant' 
                ? (msg.isStaffReply ? 'bg-amber-600/30 text-amber-300 border border-amber-500/30' : 'bg-violet-600/20 text-violet-300 border border-violet-500/20')
                : 'bg-indigo-600 text-white'
            }`}>
              {msg.role === 'assistant' 
                ? (msg.isStaffReply ? <UserCheck size={13} /> : <Bot size={13} />) 
                : <User size={13} />}
            </div>

            {/* Bubble & Action Card */}
            <div className={`max-w-[78%] flex flex-col gap-1.5 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`px-3.5 py-2.5 rounded-2xl text-[11px] leading-relaxed shadow-sm whitespace-pre-line relative group ${
                msg.role === 'assistant'
                  ? (msg.isStaffReply 
                      ? 'bg-slate-800/90 text-amber-100 rounded-tl-sm border border-amber-500/20' 
                      : 'bg-slate-800/90 text-slate-200 rounded-tl-sm border border-white/5')
                  : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-tr-sm shadow-indigo-500/20'
              }`}>
                {msg.content}

                {/* Speaker & Copy helper for assistant */}
                {msg.role === 'assistant' && (
                  <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <button 
                      onClick={() => speakText(msg.content)} 
                      className="p-1 rounded text-slate-400 hover:text-violet-300 hover:bg-slate-700/60"
                      title="Read aloud"
                    >
                      <Volume2 size={11} />
                    </button>
                    <button 
                      onClick={() => copyMessage(msg.id, msg.content)} 
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700/60"
                      title="Copy text"
                    >
                      {copiedId === msg.id ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                    </button>
                  </div>
                )}
              </div>

              {/* Action Card (e.g. Housekeeping task, Maintenance ticket, Cab) */}
              {msg.action && (
                <div className="w-full p-2.5 rounded-xl bg-violet-950/30 border border-violet-500/25 space-y-1.5 text-[10px]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-black text-violet-300">
                      {msg.action.type.includes('HOUSEKEEPING') && <Sparkles size={12} className="text-violet-400" />}
                      {msg.action.type.includes('MAINTENANCE') && <Wrench size={12} className="text-amber-400" />}
                      {msg.action.type.includes('CAB') && <Zap size={12} className="text-sky-400" />}
                      <span>{msg.action.title}</span>
                    </div>
                    {msg.action.ticketNo && (
                      <span className="px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 font-mono font-bold text-[9px]">
                        #{msg.action.ticketNo}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400 text-[9px]">{msg.action.description}</p>
                  <div className="flex items-center gap-1.5 pt-1 text-[8px] font-bold text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Automatically logged in Hotel Management Board</span>
                  </div>
                </div>
              )}

              {/* Timestamp */}
              <span className="text-[8px] text-slate-500 px-1">
                {msg.senderName ? `${msg.senderName} • ` : ''}{msg.time}
              </span>
            </div>
          </div>
        ))}

        {/* Loading Bubble */}
        {loading && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-violet-600/20 border border-violet-500/20 flex items-center justify-center text-violet-300 text-xs">
              <Bot size={13} />
            </div>
            <div className="px-3.5 py-3 rounded-2xl bg-slate-800/80 border border-white/5 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="text-[9px] font-bold text-slate-400 ml-1">AI Concierge is preparing response…</span>
            </div>
          </div>
        )}

        {/* Latest Contextual Quick Replies */}
        {latestQuickReplies && latestQuickReplies.length > 0 && !loading && (
          <div className="pt-2 pl-9 flex flex-wrap gap-1.5">
            {latestQuickReplies.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => sendMessage(chip)}
                className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-violet-950/40 hover:bg-violet-900/70 text-violet-200 border border-violet-500/30 transition-all hover:scale-105 active:scale-95 shadow-sm"
              >
                {chip}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Staff Co-Pilot Review Box */}
      {isCoPilotMode && coPilotDraft && (
        <div className="p-3 bg-amber-950/40 border-t border-amber-500/30 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Bot size={12} />
              <span>AI Suggested Response (Staff Review)</span>
            </span>
            <button 
              onClick={() => setCoPilotDraft('')} 
              className="text-[10px] text-slate-400 hover:text-white"
            >
              Discard
            </button>
          </div>
          <textarea
            value={coPilotDraft}
            onChange={e => setCoPilotDraft(e.target.value)}
            rows={2}
            className="w-full px-3 py-1.5 rounded-xl bg-slate-900/90 border border-amber-500/30 text-slate-200 text-xs focus:outline-none focus:border-amber-400"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => handleSendStaffReply(coPilotDraft)}
              className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-[10px] transition-colors flex items-center gap-1"
            >
              <Send size={11} />
              <span>Approve & Send to Guest</span>
            </button>
          </div>
        </div>
      )}

      {/* Quick Staff Canned Replies */}
      <div className="px-4 py-2 border-t border-white/5 bg-slate-900/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <span className="text-[9px] font-black uppercase tracking-wider text-amber-400 shrink-0 flex items-center gap-1 mr-1">
          <UserCheck size={11} />
          <span>Staff Quick Replies:</span>
        </span>
        {QUICK_STAFF_TEMPLATES.map((tmpl, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendStaffReply(tmpl)}
            className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-950/40 hover:bg-amber-900/60 text-amber-200 border border-amber-500/30 shrink-0 transition-all hover:scale-105 active:scale-95 shadow-sm"
          >
            {tmpl}
          </button>
        ))}
      </div>

      {/* Input Footer */}
      <div className="px-4 py-3 border-t border-white/10 bg-slate-900/90">
        <div className="flex items-center gap-2">
          {/* Speech to text */}
          <button
            onClick={toggleListening}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              isListening 
                ? 'bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-600/40' 
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            title={isListening ? 'Stop listening' : 'Speak message'}
          >
            {isListening ? <MicOff size={15} /> : <Mic size={15} />}
          </button>

          <input 
            ref={inputRef}
            value={input} 
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSendStaffReply();
              }
            }}
            placeholder={isListening ? 'Listening… speak now' : `Type manual reply from Front Desk to Room ${session.room} (${session.guest})…`}
            className="flex-1 h-10 px-3.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-500 transition-colors" 
          />

          <button 
            type="button"
            onClick={() => handleSendStaffReply()} 
            disabled={!input.trim() || loading}
            className="h-10 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 flex items-center gap-1.5 text-slate-950 text-xs font-black transition-all disabled:opacity-40 shadow-lg shadow-amber-600/30 active:scale-95 cursor-pointer flex-shrink-0"
            title="Send manual reply from Front Desk to Guest"
          >
            <span>Send Staff Reply</span>
            {loading ? <Loader2 size={13} className="animate-spin text-slate-950" /> : <Send size={13} className="text-slate-950" />}
          </button>
        </div>
      </div>
    </div>
  );
}
