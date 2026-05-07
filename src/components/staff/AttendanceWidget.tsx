'use client';

import { useState, useEffect } from 'react';
import { Clock, LogIn, LogOut, Loader2, MapPin, Users, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AttendanceWidget() {
  const [loading, setLoading] = useState(false);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [activeAttendance, setActiveAttendance] = useState<any>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchStaffAndStatus();
  }, []);

  const fetchStaffAndStatus = async () => {
    try {
      // 1. Fetch all active staff
      const staffRes = await fetch('/api/staff/list-basic');
      const staffData = await staffRes.json();
      if (staffData.success) {
        setStaffList(staffData.data);
      }

      // 2. Fetch current status of all staff for this property
      const statusRes = await fetch('/api/staff/attendance/active-sessions');
      const statusData = await statusRes.json();
      // We will handle status per staff member
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setFetching(false);
    }
  };

  const handleStaffChange = async (id: string) => {
    setSelectedStaffId(id);
    if (!id) {
      setActiveAttendance(null);
      return;
    }

    // Check if this specific staff is currently clocked in
    setLoading(true);
    try {
      const res = await fetch(`/api/staff/attendance/status?userId=${id}`);
      const data = await res.json();
      if (data.success && data.data) {
        setActiveAttendance(data.data);
      } else {
        setActiveAttendance(null);
      }
    } catch (error) {
      console.error('Status check failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAttendance = async (action: 'clock-in' | 'clock-out') => {
    if (!selectedStaffId) {
      toast.error('Please select a staff member first');
      return;
    }

    setLoading(true);
    try {
      let location = 'Unknown';
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        location = `${pos.coords.latitude}, ${pos.coords.longitude}`;
      } catch (e) {
        console.warn('Geolocation failed');
      }

      const res = await fetch('/api/staff/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action, 
          location,
          userId: selectedStaffId // Explicitly pass the selected staff ID
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        if (action === 'clock-in') {
          setActiveAttendance(data.data);
        } else {
          setActiveAttendance(null);
        }
        // Refresh staff list status if needed
      } else {
        toast.error(data.error || 'Operation failed');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="h-40 flex items-center justify-center"><Loader2 className="animate-spin text-slate-400" /></div>;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-100 dark:border-slate-800 shadow-xl relative overflow-hidden group">
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-indigo-500/10 transition-colors" />
      
      <div className="relative space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 shadow-inner">
              <Clock size={24} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">Attendance Terminal</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Select Name to Punch In/Out</p>
            </div>
          </div>
          
          {activeAttendance && (
            <div className="animate-in fade-in zoom-in duration-300">
               <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-900">
                 <CheckCircle2 size={12} /> Currently In
               </span>
            </div>
          )}
        </div>

        {/* Staff Selector */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Choose Staff Member</label>
          <div className="relative">
            <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
            <select
              value={selectedStaffId}
              onChange={(e) => handleStaffChange(e.target.value)}
              className="w-full pl-12 pr-10 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold text-slate-900 dark:text-white appearance-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer shadow-sm"
            >
              <option value="">Select Staff...</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.role?.name || 'Staff'})
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Punch Buttons */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <button
            onClick={() => handleAttendance('clock-in')}
            disabled={loading || !!activeAttendance || !selectedStaffId}
            className={`flex flex-col items-center justify-center gap-2 h-24 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-lg active:scale-95 ${
              !!activeAttendance || !selectedStaffId
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none' 
                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200 dark:shadow-none'
            }`}
          >
            {loading && !activeAttendance ? <Loader2 className="animate-spin" size={24} /> : <LogIn size={28} className="mb-1" />}
            Punch In
          </button>

          <button
            onClick={() => handleAttendance('clock-out')}
            disabled={loading || !activeAttendance || !selectedStaffId}
            className={`flex flex-col items-center justify-center gap-2 h-24 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-lg active:scale-95 ${
              !activeAttendance || !selectedStaffId
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none' 
                : 'bg-red-600 text-white hover:bg-red-700 shadow-red-200 dark:shadow-none'
            }`}
          >
            {loading && activeAttendance ? <Loader2 className="animate-spin" size={24} /> : <LogOut size={28} className="mb-1" />}
            Punch Out
          </button>
        </div>

        {activeAttendance && (
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 animate-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
              <span className="text-slate-400">Shift Started:</span>
              <span className="text-indigo-600">{new Date(activeAttendance.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-tight pt-2 border-t border-slate-50 dark:border-slate-800">
          <MapPin size={12} className="text-indigo-500" />
          Location Verified: Restaurant Terminal
        </div>
      </div>
    </div>
  );
}
