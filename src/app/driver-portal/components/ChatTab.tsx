'use client';

import React from 'react';
import { MessageSquare } from 'lucide-react';

interface ChatTabProps {
  chatMessages: { id: string; sender: 'rider' | 'manager'; text: string; time: string }[];
  chatInput: string;
  setChatInput: (val: string) => void;
  handleSendChatMessage: (e: React.FormEvent) => void;
}

export function ChatTab({
  chatMessages,
  chatInput,
  setChatInput,
  handleSendChatMessage
}: ChatTabProps) {
  return (
    <div className="space-y-4">
      {/* Broadcast alerts board */}
      <div className="bg-gradient-to-r from-indigo-950/40 to-transparent border border-indigo-500/20 rounded-2xl p-4 space-y-2.5">
        <div>
          <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest leading-none">Broadcast Bulletin</p>
          <h4 className="text-xs font-black text-white uppercase mt-1">Announcements from Hub</h4>
        </div>

        <div className="space-y-1.5 border-t border-[#1e293b]/70 pt-2 text-[10px] text-slate-350 font-bold uppercase">
          <p className="flex items-start gap-1 text-slate-350">
            <span className="text-rose-500 shrink-0">📢</span>
            <span>Heavy Rain: Payout bonus ₹25 active on all trips. Safety gear compulsory!</span>
          </p>
          <p className="flex items-start gap-1 text-slate-350 border-t border-[#1e293b]/30 pt-1.5">
            <span className="text-indigo-400 shrink-0">📢</span>
            <span>System Sync: Complete your handovers by 11:30 PM.</span>
          </p>
        </div>
      </div>

      {/* Manager Live Chat */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-4 flex flex-col h-[280px] justify-between shadow-lg">
        <div className="flex items-center justify-between border-b border-[#1e293b]/85 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <h4 className="text-xs font-black text-white uppercase">Branch Manager</h4>
          </div>
          <span className="text-[7.5px] font-bold text-slate-500 uppercase">Interactive simulation</span>
        </div>

        {/* Chat messaging display */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-1 text-[10px]">
          {chatMessages.map(msg => (
            <div 
              key={msg.id} 
              className={`flex flex-col max-w-[75%] ${
                msg.sender === 'rider' ? 'ml-auto items-end' : 'mr-auto items-start'
              }`}
            >
              <div className={`px-3 py-2 rounded-2xl font-bold ${
                msg.sender === 'rider' 
                  ? 'bg-rose-600 text-white rounded-tr-none' 
                  : 'bg-[#070b12] text-slate-200 border border-[#1e293b] rounded-tl-none'
              }`}>
                {msg.text}
              </div>
              <span className="text-[7.5px] text-slate-500 font-bold mt-1 px-1">{msg.time}</span>
            </div>
          ))}
        </div>

        {/* Chat entry box */}
        <form onSubmit={handleSendChatMessage} className="flex gap-2 border-t border-[#1e293b]/80 pt-2">
          <input
            type="text"
            placeholder="Type message to manager..."
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            className="flex-1 h-9 px-3 rounded-lg bg-[#070b12] border border-[#1e293b] text-white placeholder-slate-700 outline-none text-[11px]"
          />
          <button
            type="submit"
            className="px-4 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
