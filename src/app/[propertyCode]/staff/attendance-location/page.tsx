'use client';

import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Users, 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Search, 
  Filter, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  Compass, 
  ExternalLink,
  Target
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { format } from 'date-fns';

interface AttendanceLog {
  id: string;
  clockIn: string;
  clockOut: string | null;
  status: string;
  note: string | null;
  locationIn: string | null;
  locationOut: string | null;
  employeeName: string;
  employeeRole: string;
  distanceIn: number | null;
  distanceOut: number | null;
  isOutOfRangeIn: boolean;
  isOutOfRangeOut: boolean;
  alertDistanceMeters: number;
}

const addressCache: { [coords: string]: string } = {};

const ResolvedAddress = ({ coordinates, isOutOfRange, defaultLabel }: { coordinates: string | null; isOutOfRange: boolean; defaultLabel: string }) => {
  const [address, setAddress] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!coordinates) return;
    
    if (!isOutOfRange) {
      setAddress('Inside Restaurant');
      return;
    }

    if (addressCache[coordinates]) {
      setAddress(addressCache[coordinates]);
      return;
    }

    const fetchAddress = async () => {
      setLoading(true);
      try {
        const [lat, lng] = coordinates.split(',');
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat.trim()}&lon=${lng.trim()}&zoom=16`);
        const data = await res.json();
        if (data && data.display_name) {
          const parts = data.display_name.split(',');
          // Take the first 3 components of display_name for a concise name
          const clean = parts.slice(0, 3).join(',').trim();
          addressCache[coordinates] = clean;
          setAddress(clean);
        } else {
          setAddress(coordinates);
        }
      } catch (err) {
        console.error(err);
        setAddress(coordinates);
      } finally {
        setLoading(false);
      }
    };

    fetchAddress();
  }, [coordinates, isOutOfRange, defaultLabel]);

  if (loading) {
    return <span className="text-[10px] text-slate-500 animate-pulse font-mono">Resolving location...</span>;
  }

  return <span className="font-bold text-slate-200">{address || coordinates}</span>;
};

export default function AttendanceLocationPage() {
  const params = useParams();
  const propertyCode = params?.propertyCode as string;
  const propertyName = propertyCode 
    ? propertyCode.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') 
    : 'Restaurant';

  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [proximityFilter, setProximityFilter] = useState<'ALL' | 'INSIDE' | 'OUT_OF_RANGE'>('ALL');
  const [eventFilter, setEventFilter] = useState<'ALL' | 'CLOCK_IN_ONLY' | 'CLOCK_OUT_ONLY'>('ALL');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [expandedDates, setExpandedDates] = useState<{ [dateKey: string]: boolean }>({});

  useEffect(() => {
    fetchLogs(selectedMonth);
  }, [selectedMonth]);

  const fetchLogs = async (monthStr: string = selectedMonth) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/staff/attendance/report?month=${monthStr}`);
      const data = await res.json();
      if (data.success && data.data) {
        setLogs(data.data);
        
        // Auto-expand the latest date
        const fetchedLogs = data.data as AttendanceLog[];
        if (fetchedLogs.length > 0) {
          const latestDateKey = format(new Date(fetchedLogs[0].clockIn), 'yyyy-MM-dd');
          setExpandedDates({ [latestDateKey]: true });
        } else {
          setExpandedDates({});
        }
      }
    } catch (error) {
      console.error('Failed to fetch attendance logs', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter logs based on search term & filters
  const filteredLogs = logs.filter(log => {
    const nameMatch = log.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Proximity checks
    let proximityMatch = true;
    if (proximityFilter === 'INSIDE') {
      proximityMatch = (!log.isOutOfRangeIn && log.locationIn !== null) || 
                       (log.clockOut !== null && !log.isOutOfRangeOut && log.locationOut !== null);
    } else if (proximityFilter === 'OUT_OF_RANGE') {
      proximityMatch = log.isOutOfRangeIn || log.isOutOfRangeOut;
    }

    // Event type checks
    let eventMatch = true;
    if (eventFilter === 'CLOCK_IN_ONLY') {
      eventMatch = log.locationIn !== null;
    } else if (eventFilter === 'CLOCK_OUT_ONLY') {
      eventMatch = log.locationOut !== null;
    }

    return nameMatch && proximityMatch && eventMatch;
  });

  // Group filtered logs by date (YYYY-MM-DD)
  const logsByDate: { [dateStr: string]: AttendanceLog[] } = {};
  filteredLogs.forEach(log => {
    const dateKey = format(new Date(log.clockIn), 'yyyy-MM-dd');
    if (!logsByDate[dateKey]) {
      logsByDate[dateKey] = [];
    }
    logsByDate[dateKey].push(log);
  });

  // Sorted date keys in descending order
  const sortedDates = Object.keys(logsByDate).sort((a, b) => b.localeCompare(a));

  // Calculate summary metrics
  const totalLogsCount = filteredLogs.length;
  
  const totalPunchesCount = filteredLogs.reduce((acc, log) => {
    let count = 0;
    if (log.locationIn) count++;
    if (log.locationOut) count++;
    return acc + count;
  }, 0);

  const outOfRangeCount = filteredLogs.reduce((acc, log) => {
    let count = 0;
    if (log.isOutOfRangeIn) count++;
    if (log.isOutOfRangeOut) count++;
    return acc + count;
  }, 0);

  const insideRestaurantCount = totalPunchesCount - outOfRangeCount;

  const calculateDuration = (inTime: string, outTime: string | null) => {
    if (!outTime) return 'Active Shift';
    const diff = new Date(outTime).getTime() - new Date(inTime).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m`;
  };

  const getDayName = (dateStr: string) => {
    return format(new Date(dateStr), 'MMM dd, yyyy');
  };

  const getTimeOnly = (dateStr: string) => {
    return format(new Date(dateStr), 'hh:mm a');
  };

  return (
    <div className="space-y-8 pb-20 p-6 min-h-screen bg-slate-950 text-slate-100" style={{ fontFamily: '"Inter", sans-serif' }}>
      
      {/* ━━━ HEADER ━━━ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link href={`/${propertyCode}/reports/attendance`} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider mb-2">
            <ArrowLeft size={16} /> Back to Reports
          </Link>
          <PageHeader 
            title="Attendance Geolocation Verifier" 
            subtitle="Audit employee check-in & check-out locations, distance metrics, and alert details."
          />
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => fetchLogs()}
            className="flex items-center gap-2 px-5 py-3.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
          >
            Refresh Logs
          </button>
          <Link 
            href={`/${propertyCode}/staff/location`}
            className="flex items-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-500/10 transition-all"
          >
            <Compass size={16} /> Live Proximity Radar
          </Link>
        </div>
      </div>

      {/* ━━━ METRICS SUMMARY CARDS ━━━ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'Verified Punch-Ins/Outs',
            value: totalPunchesCount,
            subtitle: 'Total GPS locations tracked',
            color: 'text-indigo-400',
            bg: 'bg-indigo-950/20 border-indigo-900/30'
          },
          {
            title: 'Inside Restaurant Range',
            value: insideRestaurantCount,
            subtitle: 'Punches inside base boundary',
            color: 'text-emerald-400',
            bg: 'bg-emerald-950/15 border-emerald-900/20'
          },
          {
            title: 'Out of Range Alerts ⚠️',
            value: outOfRangeCount,
            subtitle: 'Punches logged outside limit',
            color: outOfRangeCount > 0 ? 'text-amber-400' : 'text-slate-400',
            bg: outOfRangeCount > 0 ? 'bg-amber-950/20 border-amber-900/30' : 'bg-slate-900/20 border-slate-800/30',
            animate: outOfRangeCount > 0 ? 'animate-pulse' : ''
          },
          {
            title: 'Alert Compliance Score',
            value: totalPunchesCount > 0 ? `${Math.round(((totalPunchesCount - outOfRangeCount) / totalPunchesCount) * 100)}%` : '100%',
            subtitle: 'Punch accuracy compliance rate',
            color: 'text-sky-400',
            bg: 'bg-sky-950/20 border-sky-900/30'
          }
        ].map((card, idx) => (
          <div key={idx} className={`border rounded-[24px] p-6 shadow-sm ${card.bg}`}>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{card.title}</div>
            <div className={`text-3xl font-black mt-2 leading-none ${card.color} ${card.animate || ''}`}>{card.value}</div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-2">{card.subtitle}</div>
          </div>
        ))}
      </div>

      {/* ━━━ FILTERS & SEARCH BAR ━━━ */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-slate-900 p-6 rounded-[32px] border border-slate-800/80 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Search employee by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-6 py-4 bg-slate-950 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-semibold text-white placeholder-slate-500"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Month Picker */}
          <input 
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{ colorScheme: 'dark' }}
            className="px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-black uppercase tracking-wider text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
          />

          {/* Event Filter */}
          <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
            {[
              { key: 'ALL' as const, label: 'All Punches' },
              { key: 'CLOCK_IN_ONLY' as const, label: 'In' },
              { key: 'CLOCK_OUT_ONLY' as const, label: 'Out' }
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setEventFilter(f.key)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${eventFilter === f.key ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Proximity Filter */}
          <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
            {[
              { key: 'ALL' as const, label: 'All Ranges' },
              { key: 'INSIDE' as const, label: 'Inside' },
              { key: 'OUT_OF_RANGE' as const, label: 'Out of Range' }
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setProximityFilter(f.key)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${proximityFilter === f.key ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ━━━ PUNCH LOG CARD GRID ━━━ */}
      {loading ? (
        <div className="py-24 text-center">
          <Loader2 className="animate-spin mx-auto text-indigo-500 mb-4" size={40} />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Attendance Map Coordinates...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="py-24 text-center bg-slate-900 border border-slate-800/80 rounded-[32px]">
          <AlertTriangle className="mx-auto text-slate-500 mb-4" size={36} />
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No punch location logs found</p>
          <p className="text-xs text-slate-600 uppercase tracking-wider mt-1">Try adjusting your filter search settings.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map(dateKey => {
            const dayLogs = logsByDate[dateKey];
            const isExpanded = !!expandedDates[dateKey];
            
            // Count metrics for this specific day
            const dayOutOfRange = dayLogs.reduce((acc, log) => {
              let count = 0;
              if (log.isOutOfRangeIn) count++;
              if (log.isOutOfRangeOut) count++;
              return acc + count;
            }, 0);

            return (
              <div 
                key={dateKey} 
                className="bg-slate-900 border border-slate-800/80 rounded-[32px] overflow-hidden transition-all"
              >
                {/* Collapsible Header */}
                <button
                  onClick={() => setExpandedDates(prev => ({ ...prev, [dateKey]: !prev[dateKey] }))}
                  className="w-full flex items-center justify-between p-6 hover:bg-slate-850/40 transition-colors text-left"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <Calendar className="text-indigo-400" size={18} />
                    <span className="text-sm font-black text-white">{getDayName(dayLogs[0].clockIn)}</span>
                    <div className="flex gap-2">
                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {dayLogs.length} {dayLogs.length === 1 ? 'Employee' : 'Employees'}
                      </span>
                      {dayOutOfRange > 0 && (
                        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                          ⚠️ {dayOutOfRange} Alert{dayOutOfRange === 1 ? '' : 's'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      {isExpanded ? 'Collapse' : 'Expand'}
                    </span>
                    <svg 
                      className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Collapsible Card List Grid */}
                {isExpanded && (
                  <div className="p-6 pt-0 border-t border-slate-800/40 bg-slate-950/20">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      {dayLogs.map((log) => {
                        const hasIn = !!log.locationIn;
                        const hasOut = !!log.locationOut;

                        return (
                          <div 
                            key={log.id} 
                            className={`border rounded-[32px] p-6 bg-slate-900 flex flex-col justify-between transition-all ${
                              log.isOutOfRangeIn || log.isOutOfRangeOut 
                                ? 'border-amber-500/20 shadow-md shadow-amber-500/5' 
                                : 'border-slate-800/80 hover:border-slate-700/80'
                            }`}
                          >
                            {/* Header */}
                            <div>
                              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-indigo-400 font-black text-sm">
                                    {log.employeeName.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="text-sm font-black text-white leading-none">{log.employeeName}</div>
                                    <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1">{log.employeeRole}</div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs font-bold text-slate-400">{getDayName(log.clockIn)}</div>
                                  <div className="text-[9px] font-black uppercase tracking-wider text-indigo-400 mt-1">
                                    {calculateDuration(log.clockIn, log.clockOut)}
                                  </div>
                                </div>
                              </div>

                              {/* Punch Details */}
                              <div className="space-y-4">
                                {/* Clock In Punch */}
                                {hasIn && (
                                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/60">
                                    <div className="flex justify-between items-center mb-2">
                                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                        Clock In Location
                                      </span>
                                      <span className="text-xs font-black text-emerald-400">{getTimeOnly(log.clockIn)}</span>
                                    </div>
                                    
                                    <div className="flex flex-col gap-2 mt-3">
                                      <div className="flex items-start justify-between gap-4 text-xs text-slate-400">
                                        <span className="font-bold text-slate-500 uppercase tracking-widest text-[9px] mt-0.5 shrink-0">Location:</span>
                                        <span className="text-right text-[11px] max-w-[200px] line-clamp-2">
                                          <ResolvedAddress 
                                            coordinates={log.locationIn} 
                                            isOutOfRange={log.isOutOfRangeIn} 
                                            defaultLabel={propertyName} 
                                          />
                                        </span>
                                      </div>
                                      
                                      <div className="flex items-center justify-between text-xs text-slate-400">
                                        <span className="font-bold text-slate-500 uppercase tracking-widest text-[9px]">Base Distance:</span>
                                        {log.distanceIn !== null ? (
                                          <span className={`font-black uppercase tracking-wider text-[10px] ${log.isOutOfRangeIn ? 'text-amber-400' : 'text-slate-300'}`}>
                                            {log.distanceIn < 1000 ? `${Math.round(log.distanceIn)}m` : `${(log.distanceIn / 1000).toFixed(2)}km`} 
                                            {log.isOutOfRangeIn ? ' (Out of Range ⚠️)' : ' (Inside)'}
                                          </span>
                                        ) : (
                                          <span>—</span>
                                        )}
                                      </div>

                                      <div className="flex justify-end mt-2 pt-2 border-t border-slate-800">
                                        <a 
                                          href={`https://www.google.com/maps?q=${log.locationIn}`} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-[10px] font-black uppercase tracking-wider text-indigo-400 hover:text-indigo-300 transition-colors"
                                        >
                                          <ExternalLink size={10} /> Open Google Maps
                                        </a>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Clock Out Punch */}
                                {hasOut ? (
                                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/60">
                                    <div className="flex justify-between items-center mb-2">
                                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-widest bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                        Clock Out Location
                                      </span>
                                      <span className="text-xs font-black text-rose-400">{getTimeOnly(log.clockOut!)}</span>
                                    </div>
                                    
                                    <div className="flex flex-col gap-2 mt-3">
                                      <div className="flex items-start justify-between gap-4 text-xs text-slate-400">
                                        <span className="font-bold text-slate-500 uppercase tracking-widest text-[9px] mt-0.5 shrink-0">Location:</span>
                                        <span className="text-right text-[11px] max-w-[200px] line-clamp-2">
                                          <ResolvedAddress 
                                            coordinates={log.locationOut!} 
                                            isOutOfRange={log.isOutOfRangeOut} 
                                            defaultLabel={propertyName} 
                                          />
                                        </span>
                                      </div>
                                      
                                      <div className="flex items-center justify-between text-xs text-slate-400">
                                        <span className="font-bold text-slate-500 uppercase tracking-widest text-[9px]">Base Distance:</span>
                                        {log.distanceOut !== null ? (
                                          <span className={`font-black uppercase tracking-wider text-[10px] ${log.isOutOfRangeOut ? 'text-amber-400' : 'text-slate-300'}`}>
                                            {log.distanceOut < 1000 ? `${Math.round(log.distanceOut)}m` : `${(log.distanceOut / 1000).toFixed(2)}km`} 
                                            {log.isOutOfRangeOut ? ' (Out of Range ⚠️)' : ' (Inside)'}
                                          </span>
                                        ) : (
                                          <span>—</span>
                                        )}
                                      </div>

                                      <div className="flex justify-end mt-2 pt-2 border-t border-slate-800">
                                        <a 
                                          href={`https://www.google.com/maps?q=${log.locationOut}`} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-[10px] font-black uppercase tracking-wider text-indigo-400 hover:text-indigo-300 transition-colors"
                                        >
                                          <ExternalLink size={10} /> Open Google Maps
                                        </a>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="p-4 rounded-2xl bg-slate-950/40 border border-dashed border-slate-800 text-center flex items-center justify-center gap-2 py-6">
                                    <span className="relative flex h-2 w-2">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                    </span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Shift ongoing (not punched out)</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Footer notes */}
                            {log.note && (
                              <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-500 font-semibold italic">
                                Note: "{log.note}"
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      
    </div>
  );
}
