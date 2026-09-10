'use client';

import React from 'react';
import { X, ShieldCheck, Lock, FileText, Coins, Cigarette, CigaretteOff, Brush } from 'lucide-react';

interface CalendarLegendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CalendarLegendModal({ isOpen, onClose }: CalendarLegendModalProps) {
  if (!isOpen) return null;

  const statuses = [
    {
      label: 'In-House / Checked In',
      color: 'bg-[#00b894] border-[#00b894]',
      desc: 'Guest is currently checked-in and occupying the unit.',
    },
    {
      label: 'Confirmed Reservation',
      color: 'bg-[#38bdf8] border-[#38bdf8]',
      desc: 'Booking is confirmed and awaiting guest arrival.',
    },
    {
      label: 'VIP / Guaranteed Stay',
      color: 'bg-[#a855f7] border-[#a855f7]',
      desc: 'VIP guest or corporate guaranteed reservation.',
    },
    {
      label: 'Payment / Balance Due',
      color: 'bg-[#f59e0b] border-[#f59e0b]',
      desc: 'Pending invoice amount or unsettled folio balance.',
    },
    {
      label: 'Maintenance / Out of Order',
      color: 'bg-[#f43f5e] border-[#f43f5e]',
      desc: 'Room is blocked for technical repair, painting, or deep cleaning.',
    },
    {
      label: 'Blocked / Reserved',
      color: 'bg-[#64748b] border-[#64748b]',
      desc: 'Management hold or channel manager block.',
    },
  ];

  const icons = [
    {
      icon: <Lock className="w-3.5 h-3.5 text-slate-300" />,
      title: 'Padlock (Room Locked)',
      desc: 'Do not reallocate or move this reservation to another unit.',
    },
    {
      icon: <FileText className="w-3.5 h-3.5 text-slate-300" />,
      title: 'Note / Document',
      desc: 'Guest has special requests, dietary needs, or operational notes.',
    },
    {
      icon: <Coins className="w-3.5 h-3.5 text-amber-300" />,
      title: 'Payment Coin',
      desc: 'Indicates billing status (green = settled, red = pending due).',
    },
    {
      icon: <CigaretteOff className="w-3.5 h-3.5 text-slate-400" />,
      title: 'Smoking Policy',
      desc: 'Shows smoking or non-smoking room allocation.',
    },
    {
      icon: <Brush className="w-3.5 h-3.5 text-rose-400" />,
      title: 'Housekeeping Broom',
      desc: 'Shows current room cleaning & inspection status.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-[#0f172a] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-800 text-white relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
            ℹ
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              Tape Chart Legend Information
            </h3>
            <span className="text-xs text-slate-400">Color codes and status symbols</span>
          </div>
        </div>

        {/* Status Colors */}
        <div className="space-y-2 mb-5">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Booking & Stay Statuses
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {statuses.map((s, idx) => (
              <div key={idx} className="flex items-center gap-2.5 p-2 rounded-xl bg-[#1e293b]/40 border border-slate-800/80">
                <span className={`w-3.5 h-3.5 rounded-full shrink-0 ${s.color}`}></span>
                <div>
                  <div className="text-xs font-bold text-slate-200">{s.label}</div>
                  <div className="text-[10px] text-slate-400 leading-tight">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status Icons */}
        <div className="space-y-2 mb-5">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Ribbon & Room Indicators
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {icons.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2.5 p-2 rounded-xl bg-[#1e293b]/40 border border-slate-800/80">
                <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                  {item.icon}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">{item.title}</div>
                  <div className="text-[10px] text-slate-400 leading-tight">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold bg-[#00b894] hover:bg-[#00a884] text-white rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Close Legend
          </button>
        </div>
      </div>
    </div>
  );
}
