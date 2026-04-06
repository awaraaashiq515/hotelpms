'use client';

import React from 'react';
import Link from 'next/link';
import { CalendarX, Clock, Mail, LogOut, ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ExpiredPage() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 font-sans">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full relative">
        {/* Main Card */}
        <div className="bg-slate-900/60 backdrop-blur-2xl border-2 border-red-500/20 rounded-[40px] p-10 shadow-2xl text-center relative overflow-hidden">
          {/* Header Icon */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-red-500/20 rounded-3xl blur-2xl animate-pulse" />
              <div className="relative w-20 h-20 bg-gradient-to-br from-red-500 to-rose-600 rounded-3xl flex items-center justify-center shadow-xl rotate-3 transform transition-transform hover:rotate-6">
                <CalendarX size={36} className="text-white" />
              </div>
            </div>
          </div>

          {/* Text Content */}
          <h1 className="text-3xl font-black text-white mb-3 tracking-tight">Subscription Expired</h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-10">
            Your organization's access is currently restricted because your package has ended. 
            Please contact your system administrator or the Super Admin to renew your subscription.
          </p>

          {/* Info Strips */}
          <div className="space-y-3 mb-10">
            <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-2xl flex items-center gap-4 text-left group hover:bg-slate-800 transition-colors">
              <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Immediate Action</p>
                <p className="text-xs font-bold text-slate-200">Renew your plan to restore access</p>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-2xl flex items-center gap-4 text-left group hover:bg-slate-800 transition-colors">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                <ShieldAlert size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Data Protection</p>
                <p className="text-xs font-bold text-slate-200">Your data is safe and secured</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="grid gap-3">
            <a
              href="mailto:support@pos.com"
              className="w-full bg-white text-slate-900 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-white/5 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Mail size={14} /> Contact Support
            </a>
            
            <button
              onClick={handleLogout}
              className="w-full bg-slate-800/80 text-slate-400 py-4 rounded-2xl text-xs font-black uppercase tracking-widest border border-slate-700/50 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-all flex items-center justify-center gap-2"
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>

          {/* Ref Footer */}
          <div className="mt-10 pt-8 border-t border-slate-800 flex items-center justify-center gap-2 opacity-30">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">System Code:</span>
            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest leading-none bg-red-500/10 px-2 py-1 rounded">ACC_EXPIRED</span>
          </div>
        </div>
      </div>
    </div>
  );
}
