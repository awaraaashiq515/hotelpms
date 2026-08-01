'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DoorOpen, CheckCircle2 } from 'lucide-react';
import { CheckoutGuestCard } from '@/components/hotel/checkout/CheckoutGuestCard';
import { CheckoutFilters } from '@/components/hotel/checkout/CheckoutFilters';

export interface CheckInRecord {
  id: string;         // checkIn ID (or fallback)
  folioId: string;    // folio ID — used for direct fetch in detail page
  checkedInAt: string;
  expectedCheckoutAt: string;
  status: string;
  guest?: { id: string; firstName: string; lastName?: string; mobile?: string };
  room?: { roomNumber: string; floor?: string; roomType?: { name: string } };
  reservation?: {
    id: string;
    bookingNo: string;
    totalAmount: number;
    advanceAmount: number;
    dueAmount: number;
    arrivalDate: string;
    departureDate: string;
  };
}

function isOverdue(expectedDate: string) {
  return new Date(expectedDate) < new Date();
}

export default function CheckoutPage() {
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'today' | 'overdue'>('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hotel/folios').then((r) => r.json());
      if (res.success && Array.isArray(res.data)) {
        const records: CheckInRecord[] = res.data.map((folio: any) => {
          const activeCheckIn = folio.reservation?.checkIns?.[0];
          const room = folio.reservation?.rooms?.[0]?.room;
          return {
            id: activeCheckIn?.id || `folio-${folio.id}`,
            folioId: folio.id,   // ← KEY: used for direct fetch on detail page
            checkedInAt: activeCheckIn?.checkedInAt || folio.reservation?.arrivalDate || new Date().toISOString(),
            expectedCheckoutAt: activeCheckIn?.expectedCheckoutAt || folio.reservation?.departureDate || new Date().toISOString(),
            status: activeCheckIn?.status || 'ACTIVE',
            guest: folio.guest
              ? { id: folio.guest.id, firstName: folio.guest.firstName, lastName: folio.guest.lastName, mobile: folio.guest.mobile }
              : undefined,
            room: room
              ? { roomNumber: room.roomNumber, floor: room.floor, roomType: folio.reservation?.roomType ? { name: folio.reservation.roomType.name } : undefined }
              : undefined,
            reservation: folio.reservation
              ? {
                  id: folio.reservation.id,
                  bookingNo: folio.reservation.bookingNo,
                  totalAmount: folio.reservation.totalAmount,
                  advanceAmount: folio.reservation.advanceAmount,
                  dueAmount: folio.closingBalance,
                  arrivalDate: folio.reservation.arrivalDate,
                  departureDate: folio.reservation.departureDate,
                }
              : undefined,
          };
        });
        setCheckIns(records);
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayCount = checkIns.filter((ci) => new Date(ci.expectedCheckoutAt).toISOString().split('T')[0] === todayStr).length;
  const overdueCount = checkIns.filter((ci) => isOverdue(ci.expectedCheckoutAt)).length;

  const filtered = checkIns.filter((ci) => {
    const nameMatch =
      !search ||
      `${ci.guest?.firstName} ${ci.guest?.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      ci.reservation?.bookingNo.toLowerCase().includes(search.toLowerCase()) ||
      ci.room?.roomNumber.includes(search);
    if (!nameMatch) return false;
    if (filter === 'today') return new Date(ci.expectedCheckoutAt).toISOString().split('T')[0] === todayStr;
    if (filter === 'overdue') return isOverdue(ci.expectedCheckoutAt);
    return true;
  });

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <DoorOpen className="text-orange-400" size={24} /> Check-out
          </h1>
          <p className="text-xs text-slate-500 font-bold mt-1">
            {checkIns.length} in-house · {todayCount} due today · {overdueCount} overdue
          </p>
        </div>
      </div>

      <CheckoutFilters
        filter={filter}
        onFilterChange={setFilter}
        search={search}
        onSearchChange={setSearch}
        counts={{ all: checkIns.length, today: todayCount, overdue: overdueCount }}
        onRefresh={load}
        loading={loading}
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 border-4 border-orange-500/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-t-orange-500 rounded-full animate-spin" />
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <CheckCircle2 size={40} className="text-emerald-600 mx-auto mb-3" />
          <p className="text-slate-400 font-bold text-sm">
            {search ? 'No matching guests found' : 'All guests checked out!'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {filtered.map((ci) => (
            <CheckoutGuestCard key={ci.id} checkIn={ci} />
          ))}
        </div>
      )}
    </div>
  );
}
