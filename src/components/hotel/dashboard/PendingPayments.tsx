import React from 'react';
import { CreditCard } from 'lucide-react';
import { SectionCard } from '@/components/hotel/ui/SectionCard';
import { BookingRow } from '@/components/hotel/ui/BookingRow';
import { EmptyState } from '@/components/hotel/ui/EmptyState';
import type { DashboardData } from '@/types/hotel/dashboard.types';

interface PendingPaymentsProps { data: DashboardData; }

export function PendingPayments({ data }: PendingPaymentsProps) {
  const items = data.pendingPayments.slice(0, 5);
  return (
    <SectionCard
      title="Pending Payments"
      icon={CreditCard} iconColor="text-amber-400"
      href="/hotel/billing"
      badge={items.length}
      badgeColor="bg-amber-500"
    >
      <div className="px-4 divide-y divide-white/5">
        {items.length === 0
          ? <EmptyState message="All payments cleared ✓" />
          : items.map(b => <BookingRow key={b.id} booking={b} type="pending" />)
        }
      </div>
    </SectionCard>
  );
}
