'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Sparkles, 
  Loader2, 
  Plus, 
  Search, 
  CalendarDays, 
  User, 
  Mail, 
  Phone,
  Bookmark,
  Check
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

// Separate inner component to use search params safely inside Suspense
function BookingsContent() {
  const searchParams = useSearchParams();
  const paramRoomId = searchParams.get('roomId') || '';
  const paramArrival = searchParams.get('arr') || '';
  const paramDeparture = searchParams.get('dep') || '';

  const [bookings, setBookings] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [arrivalDate, setArrivalDate] = useState(paramArrival || new Date().toISOString().split('T')[0]);
  const [departureDate, setDepartureDate] = useState(paramDeparture || '');
  const [adults, setAdults] = useState('1');
  const [children, setChildren] = useState('0');
  const [roomTypeId, setRoomTypeId] = useState('');
  const [assignedRoomId, setAssignedRoomId] = useState(paramRoomId || '');
  const [totalAmount, setTotalAmount] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('0');

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/hotel/bookings').then((res) => res.json()),
      fetch('/api/hotel/rooms').then((res) => res.json()),
      fetch('/api/hotel/room-types').then((res) => res.json()),
    ])
      .then(([bookingsRes, roomsRes, typesRes]) => {
        if (bookingsRes.success) setBookings(bookingsRes.data);
        if (roomsRes.success) setRooms(roomsRes.data);
        if (typesRes.success) setRoomTypes(typesRes.data);
        
        // If pre-filled parameters were passed, auto-configure room type
        if (paramRoomId && roomsRes.success) {
          const selectedRoom = roomsRes.data.find((r: any) => r.id === paramRoomId);
          if (selectedRoom) {
            setRoomTypeId(selectedRoom.roomTypeId);
            // Auto calculate default pricing based on nights
            if (paramArrival && paramDeparture) {
              const nights = Math.max(1, Math.round((new Date(paramDeparture).getTime() - new Date(paramArrival).getTime()) / (1000 * 60 * 60 * 24)));
              setTotalAmount((selectedRoom.roomType.baseRate * nights).toString());
            }
          }
          setShowAddForm(true);
        }
        
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching bookings:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, [paramRoomId, paramArrival, paramDeparture]);

  // Recalculate rent when dates or roomType changes
  useEffect(() => {
    if (arrivalDate && departureDate && roomTypeId) {
      const type = roomTypes.find((t) => t.id === roomTypeId);
      if (type) {
        const nights = Math.max(1, Math.round((new Date(departureDate).getTime() - new Date(arrivalDate).getTime()) / (1000 * 60 * 60 * 24)));
        if (!isNaN(nights) && nights > 0) {
          setTotalAmount((type.baseRate * nights).toString());
        }
      }
    }
  }, [arrivalDate, departureDate, roomTypeId, roomTypes]);

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !arrivalDate || !departureDate || !roomTypeId) {
      toast.error('First Name, Arrival/Departure dates, and Room Type are required.');
      return;
    }

    try {
      const res = await fetch('/api/hotel/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestData: {
            firstName,
            lastName,
            email,
            mobile,
          },
          arrivalDate,
          departureDate,
          adults: Number(adults),
          children: Number(children),
          roomTypeId,
          assignedRoomId: assignedRoomId || null,
          totalAmount: Number(totalAmount || 0),
          advanceAmount: Number(advanceAmount || 0),
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Reservation created successfully!');
        // Reset form
        setFirstName('');
        setLastName('');
        setEmail('');
        setMobile('');
        setDepartureDate('');
        setRoomTypeId('');
        setAssignedRoomId('');
        setTotalAmount('');
        setAdvanceAmount('0');
        setShowAddForm(false);
        // Refresh bookings
        loadData();
      } else {
        toast.error(data.message || 'Booking creation failed.');
      }
    } catch (err) {
      toast.error('Connection error creating booking.');
    }
  };

  const filteredBookings = bookings.filter((b) => {
    const q = searchQuery.toLowerCase();
    const guestName = `${b.guest.firstName} ${b.guest.lastName || ''}`.toLowerCase();
    const bookingNo = b.bookingNo.toLowerCase();
    return guestName.includes(q) || bookingNo.includes(q);
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-indigo-400">
            <Sparkles size={12} /> Reservations Manager
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-white leading-none">
            Bookings & Scheduling
          </h1>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 self-start"
        >
          <Plus size={16} /> New Reservation
        </button>
      </div>

      {/* New Booking Form Panel */}
      {showAddForm && (
        <form onSubmit={handleCreateBooking} className="p-6 rounded-3xl bg-[#0f172a] border border-slate-800 space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-black uppercase tracking-widest text-indigo-400">Create Reservation</h3>
            <button 
              type="button" 
              onClick={() => setShowAddForm(false)}
              className="text-xs text-slate-500 hover:text-slate-300 font-bold"
            >
              Cancel
            </button>
          </div>

          {/* Guest Info Group */}
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">1. Guest Details</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">First Name *</label>
                <input
                  type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Last Name</label>
                <input
                  type="text" value={lastName} onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Mobile Phone</label>
                <input
                  type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Email Address</label>
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Stay Info Group */}
          <div className="space-y-3 pt-3 border-t border-slate-800/60">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">2. Stay Details</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Arrival Date *</label>
                <input
                  type="date" required value={arrivalDate} onChange={(e) => setArrivalDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Departure Date *</label>
                <input
                  type="date" required value={departureDate} onChange={(e) => setDepartureDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Room Type Category *</label>
                <select
                  required value={roomTypeId} onChange={(e) => setRoomTypeId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="">Select Category</option>
                  {roomTypes.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} (Rate: ₹{t.baseRate})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Assign Room (Optional)</label>
                <select
                  value={assignedRoomId} onChange={(e) => setAssignedRoomId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="">Auto-Assign Later</option>
                  {rooms
                    .filter((r) => r.roomTypeId === roomTypeId && r.status === 'AVAILABLE')
                    .map((r) => (
                      <option key={r.id} value={r.id}>Room {r.roomNumber}</option>
                    ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Adults</label>
                <input
                  type="number" min="1" value={adults} onChange={(e) => setAdults(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Children</label>
                <input
                  type="number" min="0" value={children} onChange={(e) => setChildren(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Total Amount (₹)</label>
                <input
                  type="number" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-indigo-400 font-bold text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Advance Deposit Paid (₹)</label>
                <input
                  type="number" value={advanceAmount} onChange={(e) => setAdvanceAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-emerald-400 font-bold text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all"
            >
              Confirm Reservation
            </button>
          </div>
        </form>
      )}

      {/* Bookings Search & List Panel */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-3 text-slate-500" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Guest Name or Booking No..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Bookings Table */}
        <div className="rounded-3xl bg-[#0f172a] border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/40 text-[10px] font-black uppercase tracking-widest text-slate-400 text-left">
                  <th className="px-6 py-4">Booking No</th>
                  <th className="px-6 py-4">Guest</th>
                  <th className="px-6 py-4">Dates</th>
                  <th className="px-6 py-4">Room Type</th>
                  <th className="px-6 py-4">Assigned Room</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Dues</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-sm text-slate-200">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500 text-xs italic">
                      No reservations found.
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((b) => {
                    const arrStr = new Date(b.arrivalDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                    const depStr = new Date(b.departureDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                    
                    let statusColor = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
                    if (b.status === 'CHECKED_IN') {
                      statusColor = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
                    } else if (b.status === 'CHECKED_OUT') {
                      statusColor = 'bg-slate-800 text-slate-500 border-slate-700';
                    }

                    return (
                      <tr key={b.id} className="hover:bg-slate-900/20">
                        <td className="px-6 py-3.5 font-bold text-indigo-400">{b.bookingNo}</td>
                        <td className="px-6 py-3.5">
                          <div className="flex flex-col">
                            <span className="font-bold text-white">{b.guest.firstName} {b.guest.lastName}</span>
                            <span className="text-[10px] text-slate-500">{b.guest.mobile || 'No Mobile'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="text-xs">{arrStr} - {depStr}</span>
                        </td>
                        <td className="px-6 py-3.5 text-xs text-slate-300">{b.roomType.name}</td>
                        <td className="px-6 py-3.5">
                          {b.rooms?.[0]?.room ? (
                            <span className="font-bold text-white bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/50">
                              Room {b.rooms[0].room.roomNumber}
                            </span>
                          ) : (
                            <span className="text-slate-500 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="px-6 py-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${statusColor}`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 font-bold text-rose-400">₹{b.dueAmount}</td>
                        <td className="px-6 py-3.5 text-right">
                          {b.status === 'CONFIRMED' && (
                            <Link
                              href={`/hotel/checkin?resId=${b.id}`}
                              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-wider transition-colors inline-block"
                            >
                              Check-In
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingsPage() {
  return (
    <Suspense fallback={
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    }>
      <BookingsContent />
      <Toaster position="top-right" richColors />
    </Suspense>
  );
}
