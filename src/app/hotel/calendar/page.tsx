'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Loader2, X, LogIn, LogOut, FileText, BedDouble } from 'lucide-react';
import Link from 'next/link';

// ── Status Config ───────────────────────────────────────────
const STATUS: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  CONFIRMED:   { label: 'Confirmed',   bg: 'bg-indigo-600',    text: 'text-white',      dot: 'bg-indigo-300' },
  CHECKED_IN:  { label: 'Checked In',  bg: 'bg-emerald-600',   text: 'text-white',      dot: 'bg-emerald-300' },
  CHECKED_OUT: { label: 'Checked Out', bg: 'bg-slate-600',     text: 'text-slate-300',  dot: 'bg-slate-400' },
  PENDING:     { label: 'Pending',     bg: 'bg-amber-500',     text: 'text-white',      dot: 'bg-amber-200' },
  CANCELLED:   { label: 'Cancelled',   bg: 'bg-rose-800/70',   text: 'text-rose-200',   dot: 'bg-rose-400' },
};

// ── Housekeeping dot color ───────────────────────────────────
function hkColor(s: string) {
  if (s === 'CLEAN')         return 'bg-emerald-400';
  if (s === 'DIRTY')         return 'bg-amber-400';
  if (s === 'OUT_OF_ORDER')  return 'bg-rose-500';
  return 'bg-slate-600';
}

