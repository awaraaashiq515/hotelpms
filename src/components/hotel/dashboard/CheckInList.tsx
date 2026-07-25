import React from 'react';
import { UserCheck } from 'lucide-react';
import { SectionCard } from '@/components/hotel/ui/SectionCard';
import { BookingRow } from '@/components/hotel/ui/BookingRow';
import { EmptyState } from '@/components/hotel/ui/EmptyState';
import type { DashboardData } from '@/types/hotel/dashboard.types';

interface CheckInListProps { data: DashboardData; }

export function CheckInList({ data }: CheckInListProps) {
  const items = data.checkinsToday.slice(0, 6);
  return (
    <SectionCard
      title="Today's Check-Ins"
      icon={UserCheck} iconColor="text-sky-400"
      href="/hotel/checkin"
      badge={items.length}
      badgeColor="bg-sky-500"
    >
      <div className="px-4 divide-y divide-white/5">
        {items.length === 0
          ? <EmptyState message="No check-ins scheduled today" />
          : items.map(b => <BookingRow key={b.id} booking={b} type="checkin" />)
        }
      </div>
    </SectionCard>
  );
}
