import React from 'react';
import Link from 'next/link';
import { BrushIcon } from 'lucide-react';
import { SectionCard } from '@/components/hotel/ui/SectionCard';
import { EmptyState } from '@/components/hotel/ui/EmptyState';
import { StatusBadge, priorityVariant } from '@/components/hotel/ui/StatusBadge';
import type { DashboardData } from '@/types/hotel/dashboard.types';

interface HousekeepingWidgetProps { data: DashboardData; }

export function HousekeepingWidget({ data }: HousekeepingWidgetProps) {
  const tasks = data.housekeepingTasks.slice(0, 5);

  return (
    <SectionCard
      title="Housekeeping Status"
      icon={BrushIcon} iconColor="text-teal-400"
      href="/hotel/housekeeping"
    >
      <div className="p-4 space-y-3">
        {/* Summary pills */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Pending',     value: data.hkPending,    color: 'text-amber-300 bg-amber-500/10 border-amber-500/20' },
            { label: 'In Progress', value: data.hkInProgress, color: 'text-sky-300 bg-sky-500/10 border-sky-500/20' },
            { label: 'Done',        value: data.hkDone,       color: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20' },
          ].map(s => (
            <div key={s.label} className={`rounded-xl border p-2.5 text-center ${s.color}`}>
              <p className="text-xl font-black">{s.value}</p>
              <p className="text-[8px] font-bold uppercase tracking-wider mt-0.5 opacity-70">{s.label}</p>
            </div>
          ))}
        </div>
        {/* Task list */}
        {tasks.length === 0
          ? <EmptyState message="All rooms clean ✓" size="sm" />
          : tasks.map(t => (
              <div key={t.id} className="flex items-center gap-2 py-1.5 border-b border-white/5 last:border-0">
                <div className={`w-2 h-2 rounded-full shrink-0 ${
                  t.status === 'DONE' || t.status === 'COMPLETED' ? 'bg-emerald-400'
                  : t.status === 'IN_PROGRESS' ? 'bg-sky-400'
                  : 'bg-amber-400'
                }`} />
                <span className="text-[10px] font-semibold text-white flex-1 truncate">
                  {t.taskType || 'Housekeeping'}{t.room ? ` — Rm ${t.room.roomNumber}` : ''}
                </span>
                <StatusBadge label={t.priority || 'NORMAL'} variant={priorityVariant(t.priority || 'NORMAL')} />
              </div>
            ))
        }
      </div>
    </SectionCard>
  );
}
