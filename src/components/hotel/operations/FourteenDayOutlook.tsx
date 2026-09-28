'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Plus,
  User,
  BedDouble,
  ExternalLink,
  Eye,
  Edit3,
  CheckCircle2,
  Clock,
  LogOut,
  Maximize2,
  X,
  Phone,
  Sparkles,
} from 'lucide-react';

export interface DayForecast {
  date: string;
  dayName: string;
  fullDate?: string;
  bookedUnits: number;
  totalUnits: number;
  occupancyRate: number;
  projectedRevenue: number;
  currency?: string;
  bookings?: any[];
}

interface FourteenDayOutlookProps {
  forecastData?: DayForecast[];
  currency?: string;
  onAddBooking?: (arrivalDate?: string) => void;
  onSelectBooking?: (booking: any) => void;
}

export function FourteenDayOutlook({
  forecastData,
  currency = '₹',
  onAddBooking,
  onSelectBooking,
}: FourteenDayOutlookProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Fallback generation if no data passed
  const days: DayForecast[] = forecastData && forecastData.length > 0 ? forecastData : [];

  const [selectedDay, setSelectedDay] = useState<DayForecast | null>(days[0] || null);
  const [isOutlookModalOpen, setIsOutlookModalOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Update selected day if data changes
  React.useEffect(() => {
    if (days.length > 0) {
      if (!selectedDay) {
        setSelectedDay(days[0]);
      } else {
        // Sync with updated forecastData entry if date matches
        const matched = days.find((d) => d.date === selectedDay.date || d.fullDate === selectedDay.fullDate);
        if (matched) {
          setSelectedDay(matched);
        }
      }
    }
  }, [days, selectedDay]);

  const activeItem = selectedDay || days[0];

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -260 : 260;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const getStatusBadge = (status?: string) => {
    const s = (status || 'CONFIRMED').toUpperCase();
    if (s === 'CHECKED_IN') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3" /> Checked In
        </span>
      );
    }
    if (s === 'CHECKED_OUT') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-500/15 text-slate-400 border border-slate-500/30">
          <LogOut className="w-3 h-3" /> Checked Out
        </span>
      );
    }
    if (s === 'CANCELLED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
          Cancelled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/30">
        <Clock className="w-3 h-3" /> Confirmed
      </span>
    );
  };

  const dayBookings = activeItem?.bookings || [];
  const filteredBookings = dayBookings.filter((b: any) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    const name = (b.guestName || '').toLowerCase();
    const phone = (b.guestMobile || '').toLowerCase();
    const room = (b.unitNumber || '').toLowerCase();
    const resNo = (b.reservationNumber || b.bookingNo || '').toLowerCase();
    return name.includes(q) || phone.includes(q) || room.includes(q) || resNo.includes(q);
  });

  return (
    <div className="bg-[#0f172a] rounded-2xl border border-slate-800 shadow-xl p-5 w-full">
      {/* ── Header: Title & Legend & Scroll Controls ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
              14 Days Outlook
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Occupancy Forecast
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any date to view, add, or change bookings
            </p>
          </div>
        </div>

        {/* Legend, Full Modal & Navigation Arrows */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-medium text-slate-400">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00b894]"></span>
              <span className="text-slate-300">&gt; 80% High</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
              <span className="text-slate-300">60-80% Optimal</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <span className="text-slate-300">&lt; 60% Low</span>
            </div>
          </div>

          {/* Expand Outlook Modal Button */}
          <button
            onClick={() => setIsOutlookModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-semibold transition-colors"
            title="Open Full Outlook Manager"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Manage Outlook</span>
          </button>

          {/* Scroll Buttons */}
          <div className="flex items-center gap-1 pl-2 border-l border-slate-800">
            <button
              onClick={() => scroll('left')}
              title="Scroll left"
              className="w-7 h-7 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              title="Scroll right"
              className="w-7 h-7 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Day-by-Day Responsive Horizontal Carousel Grid ── */}
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-2.5 pt-4 pb-2 overflow-x-auto scroll-smooth no-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {days.map((day, idx) => {
          const isSelected = activeItem?.date === day.date;
          const barColor =
            day.occupancyRate >= 80
              ? 'bg-[#00b894] shadow-[0_0_8px_rgba(0,184,148,0.5)]'
              : day.occupancyRate >= 60
              ? 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]'
              : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]';

          const hasBookings = day.bookings && day.bookings.length > 0;

          return (
            <div
              key={idx}
              onClick={() => setSelectedDay(day)}
              className={`flex-shrink-0 min-w-[95px] flex flex-col items-center p-3 rounded-xl cursor-pointer transition-all border text-center relative group ${
                isSelected
                  ? 'bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/40 shadow-xl shadow-indigo-950/50 scale-[1.02]'
                  : 'bg-[#1e293b]/40 border-slate-800 hover:border-slate-700 hover:bg-[#1e293b]/80'
              }`}
            >
              {hasBookings && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              )}
              <span className={`text-[11px] font-bold uppercase tracking-wider ${isSelected ? 'text-indigo-300' : 'text-slate-400'}`}>
                {day.dayName}
              </span>
              <span className="text-sm font-bold text-white mt-0.5">
                {day.date}
              </span>

              {/* Occupancy Progress Bar */}
              <div className="w-full bg-slate-800 h-2 rounded-full my-2.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                  style={{ width: `${Math.max(8, day.occupancyRate)}%` }}
                ></div>
              </div>

              <span className="text-xs font-bold text-white">
                {day.occupancyRate}%
              </span>
              <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                {day.bookedUnits}/{day.totalUnits} Units
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Forecast Detail Summary Banner ── */}
      {activeItem && (
        <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#00b894]" />
            <span>
              Selected Date: <strong className="text-white font-semibold">{activeItem.date} ({activeItem.dayName})</strong>
              {' • '}Booked Units: <strong className="text-white font-semibold">{activeItem.bookedUnits} of {activeItem.totalUnits}</strong>
              {' • '}Available:{' '}
              <strong className="text-emerald-400 font-semibold">
                {Math.max(0, activeItem.totalUnits - activeItem.bookedUnits)} units
              </strong>
            </span>
          </div>
          <div className="text-white font-bold text-sm bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/60">
            Projected Revenue: {currency} {activeItem.projectedRevenue.toLocaleString('en-IN')}
          </div>
        </div>
      )}

      {/* ── Date Operations Panel: Add / View / Change Bookings ── */}
      {activeItem && (
        <div className="mt-5 p-4 rounded-xl bg-slate-900/80 border border-slate-800/90 shadow-inner">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Bookings for {activeItem.date} ({activeItem.dayName})
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {dayBookings.length} {dayBookings.length === 1 ? 'Booking' : 'Bookings'}
                </span>
              </h3>
            </div>

            <div className="flex items-center gap-2">
              {/* + Add Booking for this date */}
              <button
                onClick={() => onAddBooking && onAddBooking(activeItem.fullDate)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Booking ({activeItem.date})</span>
              </button>

              {/* View Full Calendar Shortcut */}
              <Link
                href={`/hotel/calendar${activeItem.fullDate ? `?date=${activeItem.fullDate}` : ''}`}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs transition-colors border border-slate-700"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Calendar View</span>
              </Link>
            </div>
          </div>

          {/* Bookings List / Empty State */}
          <div className="mt-3">
            {dayBookings.length === 0 ? (
              <div className="py-8 px-4 text-center flex flex-col items-center justify-center rounded-lg bg-slate-950/40 border border-slate-800/50">
                <BedDouble className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-sm font-medium text-slate-300">
                  No reservations for {activeItem.date} ({activeItem.dayName})
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  All {activeItem.totalUnits} rooms are currently available for this day.
                </p>
                <button
                  onClick={() => onAddBooking && onAddBooking(activeItem.fullDate)}
                  className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Booking for {activeItem.date}</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {dayBookings.map((b: any) => {
                  const arrivalStr = b.arrivalDate ? new Date(b.arrivalDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'N/A';
                  const departureStr = b.departureDate ? new Date(b.departureDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'N/A';

                  return (
                    <div
                      key={b.id}
                      onClick={() => onSelectBooking && onSelectBooking(b)}
                      className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/60 hover:bg-[#1a243b] transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
                    >
                      <div>
                        {/* Top: Guest Name & Status */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors truncate flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{b.guestName || 'Guest'}</span>
                            </p>
                            {b.guestMobile && (
                              <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Phone className="w-2.5 h-2.5 text-slate-500" />
                                {b.guestMobile}
                              </p>
                            )}
                          </div>
                          <div>{getStatusBadge(b.status)}</div>
                        </div>

                        {/* Room & Stay info */}
                        <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
                          <div className="flex items-center gap-1.5 font-medium">
                            <BedDouble className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="text-white font-semibold">{b.unitNumber || 'Unassigned'}</span>
                            <span className="text-slate-500">•</span>
                            <span className="text-slate-400 text-[11px] truncate max-w-[100px]">{b.roomTypeName || 'Room'}</span>
                          </div>
                          <span className="text-slate-400 text-[11px]">
                            {arrivalStr} → {departureStr}
                          </span>
                        </div>
                      </div>

                      {/* Footer: Amount & View/Change button */}
                      <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-400">
                          {currency} {(b.totalAmount || 0).toLocaleString('en-IN')}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectBooking && onSelectBooking(b);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white text-[11px] font-semibold border border-indigo-500/40 transition-colors"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>View / Change</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Full Outlook Hub Modal (Expand View) ── */}
      {isOutlookModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1120] border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    14 Days Outlook Manager
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      Live Operations Desk
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Browse all 14 upcoming days, add reservations, or change and edit active bookings.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsOutlookModalOpen(false);
                    onAddBooking && onAddBooking(activeItem?.fullDate);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ New Booking</span>
                </button>

                <button
                  onClick={() => setIsOutlookModalOpen(false)}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Day Selector Tabs */}
            <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
              {days.map((day, idx) => {
                const isSelected = activeItem?.date === day.date;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDay(day)}
                    className={`flex-shrink-0 px-3 py-2 rounded-xl text-left border transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-md font-semibold'
                        : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border-slate-700/60'
                    }`}
                  >
                    <div className="text-[10px] uppercase font-bold opacity-80">{day.dayName}</div>
                    <div className="text-xs font-bold whitespace-nowrap">{day.date}</div>
                    <div className="text-[10px] mt-0.5 opacity-90">
                      {day.occupancyRate}% ({day.bookedUnits}/{day.totalUnits})
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Modal Body: Active Day Overview & Search */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <div>
                  <h4 className="text-base font-bold text-white">
                    {activeItem?.date} ({activeItem?.dayName}) Details
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {activeItem?.bookedUnits} of {activeItem?.totalUnits} units booked •{' '}
                    <span className="text-emerald-400 font-semibold">
                      {Math.max(0, (activeItem?.totalUnits || 0) - (activeItem?.bookedUnits || 0))} units available
                    </span>
                    {' • '}Projected Revenue:{' '}
                    <strong className="text-white">
                      {currency} {(activeItem?.projectedRevenue || 0).toLocaleString('en-IN')}
                    </strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Search guest, room, mobile..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={() => {
                      setIsOutlookModalOpen(false);
                      onAddBooking && onAddBooking(activeItem?.fullDate);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Booking</span>
                  </button>
                </div>
              </div>

              {/* Bookings Table / Grid */}
              {filteredBookings.length === 0 ? (
                <div className="py-12 text-center rounded-xl bg-slate-900/40 border border-slate-800 flex flex-col items-center">
                  <BedDouble className="w-10 h-10 text-slate-600 mb-2" />
                  <p className="text-sm font-semibold text-slate-300">
                    {searchFilter ? 'No matching bookings found' : `No bookings for ${activeItem?.date}`}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {searchFilter
                      ? 'Try clearing the search query to see all bookings.'
                      : 'Rooms are available for this date.'}
                  </p>
                  {!searchFilter && (
                    <button
                      onClick={() => {
                        setIsOutlookModalOpen(false);
                        onAddBooking && onAddBooking(activeItem?.fullDate);
                      }}
                      className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg"
                    >
                      + Add Booking for {activeItem?.date}
                    </button>
                  )}
                </div>
              ) : (
                <div className="border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900/90 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Guest</th>
                        <th className="py-3 px-4">Room</th>
                        <th className="py-3 px-4">Stay Dates</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredBookings.map((b: any) => (
                        <tr
                          key={b.id}
                          className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                          onClick={() => {
                            setIsOutlookModalOpen(false);
                            onSelectBooking && onSelectBooking(b);
                          }}
                        >
                          <td className="py-3 px-4">
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-indigo-400" />
                              {b.guestName || 'Guest'}
                            </div>
                            {b.guestMobile && (
                              <div className="text-[11px] text-slate-400 mt-0.5">{b.guestMobile}</div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-white">{b.unitNumber || 'Unassigned'}</div>
                            <div className="text-[11px] text-slate-400">{b.roomTypeName || 'Room'}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-white">
                              {b.arrivalDate ? new Date(b.arrivalDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'N/A'}
                              {' → '}
                              {b.departureDate ? new Date(b.departureDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'N/A'}
                            </div>
                            <div className="text-[11px] text-slate-400">{b.nights || 1} Nights</div>
                          </td>
                          <td className="py-3 px-4">{getStatusBadge(b.status)}</td>
                          <td className="py-3 px-4 font-bold text-emerald-400">
                            {currency} {(b.totalAmount || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsOutlookModalOpen(false);
                                onSelectBooking && onSelectBooking(b);
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-sm transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>View / Change</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
              <span>
                Tip: Click any booking row or &quot;View / Change&quot; to modify rooms, change stay dates, check-in, or manage guest folios.
              </span>
              <button
                onClick={() => setIsOutlookModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
