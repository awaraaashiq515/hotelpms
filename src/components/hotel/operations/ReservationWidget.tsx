'use client';

import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  Printer,
  Copy,
  Search,
  ChevronDown,
  ArrowUpDown,
  LogIn,
  LogOut,
  Eye,
  FileText,
  Receipt,
  Plus,
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
  queries?: any[];
}

interface ReservationWidgetProps {
  reservations: CategorizedReservations;
  onRefresh?: () => void;
  onAddNote?: (res: ReservationItem) => void;
  onCheckIn?: (res: ReservationItem) => void;
  onCheckOut?: (res: ReservationItem) => void;
  onPrint?: (res: ReservationItem) => void;
  onPrintList?: (items: ReservationItem[]) => void;
  onSelectReservation?: (res: ReservationItem) => void;
  onSelectQuery?: (query: any) => void;
  onAddQuery?: () => void;
}

export function ReservationWidget({
  reservations,
  onRefresh,
  onAddNote,
  onCheckIn,
  onCheckOut,
  onPrint,
  onPrintList,
  onSelectReservation,
  onSelectQuery,
  onAddQuery,
}: ReservationWidgetProps) {
  const [activeTab, setActiveTab] = useState<'Arrivals' | 'Departures' | 'Stayovers' | 'In-House Guest' | 'Balance Due' | 'Queries'>('Arrivals');
  const [activeDay, setActiveDay] = useState<'today' | 'tomorrow'>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<keyof ReservationItem>('guestName');
  const [sortAsc, setSortAsc] = useState(true);
  const [hoveredNoteId, setHoveredNoteId] = useState<string | null>(null);
  const [openPrintMenuId, setOpenPrintMenuId] = useState<string | null>(null);

  // Close print dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = () => setOpenPrintMenuId(null);
    if (openPrintMenuId) {
      window.addEventListener('click', handleOutsideClick);
      return () => window.removeEventListener('click', handleOutsideClick);
    }
  }, [openPrintMenuId]);

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
      case 'Queries':
        return (reservations.queries || []).map((q: any) => ({
          id: q.id,
          guestName: q.guestName || q.name || 'Guest Enquiry',
          reservationNumber: q.subject || 'Room Query',
          unitNumber: q.phone || 'Inquiry',
          status: q.status || 'NEW',
          notes: q.message || '',
          source: q.email || 'Direct Phone / Walk-in',
          createdAt: q.createdAt,
          rawQuery: q,
        }));
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
      case 'NEW':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'CONFIRMED':
      case 'RESOLVED':
        return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
      case 'PENDING':
      case 'IN_PROGRESS':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'CONVERTED':
        return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
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
            {onAddQuery && (
              <button
                type="button"
                onClick={onAddQuery}
                className="bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Query</span>
              </button>
            )}
            <button
              title="Refresh list"
              onClick={onRefresh}
              className="w-8 h-8 rounded-lg border border-slate-700 hover:border-slate-600 bg-slate-800/60 flex items-center justify-center text-slate-300 transition-colors cursor-pointer"
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
              className="w-8 h-8 rounded-lg border border-slate-700 hover:border-slate-600 bg-slate-800/60 flex items-center justify-center text-slate-300 transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ── Filter Tabs ── */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-2 border-b border-slate-800/80 no-scrollbar">
          {(['Arrivals', 'Departures', 'Stayovers', 'In-House Guest', 'Balance Due', 'Queries'] as const).map((tab) => {
            const isActive = activeTab === tab;
            let count = 0;
            if (tab === 'Arrivals') count = reservations.arrivals?.length || 0;
            if (tab === 'Departures') count = reservations.departures?.length || 0;
            if (tab === 'Stayovers') count = reservations.stayovers?.length || 0;
            if (tab === 'In-House Guest') count = reservations.inHouse?.length || 0;
            if (tab === 'Balance Due') count = reservations.balanceDue?.length || 0;
            if (tab === 'Queries') count = reservations.queries?.length || 0;

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? tab === 'Queries'
                      ? 'bg-amber-500/20 text-amber-300 font-semibold shadow-xs border border-amber-500/40'
                      : 'bg-slate-800 text-white font-semibold shadow-xs border border-slate-700'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <span>{tab}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? tab === 'Queries'
                        ? 'bg-amber-500/30 text-amber-300 font-bold'
                        : 'bg-[#00b894]/20 text-[#00b894] font-bold'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
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
                    {activeTab === 'Queries' ? 'Query Topic' : 'Reservation Number'}{' '}
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="py-2.5 px-2 font-semibold">
                  <div
                    className="flex items-center gap-1 cursor-pointer hover:text-white"
                    onClick={() => handleSort('unitNumber')}
                  >
                    {activeTab === 'Queries' ? 'Phone / Contact' : 'Unit Number'}{' '}
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
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
                    {activeTab === 'Queries'
                      ? 'No active queries or enquiries recorded yet.'
                      : `No active reservations found in ${activeTab}.`}
                  </td>
                </tr>
              ) : (
                filteredItems.map((res) => (
                  <tr
                    key={res.id}
                    onClick={() => {
                      if (activeTab === 'Queries') {
                        onSelectQuery?.((res as any).rawQuery || res);
                      } else {
                        onSelectReservation?.(res);
                      }
                    }}
                    title={activeTab === 'Queries' ? 'Click to view query details' : 'Click to view booking details'}
                    className="group hover:bg-slate-800/60 active:bg-slate-800/80 transition-colors cursor-pointer"
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
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddNote?.(res);
                            }}
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

                    {/* Unit Number / Phone */}
                    <td className="py-3 px-2">
                      <div className="font-medium text-slate-300">{res.unitNumber}</div>
                      {activeTab !== 'Queries' && (
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 font-normal">
                          <span className="text-emerald-400 font-semibold">{res.nights || 1}N</span>
                          <span>•</span>
                          <span className="text-amber-400/90">{res.mealPlan || 'RO'}</span>
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-2">
                      <span className={`font-semibold text-xs px-2 py-0.5 rounded-md border ${getStatusBadge(res.status)}`}>
                        {res.status}
                      </span>
                    </td>

                    {/* Actions: View button, Check-in/out button, and Print dropdown */}
                    <td className="py-3 px-2">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Direct View Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (activeTab === 'Queries') {
                              onSelectQuery?.((res as any).rawQuery || res);
                            } else {
                              onSelectReservation?.(res);
                            }
                          }}
                          title={activeTab === 'Queries' ? 'View Query Details' : 'View Full Booking Details'}
                          className={`flex items-center gap-1 border px-2 py-1 rounded-lg transition-all text-xs font-semibold cursor-pointer shadow-2xs ${
                            activeTab === 'Queries'
                              ? 'text-amber-300 hover:text-white bg-amber-500/10 hover:bg-amber-600/30 border-amber-500/25'
                              : 'text-indigo-300 hover:text-white bg-indigo-500/10 hover:bg-indigo-600/30 border-indigo-500/25 hover:border-indigo-500/40'
                          }`}
                        >
                          <Eye className={`w-3.5 h-3.5 ${activeTab === 'Queries' ? 'text-amber-400' : 'text-indigo-400'}`} />
                          <span>View</span>
                        </button>

                        {/* Status Quick Action: In / Out (Reservations only) */}
                        {activeTab !== 'Queries' && (
                          res.status === 'CHECKED_IN' ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onCheckOut?.(res);
                              }}
                              title="Check-out Guest"
                              className="flex items-center gap-1 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg transition-all text-xs font-medium cursor-pointer"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                              <span className="text-[11px] hidden sm:inline">Out</span>
                            </button>
                          ) : res.status === 'CHECKED_OUT' ? null : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onCheckIn?.(res);
                              }}
                              title="Check-in Guest"
                              className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg transition-all text-xs font-medium cursor-pointer"
                            >
                              <LogIn className="w-3.5 h-3.5" />
                              <span className="text-[11px] hidden sm:inline">In</span>
                            </button>
                          )
                        )}

                        {/* Print Document Dropdown Button */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenPrintMenuId(openPrintMenuId === res.id ? null : res.id);
                            }}
                            title="Print Document / Voucher / GRC"
                            className="flex items-center gap-1 text-slate-300 hover:text-sky-400 hover:bg-slate-800 border border-slate-700/60 hover:border-sky-500/40 px-2 py-1 rounded-lg transition-all text-xs cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5 text-slate-400 hover:text-sky-400" />
                            <ChevronDown className="w-3 h-3 text-slate-500" />
                          </button>

                          {openPrintMenuId === res.id && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 top-full mt-1.5 z-40 w-56 rounded-xl bg-[#0f172a] border border-slate-700 shadow-2xl p-1.5 animate-in fade-in zoom-in-95"
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenPrintMenuId(null);
                                  onPrint?.(res);
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left text-slate-200 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors font-medium cursor-pointer"
                              >
                                <FileText className="w-4 h-4 text-sky-400 shrink-0" />
                                <div>
                                  <div className="font-semibold text-white">Print Registration Card</div>
                                  <div className="text-[10px] text-slate-400">Guest GRC document for check-in</div>
                                </div>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setOpenPrintMenuId(null);
                                  onPrint?.(res);
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left text-slate-200 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors font-medium cursor-pointer"
                              >
                                <Receipt className="w-4 h-4 text-emerald-400 shrink-0" />
                                <div>
                                  <div className="font-semibold text-white">Print Stay Folio Voucher</div>
                                  <div className="text-[10px] text-slate-400">Bills, room rate & tax breakdown</div>
                                </div>
                              </button>

                              <div className="h-px bg-slate-800 my-1"></div>

                              <button
                                type="button"
                                onClick={() => {
                                  setOpenPrintMenuId(null);
                                  onSelectReservation?.(res);
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left text-indigo-300 hover:text-white hover:bg-indigo-500/10 rounded-lg transition-colors font-medium cursor-pointer"
                              >
                                <Eye className="w-4 h-4 text-indigo-400 shrink-0" />
                                <div>
                                  <div className="font-semibold text-white">View Full Reservation</div>
                                  <div className="text-[10px] text-slate-400">Guest folio & room details drawer</div>
                                </div>
                              </button>
                            </div>
                          )}
                        </div>
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
