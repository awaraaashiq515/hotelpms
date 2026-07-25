'use client';

import React, { useMemo, useRef } from 'react';
import Link from 'next/link';

interface CalendarGridProps {
  rooms: any[];
  bookings: any[];
  dateArray: Date[];
  onSelectBooking: (booking: any) => void;
}

// Stable booking color based on booking ID (so same booking always same hue)
function getBookingStyle(status: string) {
  switch (status) {
    case 'CHECKED_IN':
      return {
        bg: 'bg-rose-600',
        border: 'border-rose-400/50',
        text: 'text-white',
        dot: 'bg-rose-300',
      };
    case 'CONFIRMED':
      return {
        bg: 'bg-indigo-600',
        border: 'border-indigo-400/50',
        text: 'text-white',
        dot: 'bg-indigo-300',
      };
    case 'CHECKED_OUT':
      return {
        bg: 'bg-slate-700',
        border: 'border-slate-600/50',
        text: 'text-slate-300',
        dot: 'bg-slate-500',
      };
    case 'PENDING':
      return {
        bg: 'bg-amber-600/80',
        border: 'border-amber-400/50',
        text: 'text-white',
        dot: 'bg-amber-300',
      };
    case 'CANCELLED':
      return {
        bg: 'bg-orange-800/60',
        border: 'border-orange-600/40',
        text: 'text-orange-300',
        dot: 'bg-orange-400',
      };
    default:
      return {
        bg: 'bg-slate-700',
        border: 'border-slate-600/50',
        text: 'text-slate-300',
        dot: 'bg-slate-400',
      };
  }
}

function getHousekeepingDot(status: string) {
  switch (status) {
    case 'CLEAN':
      return 'bg-emerald-400';
    case 'DIRTY':
      return 'bg-amber-400';
    case 'INSPECTED':
      return 'bg-sky-400';
    case 'OUT_OF_ORDER':
      return 'bg-rose-500';
    default:
      return 'bg-slate-600';
  }
}

