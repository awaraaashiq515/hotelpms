import React from 'react';
import { Wrench, Calendar, CheckCircle2, Clock, AlertTriangle, Plus } from 'lucide-react';

export interface PPMTask {
  id: string;
  assetName: string;
  assetId: string;
  taskType: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
  lastDone?: string;
  nextDue: string;
  assignedTo?: string;
  status: 'OVERDUE' | 'DUE_SOON' | 'OK' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
}

const STATUS_CONFIG: Record<string, { color: string; icon: React.ElementType }> = {
  OVERDUE:   { color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',     icon: AlertTriangle },
  DUE_SOON:  { color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',  icon: Clock },
  OK:        { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 },
  COMPLETED: { color: 'text-slate-400 bg-slate-800 border-slate-700',        icon: CheckCircle2 },
};

interface PPMScheduleProps {
  tasks: PPMTask[];
  onComplete?: (id: string) => void;
}

export function PPMSchedule({ tasks, onComplete }: PPMScheduleProps) {
  const overdue  = tasks.filter(t => t.status === 'OVERDUE').length;
  const dueSoon  = tasks.filter(t => t.status === 'DUE_SOON').length;

  return (
    <div className="space-y-3">
      {/* Summary */}
      {(overdue > 0 || dueSoon > 0) && (
        <div className="flex gap-3">
          {overdue > 0 && (
            <div className="flex-1 rounded-xl border border-rose-500/20 bg-rose-900/10 p-3 flex items-center gap-2">
              <AlertTriangle size={14} className="text-rose-400" />
              <span className="text-xs font-black text-rose-300">{overdue} Overdue Tasks</span>
            </div>
          )}
          {dueSoon > 0 && (
            <div className="flex-1 rounded-xl border border-amber-500/20 bg-amber-900/10 p-3 flex items-center gap-2">
              <Clock size={14} className="text-amber-400" />
              <span className="text-xs font-black text-amber-300">{dueSoon} Due Soon</span>
            </div>
          )}
        </div>
      )}

      {/* Task List */}
      <div className="rounded-2xl bg-slate-900/50 border border-white/5 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench size={13} className="text-orange-400" />
            <span className="text-[11px] font-black text-white uppercase tracking-wider">PPM Schedule</span>
          </div>
          <span className="text-[9px] text-slate-500">{tasks.length} tasks</span>
        </div>
        <div className="divide-y divide-white/5">
          {tasks.map(task => {
            const cfg = STATUS_CONFIG[task.status];
            return (
              <div key={task.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${cfg.color}`}>
                  <cfg.icon size={13} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black text-white">{task.assetName}</p>
                  <p className="text-[9px] text-slate-500">
                    {task.taskType} · {task.frequency}
                    {task.assignedTo ? ` · ${task.assignedTo}` : ''}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] font-black text-white">{task.nextDue}</p>
                  <p className="text-[8px] text-slate-600">Next Due</p>
                </div>
                {task.status !== 'COMPLETED' && (
                  <button onClick={() => onComplete?.(task.id)}
                    className="shrink-0 text-[9px] font-black text-indigo-400 hover:text-indigo-300 ml-2">
                    Done
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
