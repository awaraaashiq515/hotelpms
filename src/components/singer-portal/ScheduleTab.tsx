import React from 'react';

interface Performance {
  id: string;
  venueName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  property: {
    name: string;
  };
}

interface ScheduleTabProps {
  schedules: Performance[];
}

export const ScheduleTab = ({ schedules }: ScheduleTabProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {schedules.length === 0 ? (
        <div className="col-span-full p-8 text-center text-slate-500 border border-slate-800 rounded-2xl">
          No upcoming performance slots scheduled yet.
        </div>
      ) : (
        schedules.map(perf => (
          <div key={perf.id} className="p-5 rounded-2xl bg-[#090f1e]/85 border border-slate-800 flex justify-between items-center">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  perf.status === 'LIVE' ? 'bg-emerald-500 animate-pulse' :
                  perf.status === 'SCHEDULED' ? 'bg-sky-450' : 'bg-slate-600'
                }`} />
                <h4 className="font-black text-sm text-white">{perf.venueName}</h4>
              </div>
              <p className="text-xs text-slate-400">{perf.property.name}</p>
              <div className="flex gap-3 text-[10px] text-slate-500 pt-1.5 font-bold uppercase">
                <span>{new Date(perf.date).toLocaleDateString()}</span>
                <span>{new Date(perf.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(perf.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
            </div>
            <span className={`px-2.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
              perf.status === 'LIVE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
              perf.status === 'SCHEDULED' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' :
              'bg-slate-850 text-slate-500'
            }`}>
              {perf.status}
            </span>
          </div>
        ))
      )}
    </div>
  );
};
