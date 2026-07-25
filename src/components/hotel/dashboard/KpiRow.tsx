import React from 'react';
import { StatCard } from '@/components/hotel/ui/StatCard';
import {
  UserCheck, DoorOpen, Bed, BedDouble,
  AlertTriangle, CreditCard, Globe, PhoneCall,
} from 'lucide-react';
import type { DashboardData } from '@/types/hotel/dashboard.types';

interface KpiRowProps { data: DashboardData; }

export function KpiRow({ data }: KpiRowProps) {
  const cards = [
    { label: 'Check-Ins Today',  value: data.checkinsToday.length,   icon: UserCheck,     color: 'border-sky-500/20 bg-sky-900/20 text-sky-300',         href: '/hotel/checkin' },
    { label: 'Check-Outs Today', value: data.checkoutsToday.length,  icon: DoorOpen,      color: 'border-orange-500/20 bg-orange-900/20 text-orange-300', href: '/hotel/checkout' },
    { label: 'Vacant Rooms',     value: data.vacantRooms,            icon: Bed,           color: 'border-emerald-500/20 bg-emerald-900/20 text-emerald-300', href: '/hotel/rooms' },
    { label: 'Occupied Rooms',   value: data.occupiedRooms,          icon: BedDouble,     color: 'border-rose-500/20 bg-rose-900/20 text-rose-300',       href: '/hotel/rooms' },
    { label: 'Out of Order',     value: data.outOfOrder,             icon: AlertTriangle, color: 'border-slate-500/20 bg-slate-800/40 text-slate-400',     href: '/hotel/rooms' },
    { label: 'Pending Payments', value: data.pendingPayments.length, icon: CreditCard,    color: 'border-amber-500/20 bg-amber-900/20 text-amber-300',    href: '/hotel/billing' },
    { label: 'OTA Bookings',     value: data.otaBookings,            icon: Globe,         color: 'border-purple-500/20 bg-purple-900/20 text-purple-300' },
    { label: 'Direct Bookings',  value: data.directBookings,         icon: PhoneCall,     color: 'border-indigo-500/20 bg-indigo-900/20 text-indigo-300', href: '/hotel/bookings' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
      {cards.map(c => <StatCard key={c.label} {...c} />)}
    </div>
  );
}
