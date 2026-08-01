'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  time: string;
}

const QUICK_ACTIONS = [
  'What time is checkout?',
  'Order room service',
  'Book a spa appointment',
  'Request extra towels',
  'Book airport taxi',
  'What restaurants are nearby?',
  'Swimming pool timings?',
  'Request early check-in',
];

const AI_RESPONSES: Record<string, string> = {
  default: "I'm your GuestFlow AI concierge. How may I assist you today? I can help with room service, spa bookings, local recommendations, and much more.",
  checkout: "Standard checkout is at 12:00 PM. Late checkout until 3:00 PM is available for ₹500 (subject to availability). Shall I arrange it for you?",
  'room service': "Our room service is available 24/7. I'll open the menu for you. Our current chef's special is Dal Makhani with Butter Naan. What would you like?",
  spa: "Our spa offers Swedish Massage, Deep Tissue, and Aromatherapy sessions. The next available slot is today at 4:00 PM with Therapist Anita. Shall I book it?",
  towels: "I'll arrange extra towels for your room right away! Our housekeeping team will deliver them within 15 minutes.",
  taxi: "I'll arrange an airport taxi for you. Which airport and what time do you need the pickup? Our rates start at ₹850 for sedan.",
  restaurants: "Within 500m: The Spice Garden (Indian), Café Roma (Italian), Dragon Palace (Chinese). Shall I make a reservation at any of these?",
  pool: "The swimming pool is open daily from 6:00 AM to 10:00 PM. The temperature is maintained at 28°C. Enjoy your swim!",
  'early check-in': "Early check-in is available from 8:00 AM for ₹1,000. I'll check room availability for you. May I have your booking reference?",
};

function getResponse(msg: string): string {
  const lower = msg.toLowerCase();
  for (const [key, val] of Object.entries(AI_RESPONSES)) {
    if (key !== 'default' && lower.includes(key)) return val;
  }
  return AI_RESPONSES.default;
}

interface ChatWindowProps { guestName?: string }

export function ChatWindow({ guestName = 'Guest' }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', role: 'assistant', content: `Welcome back, ${guestName}! I'm your personal AI concierge. How can I make your stay more comfortable today?`, time: 'Now' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, time: 'Just now' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 900 + Math.random() * 600));
    const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: getResponse(text), time: 'Just now' };
    setMessages(prev => [...prev, aiMsg]);
    setLoading(false);
  }

  return (
    <div className="flex flex-col h-[520px] rounded-2xl bg-slate-900/50 border border-white/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-gradient-to-r from-violet-900/30 to-indigo-900/30">
        <div className="w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center">
          <Sparkles size={14} className="text-violet-300" />
        </div>
        <div>
          <p className="text-[11px] font-black text-white">GuestFlow AI Concierge</p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] text-emerald-400">Online · Responds instantly</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${msg.role === 'assistant' ? 'bg-violet-500/20' : 'bg-indigo-600'}`}>
              {msg.role === 'assistant' ? <Bot size={13} className="text-violet-300" /> : <User size={13} className="text-white" />}
            </div>
            <div className={`max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
              <div className={`px-3 py-2.5 rounded-2xl text-[11px] leading-relaxed ${
                msg.role === 'assistant'
                  ? 'bg-slate-800 text-slate-200 rounded-tl-sm'
                  : 'bg-indigo-600 text-white rounded-tr-sm'
              }`}>{msg.content}</div>
              <span className="text-[8px] text-slate-600 px-1">{msg.time}</span>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
              <Bot size={13} className="text-violet-300" />
            </div>
            <div className="px-3 py-2.5 rounded-2xl bg-slate-800">
              <div className="flex gap-1">
                {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />)}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-white/5">
        <div className="flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
            placeholder="Type a message…"
            className="flex-1 h-9 px-3 bg-slate-800/60 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500 transition-colors" />
          <button onClick={() => sendMessage(input)} disabled={!input.trim() || loading}
            className="w-9 h-9 rounded-xl bg-violet-600 hover:bg-violet-500 flex items-center justify-center text-white transition-colors disabled:opacity-40">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}
