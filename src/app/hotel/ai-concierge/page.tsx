'use client';
import React, { useState } from 'react';
import { Sparkles, Brain, MessageSquare, BarChart3 } from 'lucide-react';
import { ChatWindow } from './components/ChatWindow';
import { QuickRequests } from './components/QuickRequests';

const AI_STATS = [
  { label:'Requests Today',   value:'284',  sub:'+18% vs yesterday', color:'text-violet-300 border-violet-500/20 bg-violet-900/20' },
  { label:'Resolved Instantly',value:'94%', sub:'AI auto-resolved',   color:'text-emerald-300 border-emerald-500/20 bg-emerald-900/20' },
  { label:'Avg Response Time', value:'1.2s', sub:'Real-time AI',      color:'text-sky-300 border-sky-500/20 bg-sky-900/20' },
  { label:'Satisfaction',      value:'4.9★', sub:'From guest ratings', color:'text-yellow-300 border-yellow-500/20 bg-yellow-900/20' },
];

const ACTIVE_CHATS = [
  { room:'204', guest:'Priya Mehta',   lastMsg:'Can you book a spa slot?', time:'2m ago',  status:'ACTIVE' },
  { room:'307', guest:'Ramesh Sharma', lastMsg:'Need extra towels',        time:'5m ago',  status:'RESOLVED' },
  { room:'102', guest:'John Smith',    lastMsg:'What time is breakfast?',   time:'12m ago', status:'RESOLVED' },
  { room:'415', guest:'Ananya Roy',    lastMsg:'Request for late checkout', time:'18m ago', status:'ACTIVE' },
];

export default function AIConcierge() {
  const [inputText, setInputText] = useState('');

  return (
    <div className="space-y-5 pb-10 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Brain size={14} className="text-violet-400" />
            <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest">AI · Concierge</span>
          </div>
          <h1 className="text-2xl font-black text-white">AI Concierge</h1>
          <p className="text-xs text-slate-500 mt-0.5">Real-time guest assistance · 100+ languages · 24/7 automation</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-violet-500/20 bg-violet-900/10">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          <span className="text-[10px] font-black text-violet-300">AI Online · GPT-4o Powered</span>
        </div>
      </div>

      {/* AI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {AI_STATS.map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 ${s.color}`}>
            <p className="text-2xl font-black text-white">{s.value}</p>
            <p className="text-[9px] font-bold uppercase tracking-widest opacity-60 mt-1">{s.label}</p>
            <p className="text-[8px] text-slate-500 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Chat Window */}
        <div className="xl:col-span-2 space-y-3">
          <ChatWindow guestName="Priya Mehta" />
          <QuickRequests onSelect={msg => {}} />
        </div>

        {/* Active Chat Sessions */}
        <div className="rounded-2xl bg-slate-900/50 border border-white/5 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
            <MessageSquare size={13} className="text-violet-400" />
            <span className="text-[11px] font-black text-white uppercase tracking-wider">Active Sessions</span>
            <span className="ml-auto text-[9px] font-black text-violet-300 bg-violet-500/10 px-1.5 py-0.5 rounded-full">
              {ACTIVE_CHATS.filter(c => c.status === 'ACTIVE').length} live
            </span>
          </div>
          <div className="divide-y divide-white/5">
            {ACTIVE_CHATS.map(c => (
              <div key={c.room} className={`flex items-center gap-3 px-4 py-3 hover:bg-white/2 cursor-pointer transition-colors ${c.status === 'ACTIVE' ? 'bg-violet-900/5' : ''}`}>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center text-[10px] font-black text-white shrink-0">
                  {c.guest.split(' ').map(n=>n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-black text-white">{c.guest}</p>
                    <span className="text-[8px] text-slate-600">{c.time}</span>
                  </div>
                  <p className="text-[9px] text-slate-500 truncate">Rm {c.room} · {c.lastMsg}</p>
                </div>
                {c.status === 'ACTIVE' && <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse shrink-0" />}
              </div>
            ))}
          </div>

          {/* AI Insights box */}
          <div className="m-4 p-3 rounded-xl bg-violet-900/20 border border-violet-500/15">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={11} className="text-violet-400" />
              <span className="text-[9px] font-black text-violet-300 uppercase tracking-wider">AI Insight</span>
            </div>
            <p className="text-[9px] text-slate-400 leading-relaxed">
              🏆 Guest Priya Mehta (Gold Loyalty) has requested spa 3× this trip. 
              Consider proactively offering a 15% spa loyalty discount to increase satisfaction score.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
