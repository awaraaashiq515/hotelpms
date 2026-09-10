'use client';

import React from 'react';
import { X, Play } from 'lucide-react';

interface LearnToUseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LearnToUseModal({ isOpen, onClose }: LearnToUseModalProps) {
  if (!isOpen) return null;

  const steps = [
    {
      title: 'Top Live Operational KPI Cards',
      desc: 'Real-time counters for arrivals, departures, occupied units, occupancy %, and Average Daily Rate (ADR) calculated from your actual rooms and stays.',
    },
    {
      title: 'Reservation Operational Console',
      desc: 'Switch between Arrivals, Departures, Stayovers, In-House, and Balance Due. Live search any guest by name, room, or booking ID.',
    },
    {
      title: 'Real Guest Notes & Fast Check-In',
      desc: 'Hover on any note icon to inspect special requests. Click the note icon to update notes directly into the database. Use action buttons to perform 1-click check-ins or print guest folios.',
    },
    {
      title: "Today's Activity Stream",
      desc: 'Inspect real daily bookings and revenue breakdown with OTA channel attribution (Hotels.com, Expedia, Traveloka, Direct Walk-In).',
    },
    {
      title: '14 Days Outlook Forecast',
      desc: 'Click on any day in the 14-day calendar to view real-time forward occupancy, available units, and projected daily revenue.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-[#0f172a] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-800 relative text-white">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-[#00b894] flex items-center justify-center border border-emerald-500/20">
            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              Operations Dashboard Guide
            </h3>
            <span className="text-xs text-slate-400">Front Desk & Operations Workflow</span>
          </div>
        </div>

        <div className="space-y-3 mt-5">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-[#1e293b]/50 border border-slate-800">
              <div className="w-6 h-6 rounded-full bg-[#00b894]/15 text-[#00b894] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-[#00b894]/30">
                {idx + 1}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">{step.title}</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold bg-[#00b894] hover:bg-[#00a884] text-white rounded-xl shadow-md transition-colors cursor-pointer"
          >
            Got it, Let&apos;s Start
          </button>
        </div>
      </div>
    </div>
  );
}
