'use client';

import React, { useState, useRef } from 'react';
import { TrendingUp, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

export interface DayForecast {
  date: string;
  dayName: string;
  fullDate?: string;
  bookedUnits: number;
  totalUnits: number;
  occupancyRate: number;
  projectedRevenue: number;
  currency?: string;
}

interface FourteenDayOutlookProps {
  forecastData?: DayForecast[];
  currency?: string;
}

export function FourteenDayOutlook({ forecastData, currency = '₹' }: FourteenDayOutlookProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Fallback generation if no data passed
  const days: DayForecast[] = forecastData && forecastData.length > 0 ? forecastData : [];

  const [selectedDay, setSelectedDay] = useState<DayForecast | null>(days[0] || null);

  // Update selected day if data changes
  React.useEffect(() => {
    if (days.length > 0 && !selectedDay) {
      setSelectedDay(days[0]);
    }
  }, [days, selectedDay]);

  const activeItem = selectedDay || days[0];

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -260 : 260;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

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
          </div>
        </div>

        {/* Legend & Navigation Arrows */}
        <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
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

          return (
            <div
              key={idx}
              onClick={() => setSelectedDay(day)}
              className={`flex-shrink-0 min-w-[90px] flex flex-col items-center p-3 rounded-xl cursor-pointer transition-all border text-center ${
                isSelected
                  ? 'bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/30 shadow-lg'
                  : 'bg-[#1e293b]/40 border-slate-800 hover:border-slate-700 hover:bg-[#1e293b]/80'
              }`}
            >
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
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
    </div>
  );
}
