import React from 'react';
import { Plane } from 'lucide-react';
import type { FlightInfo } from '@/types/hotel/dashboard.types';

function getMockFlights(): FlightInfo[] {
  return [
    { flight: 'AI 101', from: 'Delhi',     scheduled: '14:30', status: 'On Time', terminal: 'T2' },
    { flight: '6E 224', from: 'Bangalore', scheduled: '15:10', status: 'Delayed', terminal: 'T1' },
    { flight: 'SG 504', from: 'Chennai',   scheduled: '16:00', status: 'On Time', terminal: 'T1' },
    { flight: 'UK 721', from: 'Hyderabad', scheduled: '17:45', status: 'Landed',  terminal: 'T2' },
    { flight: 'AI 802', from: 'Kolkata',   scheduled: '18:20', status: 'On Time', terminal: 'T2' },
  ];
}

const STATUS_COLOR: Record<string, string> = {
  'On Time':  'text-emerald-300 bg-emerald-500/10 border border-emerald-500/20',
  'Delayed':  'text-amber-300 bg-amber-500/10 border border-amber-500/20',
  'Landed':   'text-sky-300 bg-sky-500/10 border border-sky-500/20',
  'Cancelled':'text-rose-300 bg-rose-500/10 border border-rose-500/20',
};

export function FlightMonitor() {
  const flights = getMockFlights();
  return (
    <div className="rounded-2xl bg-slate-900/50 border border-white/5 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
        <Plane size={13} className="text-cyan-400" />
        <span className="text-[11px] font-black text-white uppercase tracking-wider">Flight Arrival Monitor</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              {['Flight', 'Origin', 'Time', 'Terminal', 'Status'].map(h => (
                <th key={h} className="text-left px-4 py-2 text-[9px] font-black text-slate-600 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {flights.map((f, i) => (
              <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                <td className="px-4 py-2.5 text-[11px] font-black text-white">{f.flight}</td>
                <td className="px-4 py-2.5 text-[10px] text-slate-400">{f.from}</td>
                <td className="px-4 py-2.5 text-[10px] font-mono text-slate-300">{f.scheduled}</td>
                <td className="px-4 py-2.5 text-[10px] text-slate-400">{f.terminal}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${STATUS_COLOR[f.status] || 'text-slate-400 bg-slate-800'}`}>
                    {f.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="px-4 py-2 text-[8px] text-slate-700 border-t border-white/5">
        * Integrate AviationStack API for live arrivals
      </p>
    </div>
  );
}
