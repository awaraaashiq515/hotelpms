'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { 
  Users, 
  Clock, 
  MapPin, 
  Calendar, 
  Search,
  Filter,
  ArrowRight,
  Loader2,
  Compass
} from 'lucide-react';
import { format } from 'date-fns';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function AttendanceReportPage() {
  const params = useParams();
  const propertyCode = params?.propertyCode as string;
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      const res = await fetch('/api/staff/attendance/report');
      const data = await res.json();
      if (data.success) {
        setAttendance(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch report', error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = attendance.filter(record => 
    record.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateDuration = (inTime: string, outTime: string | null) => {
    if (!outTime) return 'Active';
    const diff = new Date(outTime).getTime() - new Date(inTime).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-8 pb-20">
      <PageHeader 
        title="Staff Attendance Report" 
        subtitle="Track employee work hours, shifts, and punch locations."
      />

      {/* Quick Access to Geolocation Tools */}
      <div className="flex justify-end gap-3 flex-wrap">
        <Link 
          href={`/${propertyCode}/staff/attendance-location`}
          className="flex items-center gap-2 px-6 py-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-100 rounded-2xl text-xs font-black uppercase tracking-widest transition-all hover:-translate-y-0.5"
        >
          <MapPin size={14} className="text-emerald-500" />
          Verify Punch Locations Map
        </Link>
        <Link 
          href={`/${propertyCode}/staff/location`}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg transition-all hover:-translate-y-0.5"
        >
          <Compass size={14} />
          View Live Proximity Radar
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Search staff name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
            <Filter size={16} /> Filter Date
          </button>
        </div>
      </div>

      {/* Report Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Staff Member</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Date</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Clock In</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Clock Out</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Duration</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Location</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-8 py-20 text-center">
                    <Loader2 className="animate-spin mx-auto text-indigo-500 mb-4" size={32} />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Records...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-8 py-20 text-center">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No records found</p>
                  </td>
                </tr>
              ) : filtered.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 font-black text-xs">
                        {record.employeeName.charAt(0)}
                      </div>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{record.employeeName}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                      {format(new Date(record.clockIn), 'MMM dd, yyyy')}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-emerald-600">{format(new Date(record.clockIn), 'hh:mm a')}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      {record.clockOut ? (
                        <span className="text-xs font-black text-red-600">{format(new Date(record.clockOut), 'hh:mm a')}</span>
                      ) : (
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Ongoing</span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {calculateDuration(record.clockIn, record.clockOut)}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-2">
                      {record.locationIn && (
                        <div className="flex flex-col">
                          <a 
                            href={`https://www.google.com/maps?q=${record.locationIn}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 transition-colors w-fit"
                          >
                            <MapPin size={12} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">In Map</span>
                          </a>
                          {record.distanceIn !== undefined && record.distanceIn !== null && (
                            <span className={`text-[9px] font-black mt-0.5 uppercase tracking-wide ${record.isOutOfRangeIn ? 'text-amber-500' : 'text-slate-400'}`}>
                              📍 {record.distanceIn < 1000 ? `${Math.round(record.distanceIn)}m` : `${(record.distanceIn / 1000).toFixed(2)}km`} 
                              {record.isOutOfRangeIn ? ' (Out of Range)' : ' (Inside)'}
                            </span>
                          )}
                        </div>
                      )}
                      {record.locationOut && (
                        <div className="flex flex-col">
                          <a 
                            href={`https://www.google.com/maps?q=${record.locationOut}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-rose-600 hover:text-rose-700 transition-colors w-fit"
                          >
                            <MapPin size={12} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Out Map</span>
                          </a>
                          {record.distanceOut !== undefined && record.distanceOut !== null && (
                            <span className={`text-[9px] font-black mt-0.5 uppercase tracking-wide ${record.isOutOfRangeOut ? 'text-amber-500' : 'text-slate-400'}`}>
                              📍 {record.distanceOut < 1000 ? `${Math.round(record.distanceOut)}m` : `${(record.distanceOut / 1000).toFixed(2)}km`} 
                              {record.isOutOfRangeOut ? ' (Out of Range)' : ' (Inside)'}
                            </span>
                          )}
                        </div>
                      )}
                      {!record.locationIn && !record.locationOut && (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                      record.status === 'PRESENT' 
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                        : 'bg-amber-50 text-amber-600 border border-amber-100'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