export default function CalendarGrid({
  rooms,
  bookings,
  dateArray,
  onSelectBooking,
}: CalendarGridProps) {
  const today = new Date();
  const todayTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

  // Pre-build lookup: roomId -> Map<dateTime, booking>
  const bookingLookup = useMemo(() => {
    const lookup: Record<string, Record<number, any>> = {};
    for (const room of rooms) {
      lookup[room.id] = {};
    }

    for (const booking of bookings) {
      const arr = new Date(booking.arrivalDate);
      const dep = new Date(booking.departureDate);
      const arrTime = new Date(arr.getFullYear(), arr.getMonth(), arr.getDate()).getTime();
      const depTime = new Date(dep.getFullYear(), dep.getMonth(), dep.getDate()).getTime();

      // Find room IDs for this booking
      const roomIds: string[] = [];
      if (booking.assignedRoomId) roomIds.push(booking.assignedRoomId);
      if (booking.rooms) {
        for (const br of booking.rooms) {
          if (br.roomId && !roomIds.includes(br.roomId)) roomIds.push(br.roomId);
        }
      }

      for (const roomId of roomIds) {
        if (!lookup[roomId]) continue;
        let t = arrTime;
        while (t < depTime) {
          lookup[roomId][t] = booking;
          t += 86400000; // +1 day in ms
        }
      }
    }
    return lookup;
  }, [rooms, bookings]);

  return (
    <div className="rounded-3xl bg-[#0b1120] border border-slate-800 overflow-hidden shadow-2xl shadow-black/30">
      <div className="overflow-x-auto">
        <table className="border-collapse" style={{ minWidth: `${rooms.length > 0 ? 200 + dateArray.length * 72 : 600}px` }}>
          <thead>
            <tr className="border-b border-slate-800">
              {/* Room column header */}
              <th className="sticky left-0 z-20 bg-[#0b1120] border-r border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500 px-5 py-4 text-left min-w-[160px]">
                Rooms
              </th>
              {dateArray.map((date, idx) => {
                const dayName = date.toLocaleDateString('en-IN', { weekday: 'short' });
                const dayNum = date.getDate();
                const monthName = date.toLocaleDateString('en-IN', { month: 'short' });
                const isToday = date.toDateString() === today.toDateString();
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                return (
                  <th
                    key={idx}
                    className={`px-2 py-3 text-center border-r border-slate-800/70 min-w-[68px] ${
                      isToday
                        ? 'bg-indigo-500/10'
                        : isWeekend
                        ? 'bg-slate-900/30'
                        : ''
                    }`}
                  >
                    <p className={`text-[9px] font-black uppercase tracking-widest ${isToday ? 'text-indigo-400' : isWeekend ? 'text-slate-500' : 'text-slate-600'}`}>
                      {dayName}
                    </p>
                    <p className={`text-lg font-black leading-none mt-0.5 ${isToday ? 'text-indigo-300' : 'text-slate-300'}`}>
                      {dayNum}
                    </p>
                    <p className={`text-[9px] font-bold ${isToday ? 'text-indigo-500' : 'text-slate-700'}`}>
                      {monthName}
                    </p>
                    {isToday && (
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mx-auto mt-1" />
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/60">
            {rooms.length === 0 ? (
              <tr>
                <td
                  colSpan={dateArray.length + 1}
                  className="text-center py-16 text-slate-600 text-sm font-bold"
                >
                  No rooms found. Add rooms first from Room Management.
                </td>
              </tr>
            ) : (
              rooms.map((room) => {
                const hkDot = getHousekeepingDot(room.housekeepingStatus || '');
                const roomLookup = bookingLookup[room.id] || {};

                return (
                  <tr key={room.id} className="group hover:bg-slate-900/20 transition-colors">
                    {/* Room label — sticky */}
                    <td className="sticky left-0 z-10 bg-[#0b1120] group-hover:bg-[#0d1628] border-r border-slate-800 px-5 py-3 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div
                          title={room.housekeepingStatus || 'Unknown'}
                          className={`w-2 h-2 rounded-full shrink-0 ${hkDot}`}
                        />
                        <div>
                          <p className="font-black text-sm text-slate-200">
                            Room {room.roomNumber}
                          </p>
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                            {room.roomType?.name || room.roomType?.code || '—'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Date cells */}
                    {dateArray.map((date, idx) => {
                      const dateTime = new Date(
                        date.getFullYear(),
                        date.getMonth(),
                        date.getDate()
                      ).getTime();
                      const booking = roomLookup[dateTime];
                      const isToday = dateTime === todayTime;
                      const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                      // Check if this is the first day of the booking on this cell
                      const bookingStart = booking
                        ? new Date(
                            new Date(booking.arrivalDate).getFullYear(),
                            new Date(booking.arrivalDate).getMonth(),
                            new Date(booking.arrivalDate).getDate()
                          ).getTime()
                        : null;
                      const isFirstDay = bookingStart === dateTime;

                      if (booking) {
                        const style = getBookingStyle(booking.status);

                        return (
                          <td
                            key={idx}
                            onClick={() => onSelectBooking(booking)}
                            className={`border-r border-slate-800/50 p-0.5 cursor-pointer relative ${
                              isToday ? 'bg-indigo-500/[0.03]' : isWeekend ? 'bg-slate-900/20' : ''
                            }`}
                          >
                            <div
                              className={`h-10 px-2 flex items-center gap-1.5 rounded-lg border transition-all hover:brightness-110 active:scale-95 ${style.bg} ${style.border} ${style.text} ${
                                isFirstDay ? 'rounded-l-lg' : 'rounded-l-none border-l-0'
                              }`}
                            >
                              {isFirstDay && (
                                <>
                                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
                                  <span className="text-[10px] font-black truncate tracking-wide">
                                    {booking.guest?.firstName} {booking.guest?.lastName?.charAt(0)}.
                                  </span>
                                </>
                              )}
                            </div>
                          </td>
                        );
                      }

                      // Empty cell — quick book link
                      const checkinStr = date.toISOString().split('T')[0];
                      const nextDay = new Date(date);
                      nextDay.setDate(nextDay.getDate() + 1);
                      const checkoutStr = nextDay.toISOString().split('T')[0];

                      return (
                        <td
                          key={idx}
                          className={`border-r border-slate-800/50 p-0.5 ${
                            isToday ? 'bg-indigo-500/[0.03]' : isWeekend ? 'bg-slate-900/20' : ''
                          }`}
                        >
                          <Link
                            href={`/hotel/bookings?roomId=${room.id}&arr=${checkinStr}&dep=${checkoutStr}`}
                            className="h-10 flex items-center justify-center text-transparent hover:text-slate-600 text-[9px] font-black uppercase tracking-widest transition-all rounded-lg hover:bg-slate-800/40 w-full"
                          >
                            + Book
                          </Link>
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="px-6 py-3 border-t border-slate-800/60 bg-slate-900/20 flex flex-wrap gap-4">
        {[
          { color: 'bg-indigo-600', label: 'Confirmed' },
          { color: 'bg-rose-600', label: 'Checked In' },
          { color: 'bg-amber-600/80', label: 'Pending' },
          { color: 'bg-slate-700', label: 'Checked Out' },
          { color: 'bg-orange-800/60', label: 'Cancelled' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-sm ${item.color}`} />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {item.label}
            </span>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-4">
          {[
            { color: 'bg-emerald-400', label: 'Clean' },
            { color: 'bg-amber-400', label: 'Dirty' },
            { color: 'bg-rose-500', label: 'Out of Order' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${item.color}`} />
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
