import React from 'react';
import { Wrench } from 'lucide-react';
import { SectionCard } from '@/components/hotel/ui/SectionCard';
import { EmptyState } from '@/components/hotel/ui/EmptyState';
import { StatusBadge, priorityVariant } from '@/components/hotel/ui/StatusBadge';
import type { DashboardData } from '@/types/hotel/dashboard.types';

interface MaintenanceWidgetProps { data: DashboardData; }

export function MaintenanceWidget({ data }: MaintenanceWidgetProps) {
  const alerts = data.maintenanceAlerts.slice(0, 6);

  return (
    <SectionCard
      title="Maintenance Alerts"
      icon={Wrench} iconColor="text-red-400"
      href="/hotel/maintenance"
      badge={alerts.length}
      badgeColor="bg-red-500"
    >
      <div className="px-4 divide-y divide-white/5">
        {alerts.length === 0
          ? <EmptyState message="No open maintenance issues" />
          : alerts.map(m => (
              <div key={m.id} className="py-2.5 flex items-start gap-2">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                  m.priority === 'URGENT' || m.priority === 'HIGH'
                    ? 'bg-rose-400 animate-pulse'
                    : 'bg-amber-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black text-white truncate">
                    {m.issueType || m.title || 'Maintenance Issue'}
                  </p>
                  <p className="text-[9px] text-slate-500">
                    {m.room ? `Rm ${m.room.roomNumber} · ` : ''}{m.status}
                  </p>
                </div>
                <StatusBadge
                  label={m.priority || 'NORMAL'}
                  variant={priorityVariant(m.priority || 'NORMAL')}
                  pulse={m.priority === 'URGENT'}
                />
              </div>
            ))
        }
      </div>
    </SectionCard>
  );
}
