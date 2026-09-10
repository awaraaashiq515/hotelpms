'use client';

import React, { useState } from 'react';
import {
  RotateCcw,
  Printer,
  Copy,
  Search,
  ChevronDown,
  ArrowUpDown,
  LogIn
} from 'lucide-react';

export interface ReservationItem {
  id: string;
  guestId?: string;
  guestName: string;
  guestFirstName?: string;
  guestLastName?: string;
  guestMobile?: string;
  guestEmail?: string;
  guestAddress?: string;
  guestIdType?: string;
  guestIdNumber?: string;
  guestNationality?: string;
  companyName?: string;
  gstNumber?: string;
  reservationNumber: string;
  unitNumber: string;
  assignedRoomId?: string;
  roomTypeName?: string;
  status: string;
  arrivalDate?: string;
  departureDate?: string;
  nights?: number;
  ratePerNight?: number;
  adults?: number;
  children?: number;
  mealPlan?: string;
  totalAmount?: number;
  advanceAmount?: number;
  dueAmount?: number;
  notes?: string;
  source?: string;
  createdAt?: string | Date;
}

interface CategorizedReservations {
  arrivals: ReservationItem[];
  departures: ReservationItem[];
  stayovers: ReservationItem[];
  inHouse: ReservationItem[];
  balanceDue: ReservationItem[];
}

interface ReservationWidgetProps {
  reservations: CategorizedReservations;
  onRefresh?: () => void;
  onAddNote?: (res: ReservationItem) => void;
  onCheckIn?: (res: ReservationItem) => void;
  onPrint?: (res: ReservationItem) => void;
  onPrintList?: (items: ReservationItem[]) => void;
}

