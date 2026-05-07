'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  Clock, 
  LogIn, 
  LogOut, 
  Loader2, 
  Monitor,
  Zap,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function AttendanceHubSection() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [punchingId, setPunchingId] = useState<string | null>(null);

  useEffect(() => {
    fetchStaffStatus();
  }, []);

  const fetchStaffStatus = async () => {
    try {
      const res = await fetch('/api/staff/attendance/hub-data');
      const data = await res.json();
      if (data.success) {
        setStaff(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch hub data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAttendance = async (userId: string, action: 'clock-in' | 'clock-out') => {
    setPunchingId(userId);
    try {
      let location = 'Unknown';
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
        });
        location = `${pos.coords.latitude}, ${pos.coords.longitude}`;
      } catch (e) {
        console.warn('Geolocation failed');
      }

      const res = await fetch('/api/staff/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, location, userId })
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchStaffStatus();
      } else {
        toast.error(data.error || 'Operation failed');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setPunchingId(null);
    }
  };

  if (loading) return (
    <div className="py-20 text-center">
      <div className="relative inline-block">
        <Loader2 className="animate-spin text-pos-primary" size={40} />
        <div className="absolute inset-0 bg-pos-primary/20 blur-xl rounded-full" />
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-4">Initializing Terminal Matrix...</p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {staff.map((s: any) => (
        <div 
          key={s.id}
          className={`relative group bg-white dark:bg-slate-900 rounded-[40px] p-8 border transition-all duration-500 overflow-hidden ${
            s.activeSession 
              ? 'border-emerald-500/30 shadow-[0_20px_50px_-12px_rgba(16,185,129,0.1)] ring-1 ring-emerald-500/10' 
              : 'border-slate-100 dark:border-white/5 shadow-sm hover:shadow-xl hover:-translate-y-1'
          }`}
        >
          {/* Status Glow */}
          {s.activeSession && (
            <div className="absolute top-0 right-0 p-3">
               <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/20">
                  <span className="w-1 h-1 bg-white rounded-full animate-ping" />
                  <span className="text-[7px] font-black text-white uppercase tracking-widest">Live</span>
               </div>
            </div>
          )}

          <div className="flex flex-col items-center space-y-5">
            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center text-xl font-black shadow-inner transition-all duration-500 ${
              s.activeSession 
                ? 'bg-gradient-to-br from-emerald-400 to-teal-600 text-white rotate-3' 
                : 'bg-slate-50 dark:bg-slate-800 text-slate-300'
            }`}>
              {s.fullName.charAt(0)}
            </div>
            
            <div className="text-center">
              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{s.fullName}</h4>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1 flex items-center justify-center gap-1.5">
                <Monitor size={8} className={s.type === 'USER' ? 'text-indigo-500' : 'text-amber-500'} />
                {s.role?.name || 'Personnel'}
              </p>
            </div>

            <div className="w-full pt-2">
              {s.activeSession ? (
                <button
                  onClick={() => handleAttendance(s.id, 'clock-out')}
                  disabled={punchingId === s.id}
                  className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-[9px] uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {punchingId === s.id ? <Loader2 className="animate-spin" size={12} /> : <LogOut size={14} />}
                  Clock Out
                </button>
              ) : (
                <button
                  onClick={() => handleAttendance(s.id, 'clock-in')}
                  disabled={punchingId === s.id}
                  className="w-full py-4 bg-pos-primary hover:bg-pos-primary-dark text-white rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-pos-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {punchingId === s.id ? <Loader2 className="animate-spin" size={12} /> : <LogIn size={14} />}
                  Clock In
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
