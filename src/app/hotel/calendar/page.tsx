'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Loader2, 
  ChevronLeft, 
  ChevronRight, 
  CalendarDays,
  User,
  Phone,
  Bookmark
} from 'lucide-react';
import Link from 'next/link';

export default function RoomCalendar() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/hotel/rooms').then((res) => res.json()),
      fetch('/api/hotel/bookings').then((res) => res.json()),
    ])
      .then(([roomsRes, bookingsRes]) => {
        if (roomsRes.success) setRooms(roomsRes.data);
        if (bookingsRes.success) setBookings(bookingsRes.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading calendar data:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  // Generate 14 days from startDate
  const daysToShow = 14;
  const dateArray: Date[] = [];
  for (let i = 0; i < daysToShow; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    dateArray.push(d);
  }

  const shiftDates = (amount: number) => {
    const newStart = new Date(startDate);
    newStart.setDate(startDate.getDate() + amount);
    setStartDate(newStart);
  };

  const getBookingForRoomAndDate = (roomId: string, date: Date) => {
    const targetTime = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    
    return bookings.find((b) => {
      // Must match room ID
      const hasRoom = b.assignedRoomId === roomId || b.rooms?.some((br: any) => br.roomId === roomId);
      if (!hasRoom) return false;
      
      const arr = new Date(b.arrivalDate);
      const arrTime = new Date(arr.getFullYear(), arr.getMonth(), arr.getDate()).getTime();
      
      const dep = new Date(b.departureDate);
      const depTime = new Date(dep.getFullYear(), dep.getMonth(), dep.getDate()).getTime();

      // Check if target date falls between arrival (inclusive) and departure (exclusive)
      return targetTime >= arrTime && targetTime < depTime;
    });
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-indigo-400">
            <Sparkles size={12} /> Visual Planner
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-white leading-none">
            Room Timeline Grid
          </h1>
        </div>

        {/* Date Selector Navigation */}
        <div className="flex items-center gap-2 bg-[#0f172a] border border-slate-800 p-1.5 rounded-xl">
          <button 
            onClick={() => shiftDates(-7)}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-bold text-slate-200 px-3 uppercase tracking-wider">
            {startDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <button 
            onClick={() => shiftDates(7)}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Grid Timeline Container */}
      <div className="rounded-3xl bg-[#0f172a] border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/40">
                <th className="sticky left-0 z-10 bg-[#0f172a] border-r border-slate-800 text-xs font-black uppercase tracking-widest text-slate-400 px-4 py-4 text-left w-36 shrink-0">
                  Rooms
                </th>
                {dateArray.map((date, idx) => {
                  const dayName = date.toLocaleDateString('en-IN', { weekday: 'short' });
                  const dayNum = date.getDate();
                  const isToday = date.toDateString() === new Date().toDateString();

                  return (
                    <th 
                      key={idx} 
                      className={`px-3 py-3 text-center border-r border-slate-800 min-w-[70px] ${
                        isToday ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-500'
                      }`}
                    >
                      <p className="text-[10px] font-bold uppercase">{dayName}</p>
                      <p className={`text-base font-black mt-0.5 ${isToday ? 'text-indigo-400' : 'text-slate-300'}`}>
                        {dayNum}
                      </p>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {rooms.map((room) => (
                <tr key={room.id} className="hover:bg-slate-900/20">
                  <td className="sticky left-0 z-10 bg-[#0f172a] border-r border-slate-800 px-4 py-3.5 font-bold text-sm text-slate-200">
                    <div className="flex flex-col">
                      <span>Room {room.roomNumber}</span>
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                        {room.roomType.code}
                      </span>
                    </div>
                  </td>
                  {dateArray.map((date, idx) => {
                    const booking = getBookingForRoomAndDate(room.id, date);
                    const isToday = date.toDateString() === new Date().toDateString();

                    if (booking) {
                      // Determine status color
                      let blockColor = 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30';
                      if (booking.status === 'CHECKED_IN') {
                        blockColor = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
                      } else if (booking.status === 'CHECKED_OUT') {
                        blockColor = 'bg-slate-800 text-slate-500 border-slate-700';
                      }

                      return (
                        <td 
                          key={idx} 
                          onClick={() => setSelectedBooking(booking)}
                          className={`p-1 border-r border-slate-800 text-center cursor-pointer transition-colors hover:bg-slate-800/20`}
                        >
                          <div className={`py-1.5 px-2 rounded-lg border text-[10px] font-black uppercase truncate tracking-wide ${blockColor}`}>
                            {booking.guest.firstName}
                          </div>
                        </td>
                      );
                    }

                    // Empty cell -> Quick booking link
                    const checkinDateStr = date.toISOString().split('T')[0];
                    const checkoutDate = new Date(date);
                    checkoutDate.setDate(checkoutDate.getDate() + 1);
                    const checkoutDateStr = checkoutDate.toISOString().split('T')[0];

                    return (
                      <td 
                        key={idx} 
                        className={`border-r border-slate-800 text-center ${isToday ? 'bg-indigo-500/[0.02]' : ''}`}
                      >
                        <Link 
                          href={`/hotel/bookings?roomId=${room.id}&arr=${checkinDateStr}&dep=${checkoutDateStr}`}
                          className="block py-4 text-transparent hover:text-indigo-500 text-[10px] font-black uppercase transition-all"
                        >
                          + Book
                        </Link>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Booking Detail Drawer/Modal */}
      {selectedBooking && (
        <div className="p-6 rounded-3xl bg-[#0f172a] border border-slate-800 max-w-xl space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-300 flex items-center gap-2">
              <Bookmark size={16} className="text-indigo-400" /> Booking Information
            </h3>
            <button 
              onClick={() => setSelectedBooking(null)}
              className="text-xs font-bold text-slate-500 hover:text-slate-300"
            >
              Close Details
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase">Guest Name</p>
              <p className="font-bold text-white flex items-center gap-2 mt-1">
                <User size={14} className="text-slate-400" />
                {selectedBooking.guest.firstName} {selectedBooking.guest.lastName}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase">Contact Mobile</p>
              <p className="font-bold text-white flex items-center gap-2 mt-1">
                <Phone size={14} className="text-slate-400" />
                {selectedBooking.guest.mobile || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase">Booking Reference</p>
              <p className="font-bold text-indigo-400 mt-1">{selectedBooking.bookingNo}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase">Status</p>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-800 text-slate-300">
                {selectedBooking.status}
              </span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase">Stay Dates</p>
              <p className="text-slate-300 mt-1">
                {new Date(selectedBooking.arrivalDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - {new Date(selectedBooking.departureDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase">Financial Dues</p>
              <p className="font-bold text-rose-400 mt-1">
                ₹{selectedBooking.dueAmount} <span className="text-[10px] text-slate-500 font-normal">(Total: ₹{selectedBooking.totalAmount})</span>
              </p>
            </div>
          </div>
          {selectedBooking.status === 'CONFIRMED' && (
            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <Link
                href={`/hotel/checkin?resId=${selectedBooking.id}`}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors"
              >
                Go to Check-in
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
