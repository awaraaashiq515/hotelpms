import React from 'react';
import { DoorOpen } from 'lucide-react';
import { SectionCard } from '@/components/hotel/ui/SectionCard';
import { BookingRow } from '@/components/hotel/ui/BookingRow';
import { EmptyState } from '@/components/hotel/ui/EmptyState';
import type { DashboardData } from '@/types/hotel/dashboard.types';

interface CheckOutListProps { data: DashboardData; }

export function CheckOutList({ data }: CheckOutListProps) {
  const items = data.checkoutsToday.slice(0, 6);
  return (
    <SectionCard
      title="Today's Check-Outs"
      icon={DoorOpen} iconColor="text-orange-400"
      href="/hotel/checkout"
      badge={items.length}
      badgeColor="bg-orange-500"
    >
      <div className="px-4 divide-y divide-white/5">
        {items.length === 0
          ? <EmptyState message="No check-outs today" />
          : items.map(b => <BookingRow key={b.id} booking={b} type="checkout" />)
        }
      </div>
    </SectionCard>
  );
}