// ── Date helpers ─────────────────────────────────────────────
function dateKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
function addDays(d: Date, n: number) {
  const r = new Date(d); r.setDate(r.getDate() + n); return r;
}
function fmt(d: Date) {
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function CalendarPage() {
  const [rooms, setRooms]       = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [startDate, setStartDate] = useState<Date>(() => { const d = new Date(); d.setHours(0,0,0,0); return d; });
  const [days, setDays]           = useState(14);
  const [selected, setSelected]   = useState<any>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/hotel/rooms').then(r => r.json()),
      fetch('/api/hotel/bookings').then(r => r.json()),
    ]).then(([r, b]) => {
      if (r.success)  setRooms(r.data ?? []);
      if (b.success)  setBookings(b.data ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Date columns
  const cols = useMemo(() => Array.from({ length: days }, (_, i) => addDays(startDate, i)), [startDate, days]);

  // Lookup: roomId → { dateKey → booking }
  const lookup = useMemo(() => {
    const map: Record<string, Record<string, any>> = {};
    for (const b of bookings) {
      const arr = new Date(b.arrivalDate); arr.setHours(0,0,0,0);
      const dep = new Date(b.departureDate); dep.setHours(0,0,0,0);
      const ids: string[] = [];
      if (b.assignedRoomId) ids.push(b.assignedRoomId);
      (b.rooms ?? []).forEach((br: any) => br.roomId && !ids.includes(br.roomId) && ids.push(br.roomId));
      for (const id of ids) {
        if (!map[id]) map[id] = {};
        let cur = new Date(arr);
        while (cur < dep) { map[id][dateKey(cur)] = b; cur = addDays(cur, 1); }
      }
    }
    return map;
  }, [bookings]);

  // Summary counts
  const today = new Date(); today.setHours(0,0,0,0);
  const todayKey = dateKey(today);
  const occupied  = rooms.filter(r => (lookup[r.id]?.[todayKey])?.status === 'CHECKED_IN').length;
  const arrivals  = bookings.filter(b => { const a = new Date(b.arrivalDate); a.setHours(0,0,0,0); return dateKey(a) === todayKey && (b.status === 'CONFIRMED' || b.status === 'CHECKED_IN'); }).length;
  const departures = bookings.filter(b => { const d = new Date(b.departureDate); d.setHours(0,0,0,0); return dateKey(d) === todayKey; }).length;
  const available = rooms.length - occupied;

  if (loading) return (
    <div className="h-[60vh] flex items-center justify-center">
      <Loader2 className="animate-spin text-indigo-400" size={28} />
    </div>
  );

  return (
    <div className="space-y-5 pb-8">

      {/* ── TOP BAR ───────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-white">Room Availability</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {fmt(startDate)} → {fmt(cols[cols.length - 1])}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Days toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
            {[7, 14, 30].map(n => (
              <button key={n}
                onClick={() => setDays(n)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                  days === n ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'
                }`}
              >{n}D</button>
            ))}
          </div>
          {/* Prev / Today / Next */}
          <button onClick={() => setStartDate(d => addDays(d, -days))}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => { const d = new Date(); d.setHours(0,0,0,0); setStartDate(d); }}
            className="h-9 px-4 rounded-xl bg-slate-800 hover:bg-indigo-600 text-xs font-black text-slate-300 hover:text-white uppercase tracking-wider transition-all">
            Today
          </button>
          <button onClick={() => setStartDate(d => addDays(d, days))}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <ChevronRight size={16} />
          </button>
          {/* New Booking */}
          <Link href="/hotel/bookings"
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider transition-colors">
            <Plus size={14} /> Book
          </Link>
        </div>
      </div>

      {/* ── QUICK STATS ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Rooms',   value: rooms.length,  color: 'border-slate-700',       text: 'text-white' },
          { label: 'Occupied',      value: occupied,      color: 'border-rose-500/40',      text: 'text-rose-400' },
          { label: 'Available',     value: available,     color: 'border-emerald-500/40',   text: 'text-emerald-400' },
          { label: 'Today Arrivals',value: arrivals,      color: 'border-sky-500/40',       text: 'text-sky-400' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border ${s.color} bg-slate-900/50 px-5 py-4`}>
            <p className={`text-3xl font-black ${s.text}`}>{s.value}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── CALENDAR GRID ─────────────────────────────────────── */}
      <div className="rounded-2xl bg-[#0b1120] border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="border-collapse" style={{ minWidth: `${180 + days * 66}px` }}>
            {/* Date header */}
            <thead>
              <tr className="border-b border-slate-800">
                <th className="sticky left-0 z-20 bg-[#0b1120] border-r border-slate-800 px-4 py-3 text-left min-w-[150px]">
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Room</span>
                </th>
                {cols.map((d, i) => {
                  const isToday = dateKey(d) === todayKey;
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  return (
                    <th key={i}
                      className={`min-w-[62px] px-1 py-3 text-center border-r border-slate-800/60 ${isToday ? 'bg-indigo-600/10' : isWeekend ? 'bg-slate-900/30' : ''}`}>
                      <p className={`text-[9px] font-bold uppercase ${isToday ? 'text-indigo-400' : 'text-slate-600'}`}>
                        {d.toLocaleDateString('en-IN', { weekday: 'short' })}
                      </p>
                      <p className={`text-base font-black leading-none mt-0.5 ${isToday ? 'text-indigo-300' : 'text-slate-400'}`}>
                        {d.getDate()}
                      </p>
                      {isToday && <div className="w-1 h-1 rounded-full bg-indigo-400 mx-auto mt-0.5" />}
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Room rows */}
            <tbody className="divide-y divide-slate-800/50">
              {rooms.length === 0 ? (
                <tr>
                  <td colSpan={days + 1} className="py-16 text-center text-slate-600 text-sm">
                    No rooms found. Add rooms from Room Management.
                  </td>
                </tr>
              ) : rooms.map(room => {
                const roomMap = lookup[room.id] ?? {};
                return (
                  <tr key={room.id} className="hover:bg-slate-900/20 transition-colors group">
                    {/* Room label */}
                    <td className="sticky left-0 z-10 bg-[#0b1120] group-hover:bg-[#0d1628] border-r border-slate-800 px-4 py-3 transition-colors">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${hkColor(room.housekeepingStatus ?? '')}`} />
                        <div>
                          <p className="font-black text-sm text-white">Room {room.roomNumber}</p>
                          <p className="text-[9px] text-slate-500 font-semibold uppercase mt-0.5">
                            {room.roomType?.name || '—'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Date cells */}
                    {cols.map((d, i) => {
                      const key = dateKey(d);
                      const b = roomMap[key];
                      const isToday = key === todayKey;
                      const isStart = b && dateKey(new Date(b.arrivalDate)) === key;
                      const st = b ? (STATUS[b.status] ?? STATUS.CONFIRMED) : null;

                      if (b) {
                        return (
                          <td key={i}
                            onClick={() => setSelected(b)}
                            className={`p-0.5 border-r border-slate-800/40 cursor-pointer ${isToday ? 'bg-indigo-600/5' : ''}`}>
                            <div className={`h-9 rounded-lg flex items-center px-2 gap-1.5 transition-all hover:brightness-110 ${st!.bg} ${st!.text} ${!isStart ? 'rounded-l-none opacity-90' : ''}`}>
                              {isStart && (
                                <>
                                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${st!.dot}`} />
                                  <span className="text-[10px] font-black truncate">
                                    {b.guest?.firstName} {b.guest?.lastName?.charAt(0)}.
                                  </span>
                                </>
                              )}
                            </div>
                          </td>
                        );
                      }

                      // Empty cell
                      const arrStr = d.toISOString().split('T')[0];
                      const depStr = addDays(d, 1).toISOString().split('T')[0];
                      return (
                        <td key={i} className={`p-0.5 border-r border-slate-800/40 ${isToday ? 'bg-indigo-600/5' : ''}`}>
                          <Link href={`/hotel/bookings?roomId=${room.id}&arr=${arrStr}&dep=${depStr}`}
                            className="h-9 w-full flex items-center justify-center text-transparent hover:text-slate-600 text-[9px] font-black uppercase rounded-lg hover:bg-slate-800/30 transition-all">
                            +
                          </Link>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="px-5 py-3 border-t border-slate-800/60 flex flex-wrap items-center gap-4">
          {Object.entries(STATUS).map(([, s]) => (
            <div key={s.label} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-sm ${s.bg}`} />
              <span className="text-[10px] text-slate-500 font-semibold">{s.label}</span>
            </div>
          ))}
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-400" /><span className="text-[10px] text-slate-600">Clean</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-400" /><span className="text-[10px] text-slate-600">Dirty</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500" /><span className="text-[10px] text-slate-600">Out of Order</span></div>
          </div>
        </div>
      </div>

      {/* ── BOOKING DETAIL PANEL ──────────────────────────────── */}
      {selected && (
        <div className="max-w-lg rounded-2xl bg-[#0b1120] border border-slate-700 overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Booking</p>
              <p className="font-black text-white">{selected.bookingNo}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${STATUS[selected.status]?.bg} ${STATUS[selected.status]?.text}`}>
                {STATUS[selected.status]?.label}
              </span>
              <button onClick={() => setSelected(null)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                <X size={13} />
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="p-5 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Guest</p>
              <p className="font-black text-white text-sm">{selected.guest?.firstName} {selected.guest?.lastName}</p>
              <p className="text-xs text-slate-500 mt-0.5">{selected.guest?.mobile || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Room Type</p>
              <div className="flex items-center gap-1.5">
                <BedDouble size={13} className="text-indigo-400" />
                <p className="font-bold text-slate-200 text-sm">{selected.roomType?.name || '—'}</p>
              </div>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Check-in</p>
              <p className="font-bold text-slate-200 text-sm">{fmt(new Date(selected.arrivalDate))}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Check-out</p>
              <p className="font-bold text-slate-200 text-sm">{fmt(new Date(selected.departureDate))}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Total</p>
              <p className="font-black text-white">₹{(selected.totalAmount || 0).toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Due</p>
              <p className={`font-black ${(selected.dueAmount || 0) > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                ₹{(selected.dueAmount || 0).toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="px-5 pb-5 flex gap-2">
            {selected.status === 'CONFIRMED' && (
              <Link href={`/hotel/checkin?resId=${selected.id}`}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-colors">
                <LogIn size={13} /> Check In
              </Link>
            )}
            {selected.status === 'CHECKED_IN' && (
              <Link href={`/hotel/checkout?resId=${selected.id}`}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition-colors">
                <LogOut size={13} /> Check Out
              </Link>
            )}
            <Link href={`/hotel/billing?resId=${selected.id}`}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-black text-xs transition-colors">
              <FileText size={13} /> View Folio
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