export function ReservationWidget({
  reservations,
  onRefresh,
  onAddNote,
  onCheckIn,
  onPrint,
  onPrintList,
}: ReservationWidgetProps) {
  const [activeTab, setActiveTab] = useState<'Arrivals' | 'Departures' | 'Stayovers' | 'In-House Guest' | 'Balance Due'>('Arrivals');
  const [activeDay, setActiveDay] = useState<'today' | 'tomorrow'>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<keyof ReservationItem>('guestName');
  const [sortAsc, setSortAsc] = useState(true);
  const [hoveredNoteId, setHoveredNoteId] = useState<string | null>(null);

  // Select list based on active tab
  const getItemsForTab = (): ReservationItem[] => {
    switch (activeTab) {
      case 'Arrivals':
        return reservations.arrivals || [];
      case 'Departures':
        return reservations.departures || [];
      case 'Stayovers':
        return reservations.stayovers || [];
      case 'In-House Guest':
        return reservations.inHouse || [];
      case 'Balance Due':
        return reservations.balanceDue || [];
    }
  };

  const rawItems = getItemsForTab();

  const filteredItems = rawItems
    .filter((item) => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.guestName.toLowerCase().includes(q) ||
          item.reservationNumber.toLowerCase().includes(q) ||
          item.unitNumber.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      const valA = (a[sortField] ?? '') as string | number;
      const valB = (b[sortField] ?? '') as string | number;
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

  const handleSort = (field: keyof ReservationItem) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'CHECKED_IN':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'CONFIRMED':
        return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
      case 'PENDING':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'CHECKED_OUT':
        return 'text-slate-400 bg-slate-800 border-slate-700';
      default:
        return 'text-slate-300 bg-slate-800/80 border-slate-700';
    }
  };

  return (
    <div className="bg-[#0f172a] rounded-2xl border border-slate-800 shadow-xl p-5 w-full flex flex-col justify-between">
      {/* ── Top Header Row ── */}
      <div>
        <div className="flex items-center justify-between pb-3">
          <h2 className="text-xl font-bold text-white tracking-tight">
            Reservation
          </h2>
          <div className="flex items-center gap-2">
            <button
              title="Refresh list"
              onClick={onRefresh}
              className="w-8 h-8 rounded-lg border border-slate-700 hover:border-slate-600 bg-slate-800/60 flex items-center justify-center text-slate-300 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              title="Print reservation list"
              onClick={() => onPrintList?.(filteredItems)}
              className="w-8 h-8 rounded-lg border border-slate-700 hover:border-slate-600 bg-slate-800/60 flex items-center justify-center text-slate-300 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
            <button
              title="Copy / Export"
              onClick={() => {
                navigator.clipboard?.writeText(JSON.stringify(filteredItems, null, 2));
              }}
              className="w-8 h-8 rounded-lg border border-slate-700 hover:border-slate-600 bg-slate-800/60 flex items-center justify-center text-slate-300 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ── Filter Tabs ── */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-2 border-b border-slate-800/80 no-scrollbar">
          {(['Arrivals', 'Departures', 'Stayovers', 'In-House Guest', 'Balance Due'] as const).map((tab) => {
            const isActive = activeTab === tab;
            let count = 0;
            if (tab === 'Arrivals') count = reservations.arrivals?.length || 0;
            if (tab === 'Departures') count = reservations.departures?.length || 0;
            if (tab === 'Stayovers') count = reservations.stayovers?.length || 0;
            if (tab === 'In-House Guest') count = reservations.inHouse?.length || 0;
            if (tab === 'Balance Due') count = reservations.balanceDue?.length || 0;

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-slate-800 text-white font-semibold shadow-xs border border-slate-700'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <span>{tab}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-[#00b894]/20 text-[#00b894] font-bold' : 'bg-slate-800 text-slate-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Sub-bar: Today / Tomorrow & Search Input ── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3.5 pb-2">
          {/* Day Underline Tabs */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveDay('today')}
              className={`text-[13px] font-semibold pb-1.5 transition-all relative ${
                activeDay === 'today'
                  ? 'text-white border-b-2 border-[#00b894]'
                  : 'text-slate-500 hover:text-slate-300 border-b-2 border-transparent'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setActiveDay('tomorrow')}
              className={`text-[13px] font-semibold pb-1.5 transition-all relative ${
                activeDay === 'tomorrow'
                  ? 'text-white border-b-2 border-[#00b894]'
                  : 'text-slate-500 hover:text-slate-300 border-b-2 border-transparent'
              }`}
            >
              Tomorrow
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[200px] sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guest name..."
              className="w-full bg-[#1e293b]/60 border border-slate-700/80 text-white text-[13px] rounded-full pl-3.5 pr-8 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-500 placeholder:text-slate-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* ── Data Table ── */}
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[12px] font-medium text-slate-400">
                <th className="py-2.5 px-2 font-semibold">
                  <div
                    className="flex items-center gap-1 cursor-pointer hover:text-white"
                    onClick={() => handleSort('guestName')}
                  >
                    Guest Name <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="py-2.5 px-2 font-semibold">
                  <div
                    className="flex items-center gap-1 cursor-pointer hover:text-white"
                    onClick={() => handleSort('reservationNumber')}
                  >
                    Reservation Number <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="py-2.5 px-2 font-semibold">
                  <div
                    className="flex items-center gap-1 cursor-pointer hover:text-white"
                    onClick={() => handleSort('unitNumber')}
                  >
                    Unit Number <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="py-2.5 px-2 font-semibold">
                  <div
                    className="flex items-center gap-1 cursor-pointer hover:text-white"
                    onClick={() => handleSort('status')}
                  >
                    Status <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="py-2.5 px-2 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-[13px]">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-500 text-xs">
                    No active reservations found in {activeTab}.
                  </td>
                </tr>
              ) : (
                filteredItems.map((res) => (
                  <tr
                    key={res.id}
                    className="group hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Guest Name & Notes Icon */}
                    <td className="py-3 px-2 font-medium text-white">
                      <div className="flex items-center gap-2 relative">
                        {/* Note Icon with Tooltip */}
                        <div
                          className="relative flex items-center"
                          onMouseEnter={() => setHoveredNoteId(res.id)}
                          onMouseLeave={() => setHoveredNoteId(null)}
                        >
                          <button
                            type="button"
                            onClick={() => onAddNote?.(res)}
                            className="text-slate-400 hover:text-[#00b894] transition-colors p-0.5"
                            title="Notes"
                          >
                            <svg className="w-4 h-4 text-slate-400 hover:text-[#00b894]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                            </svg>
                          </button>

                          {/* Dark Navy Tooltip matching image */}
                          {hoveredNoteId === res.id && (
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 z-30 bg-slate-900 border border-slate-700 text-white text-[11px] font-medium py-1 px-2.5 rounded-lg shadow-2xl whitespace-nowrap flex items-center gap-1.5 animate-in fade-in">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#00b894]"></span>
                              {res.notes ? 'Edit Notes' : 'Add Notes'}
                              {/* Left arrow pointer */}
                              <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 border-l border-b border-slate-700 rotate-45"></div>
                            </div>
                          )}
                        </div>

                        <span className="truncate max-w-[150px] sm:max-w-none text-slate-200">
                          {res.guestName}
                        </span>
                      </div>
                    </td>

                    {/* Reservation Number */}
                    <td className="py-3 px-2 text-slate-400 font-mono text-[12px]">
                      {res.reservationNumber}
                    </td>

                    {/* Unit Number */}
                    <td className="py-3 px-2 font-medium text-slate-300">
                      {res.unitNumber}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-2">
                      <span className={`font-semibold text-xs px-2 py-0.5 rounded-md border ${getStatusBadge(res.status)}`}>
                        {res.status}
                      </span>
                    </td>

                    {/* Actions: Check-in button and Print button */}
                    <td className="py-3 px-2">
                      <div className="flex items-center justify-center gap-2">
                        {/* Check-in Button */}
                        <button
                          onClick={() => onCheckIn?.(res)}
                          title="Check-in Actions"
                          className="flex items-center gap-1 text-slate-300 hover:text-emerald-400 hover:bg-slate-800 p-1.5 rounded-lg transition-colors"
                        >
                          <LogIn className="w-4 h-4 text-slate-400 hover:text-emerald-400" />
                          <ChevronDown className="w-3 h-3 text-slate-500" />
                        </button>

                        {/* Print Button */}
                        <button
                          onClick={() => onPrint?.(res)}
                          title="Print Document"
                          className="flex items-center gap-1 text-slate-300 hover:text-sky-400 hover:bg-slate-800 p-1.5 rounded-lg transition-colors"
                        >
                          <Printer className="w-4 h-4 text-slate-400 hover:text-sky-400" />
                          <ChevronDown className="w-3 h-3 text-slate-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
